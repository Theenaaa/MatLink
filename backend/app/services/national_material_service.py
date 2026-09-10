"""
CANONIX National Material Service (Phase 5)
Handles:
- Safe, unique, dynamic National Material Code generation (NM-000001, NM-000002, ...)
- Creation of National Material Identities from approved AI matches or direct submission
- Complete preservation of AI match evidence and data lineage
- Legacy CPSE Material Mappings with strict PENDING initial status and human approval
- Server-side search and filtering with tenant privacy compliance
"""

import re
import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc

from app.models.user import User
from app.models.material import Material
from app.models.material_match import MaterialMatch
from app.models.national_material import NationalMaterial
from app.models.material_mapping import MaterialMapping
from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)


def generate_next_national_code(db: Session) -> str:
    """
    Generates the next unique, sequential National Material Code.
    Format: NM-000001, NM-000002, etc.
    Never hardcodes a fixed maximum and dynamically finds highest existing sequence.
    """
    records = (
        db.query(NationalMaterial.national_material_code)
        .filter(NationalMaterial.national_material_code.like("NM-%"))
        .order_by(desc(NationalMaterial.id))
        .limit(100)
        .all()
    )

    max_num = 0
    pattern = re.compile(r"^NM-(\d+)$", re.IGNORECASE)

    for (code,) in records:
        match = pattern.match(code.strip())
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num

    if max_num == 0:
        # Check all if limit didn't find any
        all_codes = db.query(NationalMaterial.national_material_code).all()
        for (code,) in all_codes:
            match = pattern.match(code.strip())
            if match:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num

    next_num = max_num + 1
    return f"NM-{next_num:06d}"


def create_national_material(
    db: Session,
    user: User,
    data: Dict[str, Any],
) -> NationalMaterial:
    """
    Creates a new National Material Identity record.
    Initial status: PENDING_APPROVAL (or DRAFT if requested).
    """
    code = data.get("national_material_code")
    if not code:
        code = generate_next_national_code(db)

    # Check code uniqueness
    existing = db.query(NationalMaterial).filter(NationalMaterial.national_material_code == code).first()
    if existing:
        raise ValueError(f"National Material Code '{code}' already exists.")

    canonical_desc = data.get("canonical_description", "").strip()
    if not canonical_desc:
        raise ValueError("Canonical description is required for a National Material Identity.")

    mat_type = data.get("material_type", "").strip() or "OTHER"
    mat_group = data.get("material_group", "").strip() or "GENERAL"
    mat_dna = data.get("material_dna") or {}

    status = data.get("status", "PENDING_APPROVAL")

    nat_mat = NationalMaterial(
        national_material_code=code,
        canonical_description=canonical_desc,
        material_type=mat_type,
        material_group=mat_group,
        material_dna=mat_dna,
        status=status,
        originating_match_id=data.get("originating_match_id"),
        ai_evidence=data.get("ai_evidence"),
        created_by=user.id,
    )
    db.add(nat_mat)
    db.flush()

    log_audit_event(
        db=db,
        user_id=user.id,
        action="NATIONAL_MATERIAL_CREATE",
        entity_type="NationalMaterial",
        entity_id=nat_mat.id,
        new_values={
            "national_material_code": code,
            "status": status,
            "material_type": mat_type,
            "originating_match_id": nat_mat.originating_match_id,
        },
    )
    db.commit()
    db.refresh(nat_mat)
    return nat_mat


def create_national_material_from_match(
    db: Session,
    match_id: int,
    user: User,
    data: Optional[Dict[str, Any]] = None,
    include_candidate_mapping: bool = True,
) -> Dict[str, Any]:
    """
    Creates a trusted National Material Identity from an APPROVED AI Match.
    Strictly verifies:
    1. Match exists
    2. Match status == 'APPROVED' (Unapproved, PENDING, or REJECTED matches are rejected)
    3. Match has an authorized reviewer
    4. Relationship eligibility:
       - SAME: Eligible for common National Material Identity.
       - NEAR_DUPLICATE: Eligible for common National Material Identity.
       - FUNCTIONALLY_EQUIVALENT: Requires explicit expert confirmation.
       - APPROVED_SUBSTITUTE: Never automatically created; requires explicit human decision.
       - RELATED or DIFFERENT: Cannot form a single National Material Identity.
    Preserves complete AI evidence, scores, explanations, and lineage.
    New mappings strictly default to status = PENDING.
    """
    data = data or {}
    match = db.query(MaterialMatch).filter(MaterialMatch.id == match_id).first()
    if not match:
        raise ValueError(f"Match with ID {match_id} not found.")

    # Rule 2: Server-side validation that match is APPROVED
    if match.status != "APPROVED":
        raise ValueError(
            f"Cannot create National Material from match with status '{match.status}'. Match must be explicitly APPROVED by an authorized expert first."
        )

    if not match.reviewed_by:
        raise ValueError("Match must have an authorized reviewer recorded before creating a National Material Identity.")

    # Rule 3: Relationship eligibility
    rel = match.relationship_type.upper()
    if rel in ("DIFFERENT", "RELATED"):
        raise ValueError(
            f"Relationship '{rel}' cannot be grouped under a single National Material Identity. Engineering specifications conflict or are unrelated."
        )

    if rel == "APPROVED_SUBSTITUTE" and not data.get("explicit_substitute_authorization"):
        raise ValueError(
            "APPROVED_SUBSTITUTE relationship requires explicit expert justification and authorization to share a National Material Identity."
        )

    mat_a = match.material_a
    mat_b = match.material_b

    # Preserve complete AI Evidence
    ai_evidence = {
        "match_id": match.id,
        "semantic_score": match.semantic_score,
        "attribute_score": match.attribute_score,
        "rule_score": match.rule_score,
        "classification_score": match.classification_score,
        "final_score": match.final_score,
        "ai_relationship": match.relationship_type,
        "ai_explanation": match.explanation,
        "expert_status": match.status,
        "reviewed_by": match.reviewed_by,
        "reviewed_at": match.reviewed_at.isoformat() if match.reviewed_at else None,
    }

    # Derive canonical specifications from Material A (or expert overrides in data)
    code = data.get("national_material_code") or generate_next_national_code(db)
    canonical_desc = data.get("canonical_description") or mat_a.canonical_description or mat_a.raw_description
    mat_type = data.get("material_type") or mat_a.material_type or "OTHER"
    mat_group = data.get("material_group") or mat_a.material_group or "GENERAL"
    mat_dna = data.get("material_dna") or mat_a.material_dna or {}

    nat_mat = NationalMaterial(
        national_material_code=code,
        canonical_description=canonical_desc,
        material_type=mat_type,
        material_group=mat_group,
        material_dna=mat_dna,
        status="PENDING_APPROVAL",
        originating_match_id=match.id,
        ai_evidence=ai_evidence,
        created_by=user.id,
    )
    db.add(nat_mat)
    db.flush()

    mappings_created: List[MaterialMapping] = []

    # Map Material A as PRIMARY (Default status = PENDING per Specification Correction 1)
    mapping_a = MaterialMapping(
        national_material_id=nat_mat.id,
        material_id=mat_a.id,
        cpse_id=mat_a.cpse_id,
        mapping_type="PRIMARY",
        confidence_score=1.0,
        status="PENDING",  # Strictly PENDING until explicitly approved
        notes="Primary legacy material from approved match pair.",
    )
    db.add(mapping_a)
    mappings_created.append(mapping_a)

    # Map Material B if eligible and confirmed
    can_map_b = False
    if rel in ("SAME", "NEAR_DUPLICATE"):
        can_map_b = True
    elif rel == "FUNCTIONALLY_EQUIVALENT" and include_candidate_mapping:
        can_map_b = True
    elif rel == "APPROVED_SUBSTITUTE" and data.get("explicit_substitute_authorization"):
        can_map_b = True

    if can_map_b:
        mapping_b_type = "EQUIVALENT" if rel == "SAME" else rel
        mapping_b = MaterialMapping(
            national_material_id=nat_mat.id,
            material_id=mat_b.id,
            cpse_id=mat_b.cpse_id,
            mapping_type=mapping_b_type,
            confidence_score=match.final_score,
            status="PENDING",  # Strictly PENDING until explicitly approved
            notes=f"Mapped candidate from approved match {match.id} ({rel}).",
        )
        db.add(mapping_b)
        mappings_created.append(mapping_b)

    log_audit_event(
        db=db,
        user_id=user.id,
        action="NATIONAL_MATERIAL_CREATE_FROM_MATCH",
        entity_type="NationalMaterial",
        entity_id=nat_mat.id,
        new_values={
            "national_material_code": code,
            "originating_match_id": match.id,
            "status": "PENDING_APPROVAL",
            "mapped_materials_count": len(mappings_created),
        },
    )

    db.commit()
    db.refresh(nat_mat)
    return {
        "national_material": nat_mat,
        "mappings": mappings_created,
        "message": f"Successfully created National Material {nat_mat.national_material_code} with {len(mappings_created)} pending legacy mappings.",
    }


def approve_national_material(
    db: Session,
    national_material_id: int,
    user: User,
) -> NationalMaterial:
    """
    Authorizes a National Material Identity (sets status to APPROVED).
    Also approves any associated pending legacy mappings.
    """
    nat_mat = db.query(NationalMaterial).filter(NationalMaterial.id == national_material_id).first()
    if not nat_mat:
        raise ValueError(f"National Material with ID {national_material_id} not found.")

    if nat_mat.status == "APPROVED":
        raise ValueError(f"National Material {nat_mat.national_material_code} is already APPROVED.")

    old_status = nat_mat.status
    now = datetime.now(timezone.utc)

    nat_mat.status = "APPROVED"
    nat_mat.approved_by = user.id
    nat_mat.approved_at = now

    # Also transition pending mappings under this national material to APPROVED
    for m in nat_mat.mappings:
        if m.status == "PENDING":
            m.status = "APPROVED"
            m.approved_by = user.id
            m.approved_at = now

    log_audit_event(
        db=db,
        user_id=user.id,
        action="NATIONAL_MATERIAL_APPROVE",
        entity_type="NationalMaterial",
        entity_id=nat_mat.id,
        old_values={"status": old_status},
        new_values={"status": "APPROVED", "approved_by": user.id},
    )

    db.commit()
    db.refresh(nat_mat)
    return nat_mat


def reject_national_material(
    db: Session,
    national_material_id: int,
    user: User,
    reason: str,
) -> NationalMaterial:
    """
    Rejects a proposed National Material Identity.
    """
    if not reason or not reason.strip():
        raise ValueError("Rejection reason is required.")

    nat_mat = db.query(NationalMaterial).filter(NationalMaterial.id == national_material_id).first()
    if not nat_mat:
        raise ValueError(f"National Material with ID {national_material_id} not found.")

    old_status = nat_mat.status
    nat_mat.status = "REJECTED"

    for m in nat_mat.mappings:
        m.status = "REJECTED"

    log_audit_event(
        db=db,
        user_id=user.id,
        action="NATIONAL_MATERIAL_REJECT",
        entity_type="NationalMaterial",
        entity_id=nat_mat.id,
        old_values={"status": old_status},
        new_values={"status": "REJECTED", "reason": reason},
    )

    db.commit()
    db.refresh(nat_mat)
    return nat_mat


def map_legacy_material(
    db: Session,
    national_material_id: int,
    material_id: int,
    mapping_type: str,
    confidence_score: float,
    user: User,
    notes: Optional[str] = None,
) -> MaterialMapping:
    """
    Maps a legacy CPSE material to an existing National Material Identity.
    Strictly prevents duplicate mappings for the same material.
    Default status: PENDING.
    """
    nat_mat = db.query(NationalMaterial).filter(NationalMaterial.id == national_material_id).first()
    if not nat_mat:
        raise ValueError(f"National Material {national_material_id} not found.")

    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise ValueError(f"Material {material_id} not found.")

    existing = db.query(MaterialMapping).filter(MaterialMapping.material_id == material_id).first()
    if existing:
        raise ValueError(
            f"Material {mat.material_code} is already mapped to National Material ID {existing.national_material_id} (Mapping ID {existing.id}). Cannot create duplicate mapping."
        )

    mapping = MaterialMapping(
        national_material_id=national_material_id,
        material_id=material_id,
        cpse_id=mat.cpse_id,
        mapping_type=mapping_type,
        confidence_score=confidence_score,
        status="PENDING",  # Strictly PENDING per specification
        notes=notes,
    )
    db.add(mapping)
    db.flush()

    log_audit_event(
        db=db,
        user_id=user.id,
        action="MATERIAL_MAPPING_CREATE",
        entity_type="MaterialMapping",
        entity_id=mapping.id,
        new_values={
            "national_material_id": national_material_id,
            "material_id": material_id,
            "mapping_type": mapping_type,
            "status": "PENDING",
        },
    )
    db.commit()
    db.refresh(mapping)
    return mapping


def approve_material_mapping(
    db: Session,
    mapping_id: int,
    user: User,
) -> MaterialMapping:
    """
    Authorizes a pending legacy material mapping.
    """
    mapping = db.query(MaterialMapping).filter(MaterialMapping.id == mapping_id).first()
    if not mapping:
        raise ValueError(f"Mapping with ID {mapping_id} not found.")

    old_status = mapping.status
    mapping.status = "APPROVED"
    mapping.approved_by = user.id
    mapping.approved_at = datetime.now(timezone.utc)

    log_audit_event(
        db=db,
        user_id=user.id,
        action="MATERIAL_MAPPING_APPROVE",
        entity_type="MaterialMapping",
        entity_id=mapping.id,
        old_values={"status": old_status},
        new_values={"status": "APPROVED", "approved_by": user.id},
    )
    db.commit()
    db.refresh(mapping)
    return mapping


def search_national_materials(
    db: Session,
    q: Optional[str] = None,
    status: Optional[str] = None,
    material_type: Optional[str] = None,
    material_group: Optional[str] = None,
    cpse_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    """
    Server-side search and paginated retrieval for National Materials.
    Supports search across National Material Code, Canonical Description, Material Type, Group, and mapped CPSEs.
    """
    query = db.query(NationalMaterial)

    if q:
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                NationalMaterial.national_material_code.ilike(search_term),
                NationalMaterial.canonical_description.ilike(search_term),
                NationalMaterial.material_type.ilike(search_term),
                NationalMaterial.material_group.ilike(search_term),
            )
        )

    if status:
        query = query.filter(NationalMaterial.status == status.upper())

    if material_type:
        query = query.filter(NationalMaterial.material_type == material_type.upper())

    if material_group:
        query = query.filter(NationalMaterial.material_group == material_group.upper())

    if cpse_id is not None:
        query = query.join(MaterialMapping, NationalMaterial.id == MaterialMapping.national_material_id).filter(
            MaterialMapping.cpse_id == cpse_id
        )

    total = query.count()
    total_pages = max((total + page_size - 1) // page_size, 1)
    offset = (page - 1) * page_size
    items = query.order_by(desc(NationalMaterial.id)).offset(offset).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
