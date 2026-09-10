"""
CANONIX Expert Review API Endpoints (Phase 5)
Provides:
- GET /api/v1/expert/review-queue
- POST /api/v1/matches/{id}/approve
- POST /api/v1/matches/{id}/reject
- POST /api/v1/matches/{id}/modify
- GET /api/v1/expert/dashboard-metrics
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.api.deps import require_material_expert, get_current_user
from app.schemas.expert_review import (
    ReviewActionRequest,
    ReviewQueueResponse,
    ExpertDashboardMetricsResponse,
)
from app.services.expert_review_service import (
    get_review_queue,
    review_match,
    get_expert_dashboard_metrics,
)

router = APIRouter(tags=["Expert Review"])


@router.get("/expert/review-queue", response_model=ReviewQueueResponse)
def get_expert_review_queue_endpoint(
    status: str = Query("PENDING", description="Match status to filter (PENDING, APPROVED, REJECTED)"),
    relationship_type: Optional[str] = Query(None, description="Filter by relationship type"),
    min_score: Optional[float] = Query(None, description="Minimum match final score"),
    max_score: Optional[float] = Query(None, description="Maximum match final score"),
    material_type: Optional[str] = Query(None, description="Filter by material type"),
    cpse_id: Optional[int] = Query(None, description="Filter by CPSE ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Retrieves the priority-ranked queue of AI match recommendations awaiting expert human validation.
    Enforces role access (MATERIAL_EXPERT or SUPER_ADMIN).
    """
    queue_data = get_review_queue(
        db=db,
        status_filter=status,
        relationship_type=relationship_type,
        min_score=min_score,
        max_score=max_score,
        material_type=material_type,
        cpse_id=cpse_id,
        page=page,
        page_size=page_size,
    )
    return ReviewQueueResponse(**queue_data)


@router.post("/matches/{id}/approve")
def approve_match_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Expert approves the AI match recommendation.
    Enforces engineering safety: cannot approve a hard-blocked match as SAME.
    """
    try:
        match = review_match(
            db=db,
            match_id=id,
            user=current_user,
            action="APPROVE",
            comment="Approved by expert reviewer.",
        )
        return {
            "match_id": match.id,
            "status": match.status,
            "relationship_type": match.relationship_type,
            "reviewed_by": current_user.email,
            "message": f"Match {id} successfully approved.",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/matches/{id}/reject")
def reject_match_endpoint(
    id: int,
    payload: ReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Expert rejects candidate match recommendation.
    Requires mandatory explanatory comment.
    """
    if not payload.comment or not payload.comment.strip():
        raise HTTPException(status_code=400, detail="Rejection requires an explanatory comment.")

    try:
        match = review_match(
            db=db,
            match_id=id,
            user=current_user,
            action="REJECT",
            comment=payload.comment,
        )
        return {
            "match_id": match.id,
            "status": match.status,
            "relationship_type": match.relationship_type,
            "reviewed_by": current_user.email,
            "message": f"Match {id} rejected.",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/matches/{id}/modify")
def modify_match_endpoint(
    id: int,
    payload: ReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Expert modifies relationship type for candidate match.
    Requires mandatory comment and target relationship.
    """
    if not payload.comment or not payload.comment.strip():
        raise HTTPException(status_code=400, detail="Modifying a relationship requires an explanatory comment.")
    if not payload.modified_relationship:
        raise HTTPException(status_code=400, detail="Modified relationship type is required.")

    try:
        match = review_match(
            db=db,
            match_id=id,
            user=current_user,
            action="MODIFY",
            comment=payload.comment,
            modified_relationship=payload.modified_relationship,
        )
        return {
            "match_id": match.id,
            "status": match.status,
            "relationship_type": match.relationship_type,
            "reviewed_by": current_user.email,
            "message": f"Match {id} updated to {match.relationship_type}.",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/expert/dashboard-metrics", response_model=ExpertDashboardMetricsResponse)
def get_expert_metrics_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_material_expert),
):
    """
    Returns real database metrics for the Material Expert workstation.
    Zero hardcoded values.
    """
    metrics = get_expert_dashboard_metrics(db)
    return ExpertDashboardMetricsResponse(**metrics)
