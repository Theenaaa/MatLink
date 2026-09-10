"""
CANONIX Expert Review Service (Phase 5)
Handles:
- Priority-ranked Review Queue for Material Experts
- Human-in-the-Loop decision actions (APPROVE, REJECT, MODIFY)
- Strict validation rules (mandatory comments on reject/modify, hard block enforcement)
- Preservation of AI recommendations and audit history in review_actions
- Real database metrics for Expert Dashboard
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_

from app.models.user import User
from app.models.material import Material
from app.models.material_match import MaterialMatch
from app.models.review_action import ReviewAction
from app.models.national_material import NationalMaterial
from app.models.material_mapping import MaterialMapping
from app.services.audit_service import log_audit_event

logger = logging.getLogger(__name__)


def calculate_review_priority(match: MaterialMatch) -> str:
    """
    Computes deterministic review priority:
    - HIGH: Hard engineering blocks, borderline scores, or critical attribute mismatches.
    - MEDIUM: Uncertain/missing optional specs or medium scores.
    - LOW: High-confidence straightforward matches.
    """
    if match.hard_blocked:
        return "HIGH"

    # Borderline scores near thresholds
    score = match.final_score
    if (0.85 <= score <= 0.93) or (0.75 <= score <= 0.83) or (0.65 <= score <= 0.72):
        return "HIGH"

    details = match.comparison_details or {}
    for attr, info in details.items():
        if isinstance(info, dict) and info.get("status") == "MISMATCH":
            return "HIGH"

    # Medium priority if unknowns exist or moderate score
    for attr, info in details.items():
        if isinstance(info, dict) and info.get("status") == "UNKNOWN":
            return "MEDIUM"

    if score < 0.85:
        return "MEDIUM"

    return "LOW"


def get_review_queue(
    db: Session,
    status_filter: str = "PENDING",
    relationship_type: Optional[str] = None,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    material_type: Optional[str] = None,
    cpse_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    """
    Retrieves the priority-ranked queue of matches requiring expert human validation.
    """
    query = db.query(MaterialMatch)

    if status_filter:
        query = query.filter(MaterialMatch.status == status_filter.upper())

    if relationship_type:
        query = query.filter(MaterialMatch.relationship_type == relationship_type.upper())

    if min_score is not None:
        query = query.filter(MaterialMatch.final_score >= min_score)
    if max_score is not None:
        query = query.filter(MaterialMatch.final_score <= max_score)

    if cpse_id is not None:
        query = query.join(Material, or_(
            MaterialMatch.material_a_id == Material.id,
            MaterialMatch.material_b_id == Material.id,
        )).filter(Material.cpse_id == cpse_id)

    total = query.count()
    total_pages = max((total + page_size - 1) // page_size, 1)
    offset = (page - 1) * page_size

    # Order priority: pending hard blocked / borderline matches first
    matches = query.order_by(
        desc(MaterialMatch.hard_blocked),
        desc(MaterialMatch.final_score),
    ).offset(offset).limit(page_size).all()

    items = []
    for m in matches:
        priority = calculate_review_priority(m)
        mat_a = m.material_a
        mat_b = m.material_b
        items.append({
            "match_id": m.id,
            "priority": priority,
            "material_a": {
                "id": mat_a.id,
                "code": mat_a.material_code,
                "description": mat_a.raw_description,
                "canonical": mat_a.canonical_description,
                "material_type": mat_a.material_type,
                "cpse_code": mat_a.cpse.code if mat_a.cpse else "",
                "cpse_name": mat_a.cpse.name if mat_a.cpse else "",
            },
            "material_b": {
                "id": mat_b.id,
                "code": mat_b.material_code,
                "description": mat_b.raw_description,
                "canonical": mat_b.canonical_description,
                "material_type": mat_b.material_type,
                "cpse_code": mat_b.cpse.code if mat_b.cpse else "",
                "cpse_name": mat_b.cpse.name if mat_b.cpse else "",
            },
            "relationship_type": m.relationship_type,
            "final_score": m.final_score,
            "semantic_score": m.semantic_score,
            "attribute_score": m.attribute_score,
            "rule_score": m.rule_score,
            "hard_blocked": m.hard_blocked,
            "status": m.status,
            "explanation": m.explanation,
            "created_at": m.created_at.isoformat() if m.created_at else "",
        })

    # Sort queue by Priority (HIGH -> MEDIUM -> LOW) then score desc
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    items.sort(key=lambda x: (priority_order.get(x["priority"], 3), -x["final_score"]))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def review_match(
    db: Session,
    match_id: int,
    user: User,
    action: str,
    comment: Optional[str] = None,
    modified_relationship: Optional[str] = None,
) -> MaterialMatch:
    """
    Executes a human expert validation action:
    - APPROVE: Accepts AI recommendation.
    - REJECT: Rejects candidate match. Requires comment.
    - MODIFY: Expert alters relationship type. Requires comment.
    Enforces that hard-blocked matches cannot become SAME without justification.
    Maintains full audit and review history.
    """
    action = action.upper().strip()
    if action not in ("APPROVE", "REJECT", "MODIFY"):
        raise ValueError(f"Invalid review action '{action}'. Must be APPROVE, REJECT, or MODIFY.")

    match = db.query(MaterialMatch).filter(MaterialMatch.id == match_id).first()
    if not match:
        raise ValueError(f"Match with ID {match_id} not found.")

    old_status = match.status
    old_rel = match.relationship_type

    if old_status in ("APPROVED", "REJECTED") and action == old_status:
        raise ValueError(f"Match {match_id} has already been {old_status}.")

    now = datetime.now(timezone.utc)

    if action == "REJECT":
        if not comment or not comment.strip():
            raise ValueError("Rejection requires an explanatory comment.")
        new_status = "REJECTED"
        new_rel = old_rel

    elif action == "APPROVE":
        if match.hard_blocked and old_rel == "SAME":
            raise ValueError(
                "Cannot approve a hard-blocked match as SAME. Please use MODIFY to assign an appropriate alternative relationship or document justification."
            )
        new_status = "APPROVED"
        new_rel = old_rel

    elif action == "MODIFY":
        if not comment or not comment.strip():
            raise ValueError("Modifying a match relationship requires an explanatory comment.")
        if not modified_relationship:
            raise ValueError("Modified relationship type must be provided.")

        mod_rel = modified_relationship.upper().strip()
        allowed_types = {"SAME", "NEAR_DUPLICATE", "FUNCTIONALLY_EQUIVALENT", "APPROVED_SUBSTITUTE", "RELATED", "DIFFERENT"}
        if mod_rel not in allowed_types:
            raise ValueError(f"Invalid modified relationship '{mod_rel}'. Allowed: {', '.join(sorted(allowed_types))}")

        if mod_rel == "SAME" and match.hard_blocked:
            raise ValueError("Cannot assign SAME to a hard-blocked engineering conflict.")

        match.relationship_type = mod_rel
        new_status = "APPROVED"  # A modified match approved by human expert becomes APPROVED under the new relationship
        new_rel = mod_rel

    match.status = new_status
    match.reviewed_by = user.id
    match.reviewed_at = now

    # Record in review_actions
    rev_action = ReviewAction(
        match_id=match.id,
        reviewer_id=user.id,
        action=action,
        previous_status=old_status,
        new_status=new_status,
        previous_relationship=old_rel,
        new_relationship=new_rel,
        comment=comment,
        created_at=now,
    )
    db.add(rev_action)

    # Record in audit_logs
    log_audit_event(
        db=db,
        user_id=user.id,
        action=f"MATCH_{action}",
        entity_type="MaterialMatch",
        entity_id=match.id,
        old_values={"status": old_status, "relationship": old_rel},
        new_values={
            "status": new_status,
            "relationship": new_rel,
            "comment": comment,
            "reviewer": user.email,
        },
    )

    db.commit()
    db.refresh(match)
    return match


def get_expert_dashboard_metrics(db: Session) -> Dict[str, Any]:
    """
    Computes real database metrics for the Material Expert workstation.
    Zero hardcoded values.
    """
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    pending_reviews = db.query(func.count(MaterialMatch.id)).filter(MaterialMatch.status == "PENDING").scalar() or 0

    approved_today = (
        db.query(func.count(ReviewAction.id))
        .filter(ReviewAction.action == "APPROVE", ReviewAction.created_at >= today_start)
        .scalar() or 0
    )

    rejected_today = (
        db.query(func.count(ReviewAction.id))
        .filter(ReviewAction.action == "REJECT", ReviewAction.created_at >= today_start)
        .scalar() or 0
    )

    modified_today = (
        db.query(func.count(ReviewAction.id))
        .filter(ReviewAction.action == "MODIFY", ReviewAction.created_at >= today_start)
        .scalar() or 0
    )

    nat_pending = (
        db.query(func.count(NationalMaterial.id))
        .filter(NationalMaterial.status == "PENDING_APPROVAL")
        .scalar() or 0
    )

    nat_approved = (
        db.query(func.count(NationalMaterial.id))
        .filter(NationalMaterial.status == "APPROVED")
        .scalar() or 0
    )

    total_mappings = db.query(func.count(MaterialMapping.id)).scalar() or 0

    # Recent 5 actions
    recent_actions = (
        db.query(ReviewAction)
        .order_by(desc(ReviewAction.id))
        .limit(5)
        .all()
    )
    recent_list = []
    for a in recent_actions:
        recent_list.append({
            "id": a.id,
            "match_id": a.match_id,
            "action": a.action,
            "previous_relationship": a.previous_relationship,
            "new_relationship": a.new_relationship,
            "comment": a.comment,
            "reviewer_email": a.reviewer.email if a.reviewer else "",
            "created_at": a.created_at.isoformat() if a.created_at else "",
        })

    return {
        "pending_reviews": pending_reviews,
        "approved_today": approved_today,
        "rejected_today": rejected_today,
        "modified_today": modified_today,
        "national_materials_awaiting_approval": nat_pending,
        "national_materials_approved": nat_approved,
        "total_legacy_mappings": total_mappings,
        "recent_reviews": recent_list,
    }
