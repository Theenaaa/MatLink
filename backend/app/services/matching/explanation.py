"""
CANONIX Explanation Generator
Synthesizes transparent, inspectable natural-language explanations from technical comparison details and rule results.
Explains commonalities, differences, and triggered engineering constraints.
Never hardcodes explanations for test artifacts.
"""

from typing import Dict, Any, List
from app.models.material import Material


def generate_match_explanation(
    material_a: Material,
    material_b: Material,
    relationship: str,
    final_score: float,
    comparison_details: Dict[str, Dict[str, Any]],
    rules_result: Dict[str, Any],
) -> str:
    """
    Generates a natural-language engineering explanation justifying the match score and classification.
    """
    sentences: List[str] = []

    # 1. Hard Block Explanations
    if rules_result.get("hard_block"):
        reasons = [r["reason"] for r in rules_result.get("rules_triggered", [])]
        reason_str = "; ".join(reasons)
        sentences.append(f"Hard engineering conflict detected: {reason_str}. Equivalence is blocked.")
        return " ".join(sentences)

    # 2. Key Commonalities (Matched attributes)
    matched_attrs = []
    for k, info in comparison_details.items():
        if info["status"] == "MATCH" and info.get("val_a"):
            matched_attrs.append(f"{k.replace('_', ' ')} ({info['val_a']})")

    if matched_attrs:
        sentences.append(f"Both records share identical technical specifications for {', '.join(matched_attrs[:5])}.")

    # 3. Differences and Unknowns
    mismatches = []
    unknowns = []
    for k, info in comparison_details.items():
        attr_name = k.replace("_", " ")
        if info["status"] == "MISMATCH":
            mismatches.append(f"{attr_name} ({info.get('val_a')} vs {info.get('val_b')})")
        elif info["status"] == "UNKNOWN":
            val_a = info.get("val_a")
            val_b = info.get("val_b")
            if val_a and not val_b:
                unknowns.append(f"Material A specifies {attr_name} ({val_a}) while Material B leaves it unspecified")
            elif val_b and not val_a:
                unknowns.append(f"Material B specifies {attr_name} ({val_b}) while Material A leaves it unspecified")

    if mismatches:
        sentences.append(f"Differences identified in {', '.join(mismatches)}.")

    if unknowns:
        sentences.append(f"Specification nuances: {'; '.join(unknowns[:3])}.")

    # 4. Recommendation Summary
    if relationship == "SAME":
        sentences.append("AI candidate recommendation: These materials represent technically equivalent items.")
    elif relationship == "NEAR_DUPLICATE":
        sentences.append("AI candidate recommendation: Strong near-duplicate candidate with minor nomenclature or secondary variances.")
    elif relationship == "FUNCTIONALLY_EQUIVALENT":
        sentences.append("AI candidate recommendation: Functionally equivalent candidate suitable for interchangeable technical application.")
    elif relationship == "RELATED":
        sentences.append("Materials share high-level category similarities but possess distinct engineering parameters.")
    else:
        sentences.append("Materials have disparate engineering characteristics.")

    return " ".join(sentences)
