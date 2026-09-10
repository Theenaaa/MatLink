"""
CANONIX Relationship Classifier
Categorizes candidate pairs based on hybrid scores and engineering constraints:
- SAME: Identical technical specifications (Score >= 0.90, hard_blocked == False)
- NEAR_DUPLICATE: Minor non-functional variances (0.80 <= Score < 0.90, hard_blocked == False)
- FUNCTIONALLY_EQUIVALENT: Interchangeable service suitability (0.70 <= Score < 0.80, hard_blocked == False)
- RELATED: Same category or system component (0.55 <= Score < 0.70)
- DIFFERENT: Score < 0.55 OR hard constraint conflict (hard_blocked == True)
Never automatically assigns APPROVED_SUBSTITUTE without human expert authorization.
"""

from app.services.matching.config import (
    SAME_THRESHOLD,
    NEAR_DUPLICATE_THRESHOLD,
    FUNCTIONALLY_EQUIVALENT_THRESHOLD,
    RELATED_THRESHOLD,
)


def classify_relationship(final_score: float, hard_blocked: bool = False) -> str:
    """
    Classifies the technical relationship between two materials.
    """
    if hard_blocked:
        # Hard engineering conflicts forbid SAME, NEAR_DUPLICATE, or FUNCTIONALLY_EQUIVALENT
        if final_score >= RELATED_THRESHOLD:
            return "RELATED"
        return "DIFFERENT"

    if final_score >= SAME_THRESHOLD:
        return "SAME"
    elif final_score >= NEAR_DUPLICATE_THRESHOLD:
        return "NEAR_DUPLICATE"
    elif final_score >= FUNCTIONALLY_EQUIVALENT_THRESHOLD:
        return "FUNCTIONALLY_EQUIVALENT"
    elif final_score >= RELATED_THRESHOLD:
        return "RELATED"
    else:
        return "DIFFERENT"
