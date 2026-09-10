"""
CANONIX Master Matching Service
Coordinates the end-to-end AI candidate discovery and matching flow:
1. Normalization requirement validation (Rejects unnormalized records).
2. Local Sentence Transformer embedding generation.
3. Top-K Vector candidate discovery.
4. Structured attribute comparison (MATCH / MISMATCH / UNKNOWN / NOT_APPLICABLE).
5. Engineering hard constraints evaluation.
6. Configurable hybrid score synthesis.
7. Relationship classification.
8. Explainable narrative generation.
9. Canonical pair deduplication (material_a_id < material_b_id).
"""

import logging
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.material import Material
from app.models.material_match import MaterialMatch
from app.services.matching.config import DEFAULT_TOP_K
from app.services.matching.embedding_service import embed_material, batch_embed_materials
from app.services.matching.vector_search import find_top_k_candidates
from app.services.matching.attribute_similarity import compare_technical_attributes
from app.services.matching.engineering_rules import evaluate_engineering_rules
from app.services.matching.scoring import calculate_hybrid_score, compute_classification_score
from app.services.matching.relationship_classifier import classify_relationship
from app.services.matching.explanation import generate_match_explanation

logger = logging.getLogger(__name__)


def match_single_material(
    material_id: int,
    db: Session,
    top_k: int = DEFAULT_TOP_K,
    target_cpse_id: Optional[int] = None,
) -> List[MaterialMatch]:
    """
    Executes candidate discovery and pairwise engineering matching for a single material.
    Requires material to be NORMALIZED.
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise ValueError(f"Material with ID {material_id} not found.")

    if material.normalization_status != "NORMALIZED":
        raise ValueError("Cannot run matching for unnormalized material.")

    # 1. Ensure embedding is generated and fresh
    embed_material(material, db)

    # 2. Retrieve Top-K semantic candidates (excluding self)
    candidates_with_scores = find_top_k_candidates(material_id, db, top_k=top_k, target_cpse_id=target_cpse_id)
    if not candidates_with_scores:
        return []

    created_or_updated_matches: List[MaterialMatch] = []

    for candidate, semantic_sim in candidates_with_scores:
        # Candidate must also have normalized attributes/DNA
        if candidate.normalization_status != "NORMALIZED":
            continue

        # 3. Attribute comparison
        attr_score, details = compare_technical_attributes(material, candidate)

        # 4. Engineering rules & hard blocks
        rules_res = evaluate_engineering_rules(material, candidate)

        # 5. Classification score
        class_score = compute_classification_score(material, candidate)

        # 6. Hybrid score
        final_score = calculate_hybrid_score(
            semantic_score=semantic_sim,
            attribute_score=attr_score,
            rule_score=rules_res["rule_score"],
            classification_score=class_score,
            hard_blocked=rules_res["hard_block"],
        )

        # 7. Relationship classification
        relationship = classify_relationship(final_score, hard_blocked=rules_res["hard_block"])

        # 8. Dynamic explanation
        explanation = generate_match_explanation(
            material, candidate, relationship, final_score, details, rules_res
        )

        # 9. Canonical pair ordering (material_a_id < material_b_id)
        id_a = min(material.id, candidate.id)
        id_b = max(material.id, candidate.id)

        existing_match = db.query(MaterialMatch).filter(
            MaterialMatch.material_a_id == id_a,
            MaterialMatch.material_b_id == id_b,
        ).first()

        if existing_match:
            existing_match.semantic_score = round(semantic_sim, 4)
            existing_match.attribute_score = attr_score
            existing_match.rule_score = rules_res["rule_score"]
            existing_match.classification_score = class_score
            existing_match.final_score = final_score
            existing_match.relationship_type = relationship
            existing_match.explanation = explanation
            existing_match.comparison_details = details
            existing_match.hard_blocked = rules_res["hard_block"]
            created_or_updated_matches.append(existing_match)
        else:
            new_match = MaterialMatch(
                material_a_id=id_a,
                material_b_id=id_b,
                semantic_score=round(semantic_sim, 4),
                attribute_score=attr_score,
                rule_score=rules_res["rule_score"],
                classification_score=class_score,
                final_score=final_score,
                relationship_type=relationship,
                explanation=explanation,
                comparison_details=details,
                hard_blocked=rules_res["hard_block"],
                status="PENDING",
            )
            db.add(new_match)
            created_or_updated_matches.append(new_match)

    db.commit()

    # Re-fetch with relationships loaded
    match_ids = [m.id for m in created_or_updated_matches]
    return db.query(MaterialMatch).filter(MaterialMatch.id.in_(match_ids)).order_by(MaterialMatch.final_score.desc()).all()


def batch_match_materials(
    db: Session,
    uploaded_file_id: Optional[int] = None,
    cpse_id: Optional[int] = None,
    top_k: int = DEFAULT_TOP_K,
) -> Dict[str, Any]:
    """
    Executes batch matching for arbitrary catalog sizes.
    Pre-generates embeddings in vectorized chunks, then discovers candidate matches.
    """
    query = db.query(Material).filter(Material.normalization_status == "NORMALIZED")
    if uploaded_file_id is not None:
        query = query.filter(Material.uploaded_file_id == uploaded_file_id)
    if cpse_id is not None:
        query = query.filter(Material.cpse_id == cpse_id)

    materials = query.all()
    if not materials:
        return {"total_materials": 0, "matches_created": 0}

    logger.info(f"Starting batch matching for {len(materials)} normalized materials...")

    # 1. Pre-generate embeddings in vectorized chunks
    batch_embed_materials(materials, db)

    # 2. Run matching per material with isolated commits
    total_matches = 0
    for m in materials:
        try:
            matches = match_single_material(m.id, db, top_k=top_k)
            total_matches += len(matches)
        except Exception as exc:
            logger.warning(f"Error matching material {m.material_code}: {exc}")
            continue

    return {
        "total_materials": len(materials),
        "matches_created": total_matches,
    }


def get_material_matches(material_id: int, db: Session) -> List[MaterialMatch]:
    """
    Retrieves all stored candidate matches involving the specified material.
    Supports either position (material_a or material_b).
    """
    return db.query(MaterialMatch).filter(
        or_(
            MaterialMatch.material_a_id == material_id,
            MaterialMatch.material_b_id == material_id,
        )
    ).order_by(MaterialMatch.final_score.desc()).all()
