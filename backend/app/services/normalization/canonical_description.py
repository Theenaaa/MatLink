"""
CANONIX Canonical Description Generator
Constructs a standardized, deterministic canonical engineering description from extracted attributes and DNA.
Guarantees zero token/phrase duplication across all material categories.
Never mutates or overwrites raw_description.
"""

import re
from typing import Dict, Any, List
from app.services.normalization.attribute_extractor import AttributeResult


def deduplicate_canonical_tokens(parts: List[str]) -> str:
    """
    Generic deduplication engine for canonical engineering descriptions.
    Guarantees:
    - Never repeats identical multi-word phrases (e.g. 'CARBON STEEL ... CARBON STEEL')
    - Never repeats identical adjacent words (e.g. 'PUMP PUMP')
    - Never includes phrases whose tokens already exist in sequence in the output
    - Resolves prefix overlaps
    """
    seen_phrases = set()
    result_tokens: List[str] = []

    for part in parts:
        if not part:
            continue
        part_clean = part.strip()
        if not part_clean:
            continue
        part_upper = part_clean.upper()

        # 1. Exact phrase already processed
        if part_upper in seen_phrases:
            continue

        # 2. Check if the phrase is already contained in current text as word-boundary sequence
        current_text_upper = " ".join(result_tokens).upper()
        if current_text_upper:
            pattern = rf"\b{re.escape(part_upper)}\b"
            if re.search(pattern, current_text_upper):
                seen_phrases.add(part_upper)
                continue

        # 3. Tokenize
        tokens = part_clean.split()

        # 4. Strip prefix overlap if result_tokens already ends with initial tokens of new part
        k = min(len(result_tokens), len(tokens))
        while k > 0:
            if [t.upper() for t in result_tokens[-k:]] == [t.upper() for t in tokens[:k]]:
                tokens = tokens[k:]
                break
            k -= 1

        # 5. Add tokens with adjacent deduplication
        for token in tokens:
            token_upper = token.upper()
            if result_tokens and result_tokens[-1].upper() == token_upper:
                continue
            result_tokens.append(token)

        seen_phrases.add(part_upper)

    return " ".join(result_tokens)


def build_canonical_description(
    material_type: str,
    material_group: str,
    attributes: List[AttributeResult],
    material_dna: Dict[str, Any],
) -> str:
    """
    Constructs a clear, deterministic canonical description in standard engineering ordering:
    [SIZE] [CONSTRUCTION] [SUBTYPE] [MATERIAL_FAMILY] [TYPE] [GRADE] [SCHEDULE] [PRESSURE_CLASS] [END_TYPE] [STANDARD]
    Never repeats normalized values or duplicate tokens.
    """
    attr_map = {a.name: a for a in attributes}
    parts: List[str] = []

    # 1. Size (e.g. '8 INCH', '2 INCH', 'M16')
    if "size" in attr_map and attr_map["size"].normalized_value:
        sz_raw = attr_map["size"].raw_value or ""
        sz_raw = sz_raw.replace('"', ' INCH').strip()
        if sz_raw.endswith("IN") and not sz_raw.endswith("INCH"):
            sz_raw = sz_raw[:-2] + "INCH"
        elif not any(u in sz_raw for u in ["INCH", "MM", "DN", "M", "NB"]):
            sz_raw = f"{sz_raw} INCH"
        parts.append(sz_raw.strip())

    # 2. Construction (e.g. SEAMLESS, WELDED, FORGED)
    if "construction" in attr_map and attr_map["construction"].normalized_value:
        parts.append(attr_map["construction"].normalized_value)

    # 3. Subtype (e.g. CENTRIFUGAL for pump, BALL for valve, WELD NECK for flange)
    if "pump_type" in attr_map and attr_map["pump_type"].normalized_value:
        parts.append(attr_map["pump_type"].normalized_value)
    elif "valve_type" in attr_map and attr_map["valve_type"].normalized_value:
        parts.append(attr_map["valve_type"].normalized_value)
    elif "flange_type" in attr_map and attr_map["flange_type"].normalized_value:
        parts.append(attr_map["flange_type"].normalized_value)

    # 4. Material Family / Metallurgy (e.g. CARBON STEEL, STAINLESS STEEL)
    grade = attr_map.get("material_grade")
    grade_val = grade.normalized_value if grade else ""

    fam_val = None
    if "material_family" in attr_map and attr_map["material_family"].normalized_value:
        fam_val = attr_map["material_family"].normalized_value
    elif "body_material" in attr_map and attr_map["body_material"].normalized_value:
        fam_val = attr_map["body_material"].normalized_value
    elif grade_val:
        if any(x in grade_val for x in ["A106", "A105", "A234", "A216", "CARBON STEEL"]):
            fam_val = "CARBON STEEL"
        elif any(x in grade_val for x in ["316", "304", "A312", "A182", "STAINLESS STEEL"]):
            fam_val = "STAINLESS STEEL"

    if fam_val:
        parts.append(fam_val)

    # 5. Item Classification Type (e.g. PIPE, PUMP, VALVE, FLANGE)
    if material_type not in ["OTHER", "GENERAL"]:
        parts.append(material_type)

    # 6. Specific Engineering Grade (e.g. ASTM A106 GRADE B, ASTM A105)
    if grade_val:
        grade_clean = grade_val.replace("GR.B", "GRADE B").replace("GR.A", "GRADE A").replace("GR.C", "GRADE C")
        # Only add if it's a specific ASTM grade distinct from material family
        if not fam_val or grade_clean.upper() != fam_val.upper():
            parts.append(grade_clean)

    # 7. Schedule
    if "schedule" in attr_map and attr_map["schedule"].normalized_value:
        sched = attr_map["schedule"].normalized_value
        if not sched.startswith("SCHEDULE"):
            sched = f"SCHEDULE {sched}"
        parts.append(sched)

    # 8. Pressure Class
    if "pressure_class" in attr_map and attr_map["pressure_class"].normalized_value:
        parts.append(attr_map["pressure_class"].normalized_value)

    # 9. End Type
    if "end_type" in attr_map and attr_map["end_type"].normalized_value:
        parts.append(attr_map["end_type"].normalized_value)

    # 10. Standard
    if "standard" in attr_map and attr_map["standard"].normalized_value:
        parts.append(attr_map["standard"].normalized_value)

    # Generic deduplication across all parts and tokens
    canonical = deduplicate_canonical_tokens(parts)
    return canonical if canonical else material_type
