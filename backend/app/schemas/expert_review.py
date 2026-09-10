"""
CANONIX Expert Review Schemas (Phase 5)
Pydantic schemas for expert review actions, review queue, and dashboard metrics.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ReviewActionRequest(BaseModel):
    action: str = Field(..., description="Action to perform: APPROVE, REJECT, or MODIFY")
    comment: Optional[str] = Field(None, description="Mandatory for REJECT or MODIFY")
    modified_relationship: Optional[str] = Field(
        None,
        description="Required when action is MODIFY (SAME, NEAR_DUPLICATE, FUNCTIONALLY_EQUIVALENT, APPROVED_SUBSTITUTE, RELATED, DIFFERENT)",
    )


class ReviewQueueMaterialItem(BaseModel):
    id: int
    code: str
    description: str
    canonical: Optional[str] = None
    material_type: Optional[str] = None
    cpse_code: str
    cpse_name: str


class ReviewQueueItem(BaseModel):
    match_id: int
    priority: str
    material_a: ReviewQueueMaterialItem
    material_b: ReviewQueueMaterialItem
    relationship_type: str
    final_score: float
    semantic_score: float
    attribute_score: float
    rule_score: float
    hard_blocked: bool
    status: str
    explanation: str
    created_at: str


class ReviewQueueResponse(BaseModel):
    items: List[ReviewQueueItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class RecentReviewItem(BaseModel):
    id: int
    match_id: int
    action: str
    previous_relationship: Optional[str] = None
    new_relationship: Optional[str] = None
    comment: Optional[str] = None
    reviewer_email: str
    created_at: str


class ExpertDashboardMetricsResponse(BaseModel):
    pending_reviews: int
    approved_today: int
    rejected_today: int
    modified_today: int
    national_materials_awaiting_approval: int
    national_materials_approved: int
    total_legacy_mappings: int
    recent_reviews: List[RecentReviewItem]
