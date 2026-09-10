"""
CANONIX Engineering Rule Engine
Enforces engineering hard constraints that override semantic similarity.
A high vector score must NEVER override an engineering conflict.
"""

from typing import Dict, Any, List
from app.models.material import Material


def evaluate_engineering_rules(material_a: Material, material_b: Material) -> Dict[str, Any]:
    """
    Evaluates engineering hard constraints between two materials.
    Returns:
    {
        "passed": bool,
        "hard_block": bool,
        "rule_score": float,
        "rules_triggered": List[Dict[str, str]]
    }
    """
    dna_a: Dict[str, Any] = material_a.material_dna or {}
    dna_b: Dict[str, Any] = material_b.material_dna or {}

    rules_triggered: List[Dict[str, str]] = []
    hard_block = False

    # -------------------------------------------------------------------------
    # RULE 1: Material Type Conflict
    # -------------------------------------------------------------------------
    type_a = (material_a.material_type or dna_a.get("material_type") or "OTHER").upper()
    type_b = (material_b.material_type or dna_b.get("material_type") or "OTHER").upper()

    if type_a != "OTHER" and type_b != "OTHER" and type_a != type_b:
        hard_block = True
        rules_triggered.append({
            "rule": "MATERIAL_TYPE_MISMATCH",
            "reason": f"Incompatible item categories: {type_a} vs {type_b}",
        })

    # -------------------------------------------------------------------------
    # RULE 2: Major Dimensional Conflict (for same-type piping/valves/fittings)
    # -------------------------------------------------------------------------
    sz_a = dna_a.get("size")
    sz_b = dna_b.get("size")
    if isinstance(sz_a, dict) and isinstance(sz_b, dict):
        val_a = sz_a.get("value")
        val_b = sz_b.get("value")
        if val_a is not None and val_b is not None:
            # Significant size ratio difference (> 5% difference)
            ratio = max(val_a, val_b) / min(val_a, val_b) if min(val_a, val_b) > 0 else 999.0
            if ratio > 1.05:
                hard_block = True
                rules_triggered.append({
                    "rule": "DIMENSIONAL_MISMATCH",
                    "reason": f"Major dimension conflict: {val_a} MM vs {val_b} MM",
                })

    # -------------------------------------------------------------------------
    # RULE 3: Metallurgy / Material Family Conflict
    # -------------------------------------------------------------------------
    fam_a = (dna_a.get("material_family") or dna_a.get("body_material") or "").upper()
    fam_b = (dna_b.get("material_family") or dna_b.get("body_material") or "").upper()

    if fam_a and fam_b:
        # Check direct contradiction (e.g. CARBON STEEL vs STAINLESS STEEL)
        if ("CARBON" in fam_a and "STAINLESS" in fam_b) or ("STAINLESS" in fam_a and "CARBON" in fam_b):
            hard_block = True
            rules_triggered.append({
                "rule": "METALLURGY_INCOMPATIBILITY",
                "reason": f"Material family incompatibility: {fam_a} vs {fam_b}",
            })
        elif ("CAST IRON" in fam_a and "STEEL" in fam_b) or ("STEEL" in fam_a and "CAST IRON" in fam_b):
            hard_block = True
            rules_triggered.append({
                "rule": "METALLURGY_INCOMPATIBILITY",
                "reason": f"Material family incompatibility: {fam_a} vs {fam_b}",
            })

    # Grade conflict check (e.g. A106 vs A312)
    grd_a = (dna_a.get("material_grade") or "").upper()
    grd_b = (dna_b.get("material_grade") or "").upper()
    if grd_a and grd_b:
        if ("A106" in grd_a and "A312" in grd_b) or ("A312" in grd_a and "A106" in grd_b):
            hard_block = True
            rules_triggered.append({
                "rule": "GRADE_INCOMPATIBILITY",
                "reason": f"ASTM specification conflict: {grd_a} vs {grd_b}",
            })

    # -------------------------------------------------------------------------
    # RULE 4: Pressure Class Conflict (e.g. CLASS 150 vs CLASS 300)
    # -------------------------------------------------------------------------
    prs_a = (dna_a.get("pressure_class") or "").upper()
    prs_b = (dna_b.get("pressure_class") or "").upper()
    if prs_a and prs_b:
        clean_p_a = prs_a.replace("CLASS", "").replace("CL", "").replace("#", "").strip()
        clean_p_b = prs_b.replace("CLASS", "").replace("CL", "").replace("#", "").strip()
        if clean_p_a != clean_p_b and clean_p_a.isdigit() and clean_p_b.isdigit():
            hard_block = True
            rules_triggered.append({
                "rule": "PRESSURE_CLASS_CONFLICT",
                "reason": f"Pressure rating conflict: {prs_a} vs {prs_b}",
            })

    # Calculate rule score
    if hard_block:
        rule_score = 0.0
    elif len(rules_triggered) > 0:
        rule_score = 0.5
    else:
        rule_score = 1.0

    return {
        "passed": not hard_block,
        "hard_block": hard_block,
        "rule_score": rule_score,
        "rules_triggered": rules_triggered,
    }
