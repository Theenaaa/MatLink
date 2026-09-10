"""
CANONIX Unit Normalizer
Handles physical dimension conversions and engineering units.
Converts imperial inches, fractions, and metric units into canonical millimeters (MM).
Preserves raw representation separately.
"""

import re
from typing import Optional, Tuple, Dict, Any

# Canonical conversion factor
INCH_TO_MM = 25.4
CM_TO_MM = 10.0
M_TO_MM = 1000.0

FRACTIONS_MAP = {
    "1/8": 0.125,
    "1/4": 0.25,
    "3/8": 0.375,
    "1/2": 0.5,
    "5/8": 0.625,
    "3/4": 0.75,
    "7/8": 0.875,
    "1/16": 0.0625,
    "3/16": 0.1875,
    "5/16": 0.3125,
    "7/16": 0.4375,
    "9/16": 0.5625,
    "11/16": 0.6875,
    "13/16": 0.8125,
    "15/16": 0.9375,
}


def parse_numeric_dimension(val_str: str) -> Optional[float]:
    """
    Parses a string representing a number, decimal, or fraction into a float.
    Examples:
      '8' -> 8.0
      '1.5' -> 1.5
      '1/2' -> 0.5
      '1 1/2' -> 1.5
      '2-1/2' -> 2.5
    """
    val_str = val_str.strip()
    if not val_str:
        return None

    # Mixed fraction like '1 1/2' or '2-1/2'
    mixed_match = re.match(r"^(\d+)(?:[\s-]+)(\d+/\d+)$", val_str)
    if mixed_match:
        whole = float(mixed_match.group(1))
        frac_part = mixed_match.group(2)
        if frac_part in FRACTIONS_MAP:
            return whole + FRACTIONS_MAP[frac_part]
        elif "/" in frac_part:
            num, denom = frac_part.split("/")
            return whole + (float(num) / float(denom))

    # Simple fraction like '1/2' or '3/4'
    if val_str in FRACTIONS_MAP:
        return FRACTIONS_MAP[val_str]
    elif "/" in val_str:
        parts = val_str.split("/")
        if len(parts) == 2:
            try:
                return float(parts[0]) / float(parts[1])
            except (ValueError, ZeroDivisionError):
                return None

    # Decimal or integer
    try:
        return float(val_str)
    except ValueError:
        return None


def normalize_dimension_to_mm(raw_val: str, raw_unit: str) -> Optional[Tuple[float, str]]:
    """
    Converts a parsed numeric dimension and its unit to MM.
    Returns: (normalized_value_float, 'MM') or None if unknown unit.
    """
    num_val = parse_numeric_dimension(raw_val)
    if num_val is None:
        return None

    unit_clean = raw_unit.upper().strip()

    if unit_clean in ["INCH", "IN", '"', "INCHES"]:
        mm_val = round(num_val * INCH_TO_MM, 2)
        # If integer equivalent (e.g. 50.8, 203.2), format cleanly
        return (mm_val, "MM")
    elif unit_clean == "MM":
        return (round(num_val, 2), "MM")
    elif unit_clean == "CM":
        return (round(num_val * CM_TO_MM, 2), "MM")
    elif unit_clean == "M":
        return (round(num_val * M_TO_MM, 2), "MM")
    elif unit_clean in ["NB", "DN"]:
        # Nominal bore is roughly equivalent to MM in metric piping
        return (round(num_val, 2), "MM")

    return None


def format_normalized_dimension(raw_string: str) -> Optional[Dict[str, Any]]:
    """
    Helper to detect and convert an isolated dimension expression like '8 INCH' or '50.8 MM'.
    Returns structured dict with raw_value, normalized_value, normalized_unit.
    """
    # Pattern: number + unit
    match = re.match(
        r"^(\d+(?:\.\d+)?|\d+[\s-]+\d+/\d+|\d+/\d+)\s*(INCH|IN|\"|MM|CM|M|NB|DN)?$",
        raw_string.strip(),
        re.IGNORECASE,
    )
    if not match:
        return None

    num_part = match.group(1)
    unit_part = match.group(2) or "INCH" if '"' in raw_string else "INCH"

    res = normalize_dimension_to_mm(num_part, unit_part)
    if res:
        norm_val, norm_unit = res
        return {
            "raw_value": raw_string.strip(),
            "normalized_value": str(norm_val) if norm_val % 1 != 0 else str(int(norm_val)),
            "normalized_unit": norm_unit,
            "numeric_value": norm_val,
        }
    return None
