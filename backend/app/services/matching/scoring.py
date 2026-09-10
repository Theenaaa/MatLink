"""
CANONIX Hybrid Scoring Engine
Computes configuration-driven hybrid match score combining:
- Semantic Vector Similarity (40%)
- Technical Attribute Comparison (30%)
- Engineering Rule Compliance (20%)
- Material Group Classification (10%)
Enforces hard constraint caps when critical engineering conflicts exist.
"""

from typing import Dict, Any, Tuple
from app.models.material import Material
from app.services.matching.config import (
    SEMANTIC_WEIGHT,
    ATTRIBUTE_WEIGHT,
    RULE_WEIGHT,
    CLASSIFICATION_WEIGHT,
)


def compute_classification_score(material_a: Material, material_b: Material) -> float:
    """
    Computes classification consistency score based on material_type and material_group.
    """
    dna_a: Dict[str, Any] = material_a.material_dna or {}
    dna_b: Dict[str, Any] = material_b.material_dna or {}

    t_a = (material_a.material_type or dna_a.get("material_type") or "OTHER").upper()
    t_b = (material_b.material_type or dna_b.get("material_type") or "OTHER").upper()

    g_a = (material_a.material_group or dna_a.get("material_group") or "GENERAL").upper()
    g_b = (material_b.material_group or dna_b.get("material_group") or "GENERAL").upper()

    if t_a != "OTHER" and t_b != "OTHER" and t_a == t_b:
        return 1.0
    if g_a != "GENERAL" and g_b != "GENERAL" and g_a == g_b:
        return 0.75

    return 0.30


def calculate_hybrid_score(
    semantic_score: float,
    attribute_score: float,
    rule_score: float,
    classification_score: float,
    hard_blocked: bool = False,
) -> float:
    """
    Calculates the configuration-driven hybrid score.
    If hard_blocked is True, caps the final score so it cannot qualify as SAME or NEAR_DUPLICATE.
    """
    score = (
        (semantic_score * SEMANTIC_WEIGHT)
        + (attribute_score * ATTRIBUTE_WEIGHT)
        + (rule_score * RULE_WEIGHT)
        + (classification_score * CLASSIFICATION_WEIGHT)
    )

    if hard_blocked:
        # A hard engineering block caps score strictly below candidate thresholds
        score = min(score, 0.50)

    return round(min(max(score, 0.0), 1.0), 4)
