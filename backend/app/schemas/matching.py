"""
CANONIX Matching Pydantic Schemas
Defines request and response schemas for embeddings, candidate matches, comparisons, and matching metrics.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class EmbeddingResponse(BaseModel):
    material_id: int
    model_name: str
    embedding_version: str
    source_text_hash: str
    dimensions: int = 384
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class BatchEmbedRequest(BaseModel):
    uploaded_file_id: Optional[int] = None
    cpse_id: Optional[int] = None


class BatchEmbedResponse(BaseModel):
    total_embedded: int
    message: str


class MatchCandidateItem(BaseModel):
    match_id: int
    candidate_material_id: int
    candidate_material_code: str
    candidate_raw_description: str
    candidate_canonical_description: Optional[str] = None
    candidate_material_type: Optional[str] = None
    candidate_cpse_code: str
    candidate_cpse_name: str
    semantic_score: float
    attribute_score: float
    rule_score: float
    classification_score: float
    final_score: float
    relationship_type: str
    hard_blocked: bool
    explanation: str
    comparison_details: Dict[str, Any]
    status: str


class MatchDetailResponse(BaseModel):
    id: int
    material_a: Dict[str, Any]
    material_b: Dict[str, Any]
    semantic_score: float
    attribute_score: float
    rule_score: float
    classification_score: float
    final_score: float
    relationship_type: str
    hard_blocked: bool
    explanation: str
    comparison_details: Dict[str, Any]
    status: str
    created_at: str


class BatchMatchRequest(BaseModel):
    uploaded_file_id: Optional[int] = None
    cpse_id: Optional[int] = None
    top_k: int = 20


class BatchMatchResponse(BaseModel):
    total_materials: int
    matches_created: int
    message: str


class MatchingMetricsResponse(BaseModel):
    total_embeddings: int
    materials_awaiting_embedding: int
    total_matches_analyzed: int
    same_candidates: int
    near_duplicate_candidates: int
    functionally_equivalent_candidates: int
    related_candidates: int
    different_candidates: int
