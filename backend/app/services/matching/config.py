"""
CANONIX Matching Engine Configuration
Centralized settings for embeddings, vector search, weights, and classification thresholds.
No magic numbers inside business logic.
"""

# Embedding Model Configuration
EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSION: int = 384
EMBEDDING_VERSION: str = "v1.0"

# Vector Search Retrieval Defaults
DEFAULT_TOP_K: int = 20

# Configurable Hybrid Scoring Weights (must sum to 1.0)
SEMANTIC_WEIGHT: float = 0.40
ATTRIBUTE_WEIGHT: float = 0.30
RULE_WEIGHT: float = 0.20
CLASSIFICATION_WEIGHT: float = 0.10

# Relationship Classification Score Thresholds
SAME_THRESHOLD: float = 0.90
NEAR_DUPLICATE_THRESHOLD: float = 0.80
FUNCTIONALLY_EQUIVALENT_THRESHOLD: float = 0.70
RELATED_THRESHOLD: float = 0.55

# Tolerance Settings
SIZE_TOLERANCE_PERCENT: float = 0.5  # 0.5% tolerance for numerical dimension equivalences
FLOW_TOLERANCE_PERCENT: float = 1.0  # 1.0% tolerance for flow rate equivalences
