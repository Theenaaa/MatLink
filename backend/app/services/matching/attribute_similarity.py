"""
CANONIX Attribute Similarity Engine
Performs technical comparison across Material DNA structured attributes.
Strictly distinguishes:
- MATCH: Both records specify the attribute and values are equivalent.
- MISMATCH: Both records specify the attribute and values conflict.
- UNKNOWN: One or both records do not specify the attribute (Never penalizes missing optional specs as conflicts).
- NOT_APPLICABLE: Attribute is irrelevant for this material category.
"""

from typing import Dict, Any, Tuple, Optional
from app.models.material import Material
from app.services.matching.config import SIZE_TOLERANCE_PERCENT, FLOW_TOLERANCE_PERCENT


def compare_size(val_a: Any, val_b: Any) -> str:
    """
    Compares physical dimension objects: {"value": 203.2, "unit": "MM"}
    """
    if val_a is None or val_b is None:
        return "UNKNOWN"

    num_a = val_a.get("value") if isinstance(val_a, dict) else None
    num_b = val_b.get("value") if isinstance(val_b, dict) else None

    if num_a is None or num_b is None:
        return "UNKNOWN"

    # Normalize units: both should be in MM
    unit_a = val_a.get("unit", "MM").upper() if isinstance(val_a, dict) else "MM"
    unit_b = val_b.get("unit", "MM").upper() if isinstance(val_b, dict) else "MM"

    if unit_a != unit_b:
        # If units differ and cannot be equated
        return "MISMATCH"

    diff = abs(num_a - num_b)
    avg = (num_a + num_b) / 2.0 if (num_a + num_b) > 0 else 1.0
    if (diff / avg) * 100.0 <= SIZE_TOLERANCE_PERCENT:
        return "MATCH"

    return "MISMATCH"


def compare_flow_rate(val_a: Any, val_b: Any) -> str:
    """
    Compares volumetric flow rates: {"value": 50.0, "unit": "M3/HR"}
    """
    if val_a is None or val_b is None:
        return "UNKNOWN"

    num_a = val_a.get("value") if isinstance(val_a, dict) else None
    num_b = val_b.get("value") if isinstance(val_b, dict) else None

    if num_a is None or num_b is None:
        return "UNKNOWN"

    diff = abs(num_a - num_b)
    avg = (num_a + num_b) / 2.0 if (num_a + num_b) > 0 else 1.0
    if (diff / avg) * 100.0 <= FLOW_TOLERANCE_PERCENT:
        return "MATCH"

    return "MISMATCH"


def compare_string_attr(val_a: Optional[str], val_b: Optional[str]) -> str:
    """
    Standard comparison for normalized string attributes (grades, schedules, standards, etc.).
    """
    if not val_a or not val_b:
        return "UNKNOWN"

    str_a = str(val_a).strip().upper()
    str_b = str(val_b).strip().upper()

    if str_a == str_b:
        return "MATCH"

    # Check safe normalized equivalences (e.g. ASTM A106 GR.B vs A106 GR.B, or STD vs SCHEDULE STD)
    clean_a = str_a.replace("ASTM ", "").replace("ASME ", "").replace("SCHEDULE ", "").replace("CLASS ", "").strip()
    clean_b = str_b.replace("ASTM ", "").replace("ASME ", "").replace("SCHEDULE ", "").replace("CLASS ", "").strip()

    if clean_a == clean_b:
        return "MATCH"

    return "MISMATCH"


def compare_technical_attributes(material_a: Material, material_b: Material) -> Tuple[float, Dict[str, Dict[str, Any]]]:
    """
    Compares Material DNA attributes for Material A and Material B.
    Accepts either Material model instances or DNA dictionaries.
    Returns: (attribute_similarity_score, comparison_matrix_dict)
    """
    dna_a: Dict[str, Any] = getattr(material_a, "material_dna", None) if hasattr(material_a, "material_dna") else (material_a if isinstance(material_a, dict) else {})
    dna_b: Dict[str, Any] = getattr(material_b, "material_dna", None) if hasattr(material_b, "material_dna") else (material_b if isinstance(material_b, dict) else {})
    if not isinstance(dna_a, dict):
        dna_a = {}
    if not isinstance(dna_b, dict):
        dna_b = {}

    mat_type_a = getattr(material_a, "material_type", None) or dna_a.get("material_type") or "OTHER"
    mat_type_b = getattr(material_b, "material_type", None) or dna_b.get("material_type") or "OTHER"

    details: Dict[str, Dict[str, Any]] = {}

    # 1. Material Type
    if mat_type_a == mat_type_b and mat_type_a != "OTHER":
        details["material_type"] = {"val_a": mat_type_a, "val_b": mat_type_b, "status": "MATCH", "weight": 2.0}
    elif mat_type_a == "OTHER" or mat_type_b == "OTHER":
        details["material_type"] = {"val_a": mat_type_a, "val_b": mat_type_b, "status": "UNKNOWN", "weight": 1.0}
    else:
        details["material_type"] = {"val_a": mat_type_a, "val_b": mat_type_b, "status": "MISMATCH", "weight": 2.0}

    # 2. Material Group
    grp_a = getattr(material_a, "material_group", None) or dna_a.get("material_group")
    grp_b = getattr(material_b, "material_group", None) or dna_b.get("material_group")
    details["material_group"] = {
        "val_a": grp_a,
        "val_b": grp_b,
        "status": compare_string_attr(grp_a, grp_b),
        "weight": 1.0,
    }

    # 3. Size
    sz_a = dna_a.get("size")
    sz_b = dna_b.get("size")
    details["size"] = {
        "val_a": f"{sz_a['value']} {sz_a.get('unit', 'MM')}" if isinstance(sz_a, dict) and sz_a.get("value") else None,
        "val_b": f"{sz_b['value']} {sz_b.get('unit', 'MM')}" if isinstance(sz_b, dict) and sz_b.get("value") else None,
        "status": compare_size(sz_a, sz_b),
        "weight": 2.5,
    }

    # 4. Material Family (Metallurgy)
    fam_a = dna_a.get("material_family") or dna_a.get("body_material")
    fam_b = dna_b.get("material_family") or dna_b.get("body_material")
    details["material_family"] = {
        "val_a": fam_a,
        "val_b": fam_b,
        "status": compare_string_attr(fam_a, fam_b),
        "weight": 2.0,
    }

    # 5. Material Grade
    grd_a = dna_a.get("material_grade")
    grd_b = dna_b.get("material_grade")
    details["material_grade"] = {
        "val_a": grd_a,
        "val_b": grd_b,
        "status": compare_string_attr(grd_a, grd_b),
        "weight": 2.5,
    }

    # 6. Construction
    cst_a = dna_a.get("construction")
    cst_b = dna_b.get("construction")
    details["construction"] = {
        "val_a": cst_a,
        "val_b": cst_b,
        "status": compare_string_attr(cst_a, cst_b),
        "weight": 1.5,
    }

    # 7. Schedule
    sch_a = dna_a.get("schedule")
    sch_b = dna_b.get("schedule")
    details["schedule"] = {
        "val_a": sch_a,
        "val_b": sch_b,
        "status": compare_string_attr(sch_a, sch_b),
        "weight": 1.5,
    }

    # 8. Pressure Class
    prs_a = dna_a.get("pressure_class")
    prs_b = dna_b.get("pressure_class")
    details["pressure_class"] = {
        "val_a": prs_a,
        "val_b": prs_b,
        "status": compare_string_attr(prs_a, prs_b),
        "weight": 2.0,
    }

    # 9. End Type
    end_a = dna_a.get("end_type")
    end_b = dna_b.get("end_type")
    details["end_type"] = {
        "val_a": end_a,
        "val_b": end_b,
        "status": compare_string_attr(end_a, end_b),
        "weight": 1.0,
    }

    # 10. Standard
    std_a = dna_a.get("standard")
    std_b = dna_b.get("standard")
    details["standard"] = {
        "val_a": std_a,
        "val_b": std_b,
        "status": compare_string_attr(std_a, std_b),
        "weight": 1.0,
    }

    # Category-specific fields:
    if mat_type_a == "PUMP" or mat_type_b == "PUMP":
        pmp_a = dna_a.get("pump_type")
        pmp_b = dna_b.get("pump_type")
        details["pump_type"] = {
            "val_a": pmp_a,
            "val_b": pmp_b,
            "status": compare_string_attr(pmp_a, pmp_b),
            "weight": 2.0,
        }
        flw_a = dna_a.get("flow_rate")
        flw_b = dna_b.get("flow_rate")
        details["flow_rate"] = {
            "val_a": f"{flw_a['value']} {flw_a.get('unit', 'M3/HR')}" if isinstance(flw_a, dict) and flw_a.get("value") else None,
            "val_b": f"{flw_b['value']} {flw_b.get('unit', 'M3/HR')}" if isinstance(flw_b, dict) and flw_b.get("value") else None,
            "status": compare_flow_rate(flw_a, flw_b),
            "weight": 2.0,
        }

    if mat_type_a == "VALVE" or mat_type_b == "VALVE":
        vlv_a = dna_a.get("valve_type")
        vlv_b = dna_b.get("valve_type")
        details["valve_type"] = {
            "val_a": vlv_a,
            "val_b": vlv_b,
            "status": compare_string_attr(vlv_a, vlv_b),
            "weight": 2.0,
        }

    if mat_type_a == "FLANGE" or mat_type_b == "FLANGE":
        flg_a = dna_a.get("flange_type")
        flg_b = dna_b.get("flange_type")
        details["flange_type"] = {
            "val_a": flg_a,
            "val_b": flg_b,
            "status": compare_string_attr(flg_a, flg_b),
            "weight": 2.0,
        }

    # Calculate weighted attribute score
    total_weight = 0.0
    earned_weight = 0.0

    for k, item in details.items():
        st = item["status"]
        w = item["weight"]
        if st == "MATCH":
            earned_weight += w
            total_weight += w
        elif st == "MISMATCH":
            total_weight += w
        elif st == "UNKNOWN":
            # An unknown/missing attribute gives neutral partial credit (0.6) and doesn't penalize as mismatch
            earned_weight += w * 0.6
            total_weight += w

    attribute_score = (earned_weight / total_weight) if total_weight > 0 else 0.5
    attribute_score = round(min(max(attribute_score, 0.0), 1.0), 4)

    return attribute_score, details
