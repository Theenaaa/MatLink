"""
CANONIX Material DNA Synthesizer
Constructs a flexible, structured, machine-readable JSON representation (Material DNA)
from extracted engineering attributes and classification data.
"""

from typing import Dict, Any, List, Optional
from app.services.normalization.attribute_extractor import AttributeResult


def build_material_dna(
    material_type: str,
    material_group: str,
    attributes: List[AttributeResult],
) -> Dict[str, Any]:
    """
    Synthesizes the Material DNA profile from extracted attributes.
    Maintains a flexible schema tailored to each material category.
    """
    attr_map = {a.name: a for a in attributes}

    dna: Dict[str, Any] = {
        "material_type": material_type,
        "material_group": material_group,
    }

    # Size object
    if "size" in attr_map:
        sz = attr_map["size"]
        try:
            num_val = float(sz.normalized_value) if sz.normalized_value else None
        except ValueError:
            num_val = None
        dna["size"] = {
            "value": num_val,
            "unit": sz.normalized_unit or "MM",
        }
    else:
        dna["size"] = None

    # Common physical/engineering fields
    dna["construction"] = attr_map["construction"].normalized_value if "construction" in attr_map else None
    dna["material_family"] = attr_map["material_family"].normalized_value if "material_family" in attr_map else None
    dna["material_grade"] = attr_map["material_grade"].normalized_value if "material_grade" in attr_map else None
    dna["schedule"] = attr_map["schedule"].normalized_value if "schedule" in attr_map else None
    dna["pressure_class"] = attr_map["pressure_class"].normalized_value if "pressure_class" in attr_map else None
    dna["end_type"] = attr_map["end_type"].normalized_value if "end_type" in attr_map else None
    dna["standard"] = attr_map["standard"].normalized_value if "standard" in attr_map else None

    # Category-specific & equipment fields
    if "body_material" in attr_map:
        dna["body_material"] = attr_map["body_material"].normalized_value

    if material_type == "VALVE":
        dna["valve_type"] = attr_map["valve_type"].normalized_value if "valve_type" in attr_map else None
    elif material_type == "FLANGE":
        dna["flange_type"] = attr_map["flange_type"].normalized_value if "flange_type" in attr_map else None
    elif material_type == "PUMP":
        dna["pump_type"] = attr_map["pump_type"].normalized_value if "pump_type" in attr_map else None
        if "flow_rate" in attr_map:
            fr = attr_map["flow_rate"]
            try:
                fr_num = float(fr.normalized_value) if fr.normalized_value else None
            except (ValueError, TypeError):
                fr_num = None
            dna["flow_rate"] = {
                "value": fr_num,
                "unit": fr.normalized_unit or "M3/HR",
                "raw": fr.raw_value,
            }
        else:
            dna["flow_rate"] = None

    return dna
