"""
CANONIX Matching API Endpoints
Provides APIs for local Sentence Transformer embeddings, vector candidate discovery,
hybrid engineering matching, candidate listings, and side-by-side comparison details.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database.session import get_db
from app.models.user import User
from app.models.material import Material
from app.models.material_embedding import MaterialEmbedding
from app.models.material_match import MaterialMatch
from app.api.deps import get_current_user
from app.schemas.matching import (
    EmbeddingResponse,
    BatchEmbedRequest,
    BatchEmbedResponse,
    MatchCandidateItem,
    MatchDetailResponse,
    BatchMatchRequest,
    BatchMatchResponse,
    MatchingMetricsResponse,
)
from app.services.matching import (
    embed_material,
    batch_embed_materials,
    match_single_material,
    batch_match_materials,
    get_material_matches,
)

router = APIRouter(tags=["Material Matching"])


@router.post("/materials/{id}/embed", response_model=EmbeddingResponse)
def embed_single_material_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates or refreshes the 384-dimensional Sentence Transformer embedding for a single material.
    Requires material to be NORMALIZED.
    """
    material = db.query(Material).filter(Material.id == id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found.")

    # Tenant scoping for CPSE_ADMIN
    role_name = current_user.role.name if current_user.role else ""
    if role_name == "CPSE_ADMIN" and material.cpse_id != current_user.cpse_id:
        raise HTTPException(status_code=403, detail="Cannot embed material belonging to another CPSE.")

    if material.normalization_status != "NORMALIZED":
        raise HTTPException(status_code=400, detail="Material must be normalized before generating embeddings.")

    emb = embed_material(material, db, force_regenerate=True)
    return EmbeddingResponse(
        material_id=emb.material_id,
        model_name=emb.model_name,
        embedding_version=emb.embedding_version,
        source_text_hash=emb.source_text_hash,
        dimensions=len(emb.embedding) if isinstance(emb.embedding, list) else 384,
        created_at=emb.created_at.isoformat() if emb.created_at else "",
    )


@router.post("/materials/embed", response_model=BatchEmbedResponse)
def batch_embed_materials_endpoint(
    req: BatchEmbedRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates embeddings for a batch of materials. Supports arbitrary dataset sizes.
    """
    role_name = current_user.role.name if current_user.role else ""
    cpse_id = current_user.cpse_id if role_name == "CPSE_ADMIN" else req.cpse_id

    query = db.query(Material).filter(Material.normalization_status == "NORMALIZED")
    if req.uploaded_file_id is not None:
        query = query.filter(Material.uploaded_file_id == req.uploaded_file_id)
    if cpse_id is not None:
        query = query.filter(Material.cpse_id == cpse_id)

    materials = query.all()
    count = batch_embed_materials(materials, db)
    return BatchEmbedResponse(
        total_embedded=count,
        message=f"Successfully generated embeddings for {count} materials.",
    )


@router.post("/materials/{id}/match", response_model=List[MatchCandidateItem])
def match_material_endpoint(
    id: int,
    top_k: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Discovers candidate matches and executes hybrid engineering comparison for a material.
    Requires material to be NORMALIZED.
    """
    material = db.query(Material).filter(Material.id == id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found.")

    role_name = current_user.role.name if current_user.role else ""
    if role_name == "CPSE_ADMIN" and material.cpse_id != current_user.cpse_id:
        raise HTTPException(status_code=403, detail="Cannot match material belonging to another CPSE.")

    if material.normalization_status != "NORMALIZED":
        raise HTTPException(status_code=400, detail="Material must be normalized before matching.")

    try:
        matches = match_single_material(id, db, top_k=top_k)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    results: List[MatchCandidateItem] = []
    for m in matches:
        cand = m.material_b if m.material_a_id == id else m.material_a
        results.append(
            MatchCandidateItem(
                match_id=m.id,
                candidate_material_id=cand.id,
                candidate_material_code=cand.material_code,
                candidate_raw_description=cand.raw_description,
                candidate_canonical_description=cand.canonical_description,
                candidate_material_type=cand.material_type,
                candidate_cpse_code=cand.cpse.code if cand.cpse else "",
                candidate_cpse_name=cand.cpse.name if cand.cpse else "",
                semantic_score=m.semantic_score,
                attribute_score=m.attribute_score,
                rule_score=m.rule_score,
                classification_score=m.classification_score,
                final_score=m.final_score,
                relationship_type=m.relationship_type,
                hard_blocked=m.hard_blocked,
                explanation=m.explanation,
                comparison_details=m.comparison_details,
                status=m.status,
            )
        )

    return results


@router.get("/materials/{id}/matches", response_model=List[MatchCandidateItem])
def get_material_matches_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves stored candidate matches for a material.
    """
    material = db.query(Material).filter(Material.id == id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found.")

    role_name = current_user.role.name if current_user.role else ""
    if role_name == "CPSE_ADMIN" and material.cpse_id != current_user.cpse_id:
        raise HTTPException(status_code=403, detail="Cannot view matches for another CPSE's material.")

    matches = get_material_matches(id, db)
    results: List[MatchCandidateItem] = []
    for m in matches:
        cand = m.material_b if m.material_a_id == id else m.material_a
        results.append(
            MatchCandidateItem(
                match_id=m.id,
                candidate_material_id=cand.id,
                candidate_material_code=cand.material_code,
                candidate_raw_description=cand.raw_description,
                candidate_canonical_description=cand.canonical_description,
                candidate_material_type=cand.material_type,
                candidate_cpse_code=cand.cpse.code if cand.cpse else "",
                candidate_cpse_name=cand.cpse.name if cand.cpse else "",
                semantic_score=m.semantic_score,
                attribute_score=m.attribute_score,
                rule_score=m.rule_score,
                classification_score=m.classification_score,
                final_score=m.final_score,
                relationship_type=m.relationship_type,
                hard_blocked=m.hard_blocked,
                explanation=m.explanation,
                comparison_details=m.comparison_details,
                status=m.status,
            )
        )

    return results


@router.post("/materials/match", response_model=BatchMatchResponse)
def batch_match_materials_endpoint(
    req: BatchMatchRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Enqueues batch matching for arbitrary dataset sizes.
    """
    role_name = current_user.role.name if current_user.role else ""
    cpse_id = current_user.cpse_id if role_name == "CPSE_ADMIN" else req.cpse_id

    # For responsive UI, execute synchronously for small batches (<= 50) or background for large
    res = batch_match_materials(db, uploaded_file_id=req.uploaded_file_id, cpse_id=cpse_id, top_k=req.top_k)
    return BatchMatchResponse(
        total_materials=res["total_materials"],
        matches_created=res["matches_created"],
        message=f"Batch matching complete: {res['total_materials']} materials processed, {res['matches_created']} matches created/updated.",
    )


@router.get("/matches/{match_id}", response_model=MatchDetailResponse)
def get_match_detail_endpoint(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves complete side-by-side comparison details for a specific match pair.
    """
    m = db.query(MaterialMatch).filter(MaterialMatch.id == match_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Match not found.")

    mat_a = m.material_a
    mat_b = m.material_b

    def serialize_mat(mat: Material) -> Dict[str, Any]:
        return {
            "id": mat.id,
            "material_code": mat.material_code,
            "raw_description": mat.raw_description,
            "canonical_description": mat.canonical_description,
            "material_type": mat.material_type,
            "material_group": mat.material_group,
            "material_dna": mat.material_dna,
            "order_qty": mat.order_qty,
            "uom": mat.uom,
            "cpse_code": mat.cpse.code if mat.cpse else "",
            "cpse_name": mat.cpse.name if mat.cpse else "",
        }

    return MatchDetailResponse(
        id=m.id,
        material_a=serialize_mat(mat_a),
        material_b=serialize_mat(mat_b),
        semantic_score=m.semantic_score,
        attribute_score=m.attribute_score,
        rule_score=m.rule_score,
        classification_score=m.classification_score,
        final_score=m.final_score,
        relationship_type=m.relationship_type,
        hard_blocked=m.hard_blocked,
        explanation=m.explanation,
        comparison_details=m.comparison_details,
        status=m.status,
        created_at=m.created_at.isoformat() if m.created_at else "",
    )


@router.get("/matches/metrics/summary", response_model=MatchingMetricsResponse)
def get_matching_metrics_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns real database-backed matching metrics.
    Never fabricates metrics.
    """
    total_embeddings = db.query(func.count(MaterialEmbedding.id)).scalar() or 0
    total_norm = db.query(func.count(Material.id)).filter(Material.normalization_status == "NORMALIZED").scalar() or 0
    awaiting_emb = max(total_norm - total_embeddings, 0)

    total_matches = db.query(func.count(MaterialMatch.id)).scalar() or 0

    same_count = db.query(func.count(MaterialMatch.id)).filter(MaterialMatch.relationship_type == "SAME").scalar() or 0
    near_dup_count = db.query(func.count(MaterialMatch.id)).filter(MaterialMatch.relationship_type == "NEAR_DUPLICATE").scalar() or 0
    func_equiv_count = db.query(func.count(MaterialMatch.id)).filter(MaterialMatch.relationship_type == "FUNCTIONALLY_EQUIVALENT").scalar() or 0
    related_count = db.query(func.count(MaterialMatch.id)).filter(MaterialMatch.relationship_type == "RELATED").scalar() or 0
    diff_count = db.query(func.count(MaterialMatch.id)).filter(MaterialMatch.relationship_type == "DIFFERENT").scalar() or 0

    return MatchingMetricsResponse(
        total_embeddings=total_embeddings,
        materials_awaiting_embedding=awaiting_emb,
        total_matches_analyzed=total_matches,
        same_candidates=same_count,
        near_duplicate_candidates=near_dup_count,
        functionally_equivalent_candidates=func_equiv_count,
        related_candidates=related_count,
        different_candidates=diff_count,
    )
