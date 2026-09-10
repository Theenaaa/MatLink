"""
CANONIX Matching Engine Package
Exports embedding, vector candidate discovery, attribute comparison, engineering rules, scoring, and matching services.
"""

from app.services.matching.config import (
    EMBEDDING_MODEL,
    EMBEDDING_DIMENSION,
    EMBEDDING_VERSION,
    DEFAULT_TOP_K,
    SEMANTIC_WEIGHT,
    ATTRIBUTE_WEIGHT,
    RULE_WEIGHT,
    CLASSIFICATION_WEIGHT,
    SAME_THRESHOLD,
    NEAR_DUPLICATE_THRESHOLD,
    FUNCTIONALLY_EQUIVALENT_THRESHOLD,
    RELATED_THRESHOLD,
)
from app.services.matching.embedding_service import (
    get_embedding_model,
    generate_deterministic_embedding_text,
    compute_source_text_hash,
    embed_text,
    embed_material,
    batch_embed_materials,
)
from app.services.matching.vector_search import find_top_k_candidates
from app.services.matching.attribute_similarity import compare_technical_attributes
from app.services.matching.engineering_rules import evaluate_engineering_rules
from app.services.matching.scoring import calculate_hybrid_score, compute_classification_score
from app.services.matching.relationship_classifier import classify_relationship
from app.services.matching.explanation import generate_match_explanation
from app.services.matching.matching_service import (
    match_single_material,
    batch_match_materials,
    get_material_matches,
)

__all__ = [
    "EMBEDDING_MODEL",
    "EMBEDDING_DIMENSION",
    "EMBEDDING_VERSION",
    "DEFAULT_TOP_K",
    "SEMANTIC_WEIGHT",
    "ATTRIBUTE_WEIGHT",
    "RULE_WEIGHT",
    "CLASSIFICATION_WEIGHT",
    "SAME_THRESHOLD",
    "NEAR_DUPLICATE_THRESHOLD",
    "FUNCTIONALLY_EQUIVALENT_THRESHOLD",
    "RELATED_THRESHOLD",
    "get_embedding_model",
    "generate_deterministic_embedding_text",
    "compute_source_text_hash",
    "embed_text",
    "embed_material",
    "batch_embed_materials",
    "find_top_k_candidates",
    "compare_technical_attributes",
    "evaluate_engineering_rules",
    "calculate_hybrid_score",
    "compute_classification_score",
    "classify_relationship",
    "generate_match_explanation",
    "match_single_material",
    "batch_match_materials",
    "get_material_matches",
]
