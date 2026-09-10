"""
CANONIX National Material API Endpoints (Phase 5)
Provides:
- GET /api/v1/national-materials
- POST /api/v1/national-materials
- POST /api/v1/national-materials/from-match/{match_id}
- GET /api/v1/national-materials/{id}
- PATCH /api/v1/national-materials/{id}
- POST /api/v1/national-materials/{id}/approve
- POST /api/v1/national-materials/{id}/reject
- GET /api/v1/national-materials/{id}/mappings
- POST /api/v1/national-materials/{id}/mappings
- POST /api/v1/national-materials/mappings/{mapping_id}/approve
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.national_material import NationalMaterial
from app.models.material_mapping import MaterialMapping
from app.api.deps import require_material_expert, get_current_user, get_current_active_user
from app.schemas.national_material import (
    NationalMaterialListResponse,
    NationalMaterialListItem,
    NationalMaterialDetail,
    NationalMaterialCreate,
    NationalMaterialFromMatchRequest,
    NationalMaterialRejectRequest,
    MaterialMappingItem,
    MaterialMappingCreate,
)
from app.services.national_material_service import (
    search_national_materials,
    create_national_material,
    create_national_material_from_match,
    approve_national_material,
    reject_national_material,
    map_legacy_material,
    approve_material_mapping,
)

router = APIRouter(tags=["National Materials"])


def serialize_mapping(m: MaterialMapping) -> Dict[str, Any]:
    return {
        "id": m.id,
        "national_material_id": m.national_material_id,
        "material_id": m.material_id,
        "material_code": m.material.material_code if m.material else "",
        "material_raw_description": m.material.raw_description if m.material else "",
        "material_canonical_description": m.material.canonical_description if m.material else None,
        "cpse_code": m.cpse.code if m.cpse else "",
        "cpse_name": m.cpse.name if m.cpse else "",
        "mapping_type": m.mapping_type,
        "confidence_score": m.confidence_score,
        "status": m.status,
        "notes": m.notes,
        "created_at": m.created_at.isoformat() if m.created_at else "",
    }


def serialize_detail(nat: NationalMaterial) -> Dict[str, Any]:
    return {
        "id": nat.id,
        "national_material_code": nat.national_material_code,
        "canonical_description": nat.canonical_description,
        "material_type": nat.material_type,
        "material_group": nat.material_group,
        "material_dna": nat.material_dna or {},
        "status": nat.status,
        "originating_match_id": nat.originating_match_id,
        "ai_evidence": nat.ai_evidence or {},
        "mappings": [serialize_mapping(m) for m in nat.mappings],
        "created_at": nat.created_at.isoformat() if nat.created_at else "",
        "approved_at": nat.approved_at.isoformat() if nat.approved_at else None,
        "approved_by": nat.approved_by,
    }


def serialize_list_item(nat: NationalMaterial) -> Dict[str, Any]:
    return {
        "id": nat.id,
        "national_material_code": nat.national_material_code,
        "canonical_description": nat.canonical_description,
        "material_type": nat.material_type,
        "material_group": nat.material_group,
        "status": nat.status,
        "mapped_count": len(nat.mappings) if nat.mappings else 0,
        "created_at": nat.created_at.isoformat() if nat.created_at else "",
    }


@router.get("/national-materials", response_model=NationalMaterialListResponse)
def get_national_materials_endpoint(
    q: Optional[str] = Query(None, description="Search term for code, description, type, group"),
    status: Optional[str] = Query(None, description="Status filter (PENDING_APPROVAL, APPROVED, REJECTED)"),
    material_type: Optional[str] = Query(None, description="Filter by material type"),
    material_group: Optional[str] = Query(None, description="Filter by material group"),
    cpse_id: Optional[int] = Query(None, description="Filter by mapped CPSE"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Search and retrieve paginated National Material Identities.
    Accessible to all authenticated users.
    """
    res = search_national_materials(
        db=db,
        q=q,
        status=status,
        material_type=material_type,
        material_group=material_group,
        cpse_id=cpse_id,
        page=page,
        page_size=page_size,
    )
    return NationalMaterialListResponse(
        items=[serialize_list_item(nat) for nat in res["items"]],
        total=res["total"],
        page=res["page"],
        page_size=res["page_size"],
        total_pages=res["total_pages"],
    )


@router.post("/national-materials", response_model=NationalMaterialDetail)
def create_national_material_endpoint(
    payload: NationalMaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Directly creates a National Material Identity.
    Requires Material Expert or Super Admin role.
    """
    try:
        nat = create_national_material(db, user=current_user, data=payload.dict())
        return NationalMaterialDetail(**serialize_detail(nat))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/national-materials/from-match/{match_id}")
def create_from_match_endpoint(
    match_id: int,
    payload: Optional[NationalMaterialFromMatchRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Creates a National Material Identity strictly from an APPROVED AI Match.
    Server-side verification enforces:
    - Match exists
    - Match status == 'APPROVED' (PENDING or REJECTED matches are rejected)
    - Reviewer exists
    - Match is eligible (SAME, NEAR_DUPLICATE, or confirmed FUNCTIONALLY_EQUIVALENT)
    - Legacy mappings strictly default to status = PENDING.
    """
    req_data = payload.dict() if payload else {}
    include_cand = req_data.get("include_candidate_mapping", True)

    try:
        result = create_national_material_from_match(
            db=db,
            match_id=match_id,
            user=current_user,
            data=req_data,
            include_candidate_mapping=include_cand,
        )
        nat = result["national_material"]
        return {
            "national_material": serialize_detail(nat),
            "message": result["message"],
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/national-materials/{id}", response_model=NationalMaterialDetail)
def get_national_material_detail_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves full details for a National Material Identity, including structured DNA,
    AI evidence lineage, and mapped legacy CPSE materials.
    """
    nat = db.query(NationalMaterial).filter(NationalMaterial.id == id).first()
    if not nat:
        raise HTTPException(status_code=404, detail="National Material not found.")

    return NationalMaterialDetail(**serialize_detail(nat))


@router.patch("/national-materials/{id}", response_model=NationalMaterialDetail)
def update_national_material_endpoint(
    id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Updates editable fields of a National Material (canonical_description, material_type, material_group, material_dna).
    """
    nat = db.query(NationalMaterial).filter(NationalMaterial.id == id).first()
    if not nat:
        raise HTTPException(status_code=404, detail="National Material not found.")

    if "canonical_description" in payload and payload["canonical_description"]:
        nat.canonical_description = str(payload["canonical_description"]).strip()
    if "material_type" in payload and payload["material_type"]:
        nat.material_type = str(payload["material_type"]).strip().upper()
    if "material_group" in payload and payload["material_group"]:
        nat.material_group = str(payload["material_group"]).strip().upper()
    if "material_dna" in payload and isinstance(payload["material_dna"], dict):
        nat.material_dna = payload["material_dna"]

    db.commit()
    db.refresh(nat)
    return NationalMaterialDetail(**serialize_detail(nat))


@router.post("/national-materials/{id}/approve", response_model=NationalMaterialDetail)
def approve_national_material_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Authorizes a proposed National Material Identity and promotes its pending legacy mappings to APPROVED.
    """
    try:
        nat = approve_national_material(db, national_material_id=id, user=current_user)
        return NationalMaterialDetail(**serialize_detail(nat))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/national-materials/{id}/reject", response_model=NationalMaterialDetail)
def reject_national_material_endpoint(
    id: int,
    payload: NationalMaterialRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Rejects a proposed National Material Identity. Requires mandatory reason.
    """
    try:
        nat = reject_national_material(db, national_material_id=id, user=current_user, reason=payload.reason)
        return NationalMaterialDetail(**serialize_detail(nat))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/national-materials/{id}/mappings", response_model=List[MaterialMappingItem])
def get_national_material_mappings_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves all legacy CPSE material mappings linked to this National Material.
    """
    nat = db.query(NationalMaterial).filter(NationalMaterial.id == id).first()
    if not nat:
        raise HTTPException(status_code=404, detail="National Material not found.")

    return [serialize_mapping(m) for m in nat.mappings]


@router.post("/national-materials/{id}/mappings", response_model=MaterialMappingItem)
def create_national_material_mapping_endpoint(
    id: int,
    payload: MaterialMappingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Maps a legacy CPSE material to an existing National Material Identity.
    Status starts strictly as PENDING.
    """
    try:
        mapping = map_legacy_material(
            db=db,
            national_material_id=id,
            material_id=payload.material_id,
            mapping_type=payload.mapping_type,
            confidence_score=payload.confidence_score,
            user=current_user,
            notes=payload.notes,
        )
        return serialize_mapping(mapping)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/national-materials/mappings/{mapping_id}/approve", response_model=MaterialMappingItem)
def approve_mapping_endpoint(
    mapping_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Approves a pending legacy material mapping.
    """
    try:
        mapping = approve_material_mapping(db=db, mapping_id=mapping_id, user=current_user)
        return serialize_mapping(mapping)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
