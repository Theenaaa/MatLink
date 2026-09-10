"""
CANONIX Attribute Extraction Engine
Rule-based, explainable extractor for technical engineering attributes.
Preserves raw values, normalized values, normalized units, confidence scores, and extraction methods.
Never invents values when attributes are absent.
"""

import re
from typing import Dict, Any, List, Optional
from app.services.normalization.unit_normalizer import normalize_dimension_to_mm, parse_numeric_dimension


class AttributeResult:
    def __init__(
        self,
        name: str,
        raw_value: Optional[str] = None,
        normalized_value: Optional[str] = None,
        normalized_unit: Optional[str] = None,
        confidence: float = 0.0,
        method: str = "not_detected",
    ):
        self.name = name
        self.raw_value = raw_value
        self.normalized_value = normalized_value
        self.normalized_unit = normalized_unit
        self.confidence = confidence
        self.method = method

    def to_dict(self) -> Dict[str, Any]:
        return {
            "attribute_name": self.name,
            "raw_value": self.raw_value,
            "normalized_value": self.normalized_value,
            "normalized_unit": self.normalized_unit,
            "confidence_score": self.confidence,
            "extraction_method": self.method,
        }


def extract_size(text: str, material_type: str) -> Optional[AttributeResult]:
    """
    Extracts nominal pipe size / physical dimension.
    Handles:
      '8 INCH', '8"', '8 IN' -> 203.2 MM
      '2 INCH', '2"' -> 50.8 MM
      'PIPE 8 BE' -> 203.2 MM (NPS 8)
      '50.8 MM' -> 50.8 MM
      '200 NB' or 'DN 200' -> 200.0 MM
      Fractions: '1/2 INCH', '1 1/2 INCH'
    Never interprets flow/capacity (e.g. M3/HR) as physical size.
    """
    # Exclude equipment without explicit physical dimensions
    if material_type in ["PUMP", "MOTOR", "COMPRESSOR", "TURBINE", "GEARBOX"]:
        # Only allow explicit nozzle/flange dimensions like '2 INCH' or 'DN 50' or '2"'
        explicit_equip_size = re.search(
            r"\b(\d+[\s-]+\d+/\d+|\d+/\d+|\d+(?:\.\d+)?)\s*(INCH|INCHES|IN|\"|''|MM|DN|NB)\b",
            text,
            re.IGNORECASE,
        )
        if explicit_equip_size:
            raw_num = explicit_equip_size.group(1).strip()
            raw_u = explicit_equip_size.group(2).strip()
            conv = normalize_dimension_to_mm(raw_num, raw_u)
            if conv:
                mm_val, unit = conv
                norm_str = str(int(mm_val)) if mm_val.is_integer() else str(mm_val)
                return AttributeResult(
                    name="size",
                    raw_value=f"{raw_num} {raw_u}",
                    normalized_value=norm_str,
                    normalized_unit=unit,
                    confidence=0.95,
                    method="regex+unit_normalization",
                )
        return None

    # 1. Explicit unit size: e.g. "8 INCH", '8"', "2-1/2 INCH", "1/2 IN", "50.8 MM"
    # Note: Ensure M is not part of M3, M3/HR, M/S, etc.
    explicit_unit_pattern = re.search(
        r"\b(\d+[\s-]+\d+/\d+|\d+/\d+|\d+(?:\.\d+)?)\s*(INCH|INCHES|IN|\"|''|MM|CM|M(?:ETER|ETERS)?(?![32\^/])|NB|DN)\b",
        text,
        re.IGNORECASE,
    )
    if explicit_unit_pattern:
        raw_num = explicit_unit_pattern.group(1).strip()
        raw_u = explicit_unit_pattern.group(2).strip()
        raw_full = f"{raw_num} {raw_u}" if raw_u != '"' else f'{raw_num}"'
        conv = normalize_dimension_to_mm(raw_num, raw_u)
        if conv:
            mm_val, unit = conv
            norm_str = str(int(mm_val)) if mm_val.is_integer() else str(mm_val)
            return AttributeResult(
                name="size",
                raw_value=raw_full,
                normalized_value=norm_str,
                normalized_unit=unit,
                confidence=0.98,
                method="regex+unit_normalization",
            )

    # 2. Piping implicit NPS: e.g. "PIPE 8 BE", "PIPE 2 BE", "VALVE 2 FLGD", "ELBOW 8 90"
    if material_type in ["PIPE", "VALVE", "FLANGE", "ELBOW", "TEE", "REDUCER", "GASKET"]:
        implicit_pipe_size = re.search(
            r"\b(?:PIPE|VALVE|FLANGE|ELBOW|TEE|REDUCER|GASKET)\s+(\d+[\s-]+\d+/\d+|\d+/\d+|\d+(?:\.\d+)?)\s+(?:BE|PE|BW|SW|THD|FLGD|RF|STD|XS|SMLS|WLD|CLASS|ASTM|90|45|\b)",
            text,
            re.IGNORECASE,
        )
        if implicit_pipe_size:
            raw_num = implicit_pipe_size.group(1).strip()
            # In piping master catalogs, single dimensionless numbers following item type are inches
            conv = normalize_dimension_to_mm(raw_num, "INCH")
            if conv:
                mm_val, unit = conv
                norm_str = str(int(mm_val)) if mm_val.is_integer() else str(mm_val)
                return AttributeResult(
                    name="size",
                    raw_value=f"{raw_num} INCH",
                    normalized_value=norm_str,
                    normalized_unit=unit,
                    confidence=0.95,
                    method="piping_nps_rule+unit_normalization",
                )

    # 3. Metric DN / NB: "DN200", "DN 150", "200NB"
    dn_match = re.search(r"\bDN\s*(\d+)\b|\b(\d+)\s*NB\b", text, re.IGNORECASE)
    if dn_match:
        dn_val = dn_match.group(1) or dn_match.group(2)
        return AttributeResult(
            name="size",
            raw_value=f"DN {dn_val}",
            normalized_value=dn_val,
            normalized_unit="MM",
            confidence=0.96,
            method="dn_nb_rule",
        )

    # 4. Metric Fastener Diameter: "M16", "M20", "M16X65"
    m_match = re.search(r"\bM(\d+)(?:X(\d+))?\b", text, re.IGNORECASE)
    if m_match and material_type in ["BOLT", "NUT", "STUD", "FASTENERS"]:
        dia = m_match.group(1)
        return AttributeResult(
            name="size",
            raw_value=f"M{dia}",
            normalized_value=dia,
            normalized_unit="MM",
            confidence=0.95,
            method="metric_thread_pattern",
        )

    return None


def extract_construction(text: str) -> Optional[AttributeResult]:
    """
    Extracts manufacturing construction method (SEAMLESS, WELDED, ERW, etc.).
    """
    patterns = [
        (r"\bSEAMLESS\b", "SEAMLESS", 0.99),
        (r"\bELECTRIC RESISTANCE WELDED\b|\bERW\b", "ELECTRIC RESISTANCE WELDED", 0.98),
        (r"\bELECTRIC FUSION WELDED\b|\bEFW\b", "ELECTRIC FUSION WELDED", 0.98),
        (r"\bSUBMERGED ARC WELDED\b|\bSAW\b", "SUBMERGED ARC WELDED", 0.98),
        (r"\bWELDED\b", "WELDED", 0.95),
        (r"\bFORGED\b", "FORGED", 0.96),
        (r"\bCAST\b", "CAST", 0.95),
    ]
    for pat, norm_val, conf in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return AttributeResult(
                name="construction",
                raw_value=m.group(0),
                normalized_value=norm_val,
                confidence=conf,
                method="keyword_rule",
            )
    return None


def extract_material_grade(text: str) -> Optional[AttributeResult]:
    """
    Extracts specific engineering ASTM / standard metallurgy grades.
    Does NOT return generic metallurgy family names (CARBON STEEL, etc.).
    """
    astm_matches = [
        (r"\bASTM\s+A-?106\s*(?:GR\.?|GRADE)?\s*([ABC])\b", r"ASTM A106 GR.\1", 0.98),
        (r"\bASTM\s+A-?105(?:N)?\b", "ASTM A105", 0.98),
        (r"\bASTM\s+A-?234\s*(?:GR\.?|GRADE)?\s*(WPB|WPC)\b", r"ASTM A234 \1", 0.98),
        (r"\bASTM\s+A-?312\s*(?:TP)?\s*(304L?|316L?|321)\b", r"ASTM A312 TP\1", 0.98),
        (r"\bASTM\s+A-?182\s*(?:F)?\s*(304L?|316L?|F11|F22|F9)\b", r"ASTM A182 F\1", 0.98),
        (r"\bASTM\s+A-?216\s*(?:GR\.?|GRADE)?\s*(WCB|WCC)\b", r"ASTM A216 \1", 0.98),
        (r"\bASTM\s+A-?350\s*(?:GR\.?|GRADE)?\s*(LF2)\b", "ASTM A350 LF2", 0.98),
        (r"\bASTM\s+A-?333\s*(?:GR\.?|GRADE)?\s*(6)\b", "ASTM A333 GR.6", 0.98),
        (r"\bASTM\s+A-?193\s*(?:GR\.?|GRADE)?\s*(B7|B8|B8M)\b", r"ASTM A193 \1", 0.98),
        (r"\bASTM\s+A-?194\s*(?:GR\.?|GRADE)?\s*(2H|8|8M)\b", r"ASTM A194 \1", 0.98),
        # Short ASTM forms without "ASTM" prefix
        (r"\bA-?106\s*(?:GR\.?|GRADE)?\s*([ABC])\b", r"ASTM A106 GR.\1", 0.95),
        (r"\bA-?105(?:N)?\b", "ASTM A105", 0.95),
        (r"\bA-?234\s*(?:GR\.?|GRADE)?\s*(WPB|WPC)\b", r"ASTM A234 \1", 0.95),
        (r"\bA-?312\s*(?:TP)?\s*(304L?|316L?)\b", r"ASTM A312 TP\1", 0.95),
        (r"\bA-?182\s*(?:F)?\s*(304L?|316L?)\b", r"ASTM A182 F\1", 0.95),
        (r"\bA-?216\s*(?:GR\.?|GRADE)?\s*(WCB|WCC)\b", r"ASTM A216 \1", 0.95),
        (r"\bSS\s*316L?\b", "SS 316L", 0.93),
        (r"\bSS\s*304L?\b", "SS 304L", 0.93),
    ]
    for pat, template, conf in astm_matches:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = re.sub(pat, template, m.group(0), flags=re.IGNORECASE)
            return AttributeResult(
                name="material_grade",
                raw_value=m.group(0),
                normalized_value=val,
                confidence=conf,
                method="engineering_pattern",
            )
    return None


def extract_material_family(
    text: str,
    material_type: str,
    grade_result: Optional[AttributeResult] = None,
) -> List[AttributeResult]:
    """
    Extracts generic metallurgy families (CARBON STEEL, STAINLESS STEEL, etc.).
    For equipment (PUMP, MOTOR, etc.) and VALVE, also maps to body_material / construction_material.
    Never invents ASTM grades when only generic family is present.
    """
    results: List[AttributeResult] = []

    family_patterns = [
        (r"\bCARBON\s+STEEL\b|\bC\.?S\.?\b|\bCARBON\s+STL\b", "CARBON STEEL", 0.95),
        (r"\bSTAINLESS\s+STEEL\b|\bS\.?S\.?\b|\bSTAINLESS\s+STL\b", "STAINLESS STEEL", 0.95),
        (r"\bALLOY\s+STEEL\b|\bA\.?S\.?\b", "ALLOY STEEL", 0.95),
        (r"\bCAST\s+IRON\b|\bC\.?I\.?\b", "CAST IRON", 0.95),
        (r"\bDUCTILE\s+IRON\b|\bD\.?I\.?\b", "DUCTILE IRON", 0.95),
        (r"\bBRONZE\b", "BRONZE", 0.95),
        (r"\bBRASS\b", "BRASS", 0.95),
        (r"\bALUMINUM\b|\bALUMINIUM\b", "ALUMINUM", 0.95),
    ]

    matched_family = None
    raw_match = None
    conf_score = 0.95

    for pat, norm_fam, conf in family_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            matched_family = norm_fam
            raw_match = m.group(0)
            conf_score = conf
            break

    # If not explicitly mentioned by keyword, check if inferable from grade
    if not matched_family and grade_result and grade_result.normalized_value:
        gv = grade_result.normalized_value
        if any(x in gv for x in ["A106", "A105", "A234", "A216", "A350", "A333"]):
            matched_family = "CARBON STEEL"
            raw_match = grade_result.raw_value
            conf_score = 0.92
        elif any(x in gv for x in ["A312", "A182", "316", "304"]):
            matched_family = "STAINLESS STEEL"
            raw_match = grade_result.raw_value
            conf_score = 0.92

    if matched_family:
        results.append(
            AttributeResult(
                name="material_family",
                raw_value=raw_match,
                normalized_value=matched_family,
                confidence=conf_score,
                method="keyword_rule" if raw_match != (grade_result.raw_value if grade_result else None) else "grade_inference",
            )
        )

        # For equipment (PUMP, MOTOR, etc.) and VALVE, also expose as body_material
        if material_type in ["PUMP", "VALVE", "MOTOR", "COMPRESSOR", "TURBINE", "GEARBOX"]:
            results.append(
                AttributeResult(
                    name="body_material",
                    raw_value=raw_match,
                    normalized_value=matched_family,
                    confidence=conf_score,
                    method="equipment_material_rule",
                )
            )

    return results


def extract_pump_type(text: str) -> Optional[AttributeResult]:
    """
    Extracts pump mechanical subtype (CENTRIFUGAL, RECIPROCATING, GEAR, etc.).
    """
    subtypes = [
        (r"\bCENTRIFUGAL\b", "CENTRIFUGAL"),
        (r"\bRECIPROCATING\b", "RECIPROCATING"),
        (r"\bPOSITIVE\s+DISPLACEMENT\b|\bPD\b", "POSITIVE DISPLACEMENT"),
        (r"\bGEAR\b", "GEAR"),
        (r"\bSUBMERSIBLE\b", "SUBMERSIBLE"),
        (r"\bDOSING\b", "DOSING"),
        (r"\bDIAPHRAGM\b", "DIAPHRAGM"),
        (r"\bSCREW\b", "SCREW"),
        (r"\bVACUUM\b", "VACUUM"),
    ]
    for pat, norm in subtypes:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return AttributeResult(
                name="pump_type",
                raw_value=m.group(0),
                normalized_value=norm,
                confidence=0.98,
                method="keyword_rule",
            )
    return None


def extract_flow_rate(text: str) -> Optional[AttributeResult]:
    """
    Extracts volumetric flow rate / capacity (e.g. 50 M3/HR, 100 GPM, 20 L/S).
    """
    flow_pattern = re.search(
        r"\b(\d+(?:\.\d+)?)\s*(M3/HR|M3/H|M3/MIN|M\^3/HR|GPM|LPM|L/S|L/MIN)\b",
        text,
        re.IGNORECASE,
    )
    if flow_pattern:
        val_str = flow_pattern.group(1)
        unit_raw = flow_pattern.group(2).upper()
        unit_norm = "M3/HR" if unit_raw in ["M3/HR", "M3/H", "M^3/HR"] else unit_raw
        return AttributeResult(
            name="flow_rate",
            raw_value=flow_pattern.group(0),
            normalized_value=val_str,
            normalized_unit=unit_norm,
            confidence=0.98,
            method="flow_unit_rule",
        )
    return None


def extract_schedule(text: str) -> Optional[AttributeResult]:
    """
    Extracts pipe schedule / wall thickness.
    """
    sched_patterns = [
        (r"\bSCH(?:EDULE)?[\.\s-]*(STD|XS|XXS|10|20|30|40|60|80|100|120|140|160)\b", 0.98),
        (r"\b(STD|XS|XXS)\b", 0.92),
    ]
    for pat, conf in sched_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = m.group(1).upper()
            norm = f"SCH {val}" if val.isdigit() else val
            return AttributeResult(
                name="schedule",
                raw_value=m.group(0),
                normalized_value=norm,
                confidence=conf,
                method="regex",
            )
    return None


def extract_pressure_class(text: str) -> Optional[AttributeResult]:
    """
    Extracts pressure rating (CLASS 150, CLASS 300, 3000 LB, PN16, etc.).
    """
    p_match = re.search(
        r"\b(?:CLASS\s+|CL\s*)?(150|300|600|800|900|1500|2500)(?:\s*#|\s*LBS?|\b)",
        text,
        re.IGNORECASE,
    )
    if p_match:
        rating = p_match.group(1)
        return AttributeResult(
            name="pressure_class",
            raw_value=p_match.group(0),
            normalized_value=f"CLASS {rating}",
            confidence=0.98,
            method="regex",
        )

    pn_match = re.search(r"\bPN\s*(10|16|25|40|64|100)\b", text, re.IGNORECASE)
    if pn_match:
        pn_val = pn_match.group(1)
        return AttributeResult(
            name="pressure_class",
            raw_value=pn_match.group(0),
            normalized_value=f"PN {pn_val}",
            confidence=0.97,
            method="regex",
        )

    lb_match = re.search(r"\b(2000|3000|6000|9000)\s*(?:#|LB|LBS)\b", text, re.IGNORECASE)
    if lb_match:
        val = lb_match.group(1)
        return AttributeResult(
            name="pressure_class",
            raw_value=lb_match.group(0),
            normalized_value=f"{val} LB",
            confidence=0.96,
            method="regex",
        )

    return None


def extract_end_type(text: str) -> Optional[AttributeResult]:
    """
    Extracts end connection type (BE, PE, THD, SW, FLANGED, RF, FF, RTJ).
    """
    end_map = [
        (r"\b(?:BEVELED\s+END|B\.E\.|B/E|\bBE\b)", "BE", "BEVELED END", 0.98),
        (r"\b(?:PLAIN\s+END|P\.E\.|P/E|\bPE\b)", "PE", "PLAIN END", 0.98),
        (r"\b(?:THREADED|NPT|BSPT|T\.E\.|\bTHD\b)", "THD", "THREADED", 0.98),
        (r"\b(?:SOCKET\s+WELD|S\.W\.|\bSW\b)", "SW", "SOCKET WELD", 0.98),
        (r"\b(?:FLANGED|FLGD)\b", "FLGD", "FLANGED", 0.96),
        (r"\b(?:RAISED\s+FACE|R\.F\.|\bRF\b)", "RF", "RAISED FACE", 0.97),
        (r"\b(?:FLAT\s+FACE|F\.F\.|\bFF\b)", "FF", "FLAT FACE", 0.97),
        (r"\b(?:RING\s+TYPE\s+JOINT|R\.T\.J\.|\bRTJ\b)", "RTJ", "RING TYPE JOINT", 0.98),
    ]
    for pat, code, desc, conf in end_map:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return AttributeResult(
                name="end_type",
                raw_value=m.group(0),
                normalized_value=code,
                confidence=conf,
                method="keyword_rule",
            )
    return None


def extract_standard(text: str) -> Optional[AttributeResult]:
    """
    Extracts manufacturing/dimensional engineering standards.
    """
    standards = [
        (r"\b(?:ASME/ANSI|ANSI|ASME)?\s*B-?36\.10\b", "ASME B36.10", 0.99),
        (r"\b(?:ASME/ANSI|ANSI|ASME)?\s*B-?36\.19\b", "ASME B36.19", 0.99),
        (r"\b(?:ASME/ANSI|ANSI|ASME)?\s*B-?16\.5\b", "ASME B16.5", 0.99),
        (r"\b(?:ASME/ANSI|ANSI|ASME)?\s*B-?16\.9\b", "ASME B16.9", 0.99),
        (r"\b(?:ASME/ANSI|ANSI|ASME)?\s*B-?16\.11\b", "ASME B16.11", 0.99),
        (r"\b(?:ASME/ANSI|ANSI|ASME)?\s*B-?16\.20\b", "ASME B16.20", 0.99),
        (r"\b(?:ASME/ANSI|ANSI|ASME)?\s*B-?16\.34\b", "ASME B16.34", 0.99),
        (r"\bAPI\s*6D\b", "API 6D", 0.99),
        (r"\bAPI\s*600\b", "API 600", 0.99),
        (r"\bAPI\s*602\b", "API 602", 0.99),
        (r"\bAPI\s*594\b", "API 594", 0.99),
        (r"\bAPI\s*609\b", "API 609", 0.99),
        (r"\bMSS\s*SP-?44\b", "MSS SP-44", 0.99),
    ]
    for pat, norm_std, conf in standards:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return AttributeResult(
                name="standard",
                raw_value=m.group(0),
                normalized_value=norm_std,
                confidence=conf,
                method="standard_rule",
            )
    return None


def extract_valve_type(text: str) -> Optional[AttributeResult]:
    """
    Subtype for valves (BALL, GATE, GLOBE, CHECK, BUTTERFLY, PLUG, NEEDLE, RELIEF).
    """
    valve_subtypes = ["BALL", "GATE", "GLOBE", "CHECK", "BUTTERFLY", "PLUG", "NEEDLE", "RELIEF", "SAFETY"]
    for st in valve_subtypes:
        if re.search(rf"\b{st}\b", text, re.IGNORECASE):
            return AttributeResult(
                name="valve_type",
                raw_value=st,
                normalized_value=st,
                confidence=0.98,
                method="keyword_rule",
            )
    return None


def extract_flange_type(text: str) -> Optional[AttributeResult]:
    """
    Subtype for flanges (WELD NECK, SLIP ON, BLIND, SOCKET WELD, THREADED, LAP JOINT).
    """
    flange_types = [
        (r"\bWELD\s*NECK\b|\bWN\b|\bWNRF\b", "WELD NECK"),
        (r"\bSLIP\s*ON\b|\bSO\b|\bSORF\b", "SLIP ON"),
        (r"\bBLIND\b|\bBLRF\b", "BLIND"),
        (r"\bSOCKET\s*WELD\b|\bSWRF\b", "SOCKET WELD"),
        (r"\bTHREADED\b|\bTHRF\b", "THREADED"),
        (r"\bLAP\s*JOINT\b|\bLJ\b", "LAP JOINT"),
    ]
    for pat, name in flange_types:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return AttributeResult(
                name="flange_type",
                raw_value=m.group(0),
                normalized_value=name,
                confidence=0.98,
                method="keyword_rule",
            )
    return None


def extract_attributes(normalized_text: str, material_type: str, material_group: str) -> List[AttributeResult]:
    """
    Extracts all applicable engineering attributes for the detected material category.
    Returns list of AttributeResult objects.
    """
    results: List[AttributeResult] = []

    # 1. Size / Dimension (Never invents size for equipment)
    size_res = extract_size(normalized_text, material_type)
    if size_res:
        results.append(size_res)

    # 2. Material Grade (Specific ASTM/standards only)
    grade_res = extract_material_grade(normalized_text)
    if grade_res:
        results.append(grade_res)

    # 3. Material Family & Body Material (Generic metallurgy)
    family_results = extract_material_family(normalized_text, material_type, grade_res)
    results.extend(family_results)

    # 4. Construction
    const_res = extract_construction(normalized_text)
    if const_res:
        results.append(const_res)

    # 5. Schedule
    sched_res = extract_schedule(normalized_text)
    if sched_res:
        results.append(sched_res)

    # 6. Pressure Class
    press_res = extract_pressure_class(normalized_text)
    if press_res:
        results.append(press_res)

    # 7. End Type / Facing
    end_res = extract_end_type(normalized_text)
    if end_res:
        results.append(end_res)

    # 8. Standard
    std_res = extract_standard(normalized_text)
    if std_res:
        results.append(std_res)

    # 9. Category-specific subtypes
    if material_type == "VALVE":
        v_res = extract_valve_type(normalized_text)
        if v_res:
            results.append(v_res)

    elif material_type == "FLANGE":
        f_res = extract_flange_type(normalized_text)
        if f_res:
            results.append(f_res)

    elif material_type == "PUMP":
        p_res = extract_pump_type(normalized_text)
        if p_res:
            results.append(p_res)
        fr_res = extract_flow_rate(normalized_text)
        if fr_res:
            results.append(fr_res)

    return results
