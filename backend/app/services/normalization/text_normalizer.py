"""
CANONIX Text Normalizer
Cleans raw descriptions, standardizes punctuation and casing, and performs token-aware abbreviation expansion.
"""

import re
from app.services.normalization.abbreviation_dictionary import EXACT_ABBREVIATIONS, ASTM_GRADE_PATTERNS


def clean_text(text: str) -> str:
    """
    Standardizes whitespace, casing, and safe punctuation.
    Preserves dimensions, fractions, hyphens, and engineering numbers.
    """
    if not text:
        return ""

    # Convert to uppercase
    cleaned = text.upper().strip()

    # Replace fancy/curly quotes with standard inch quote
    cleaned = cleaned.replace("”", '"').replace("“", '"').replace("’", "'").replace("‘", "'")
    # Replace double single-quote with single double-quote
    cleaned = cleaned.replace("''", '"')

    # Standardize commas and semicolons surrounded by spaces
    cleaned = re.sub(r"\s*[,;]\s*", ", ", cleaned)

    # Standardize hyphens when between spaces
    cleaned = re.sub(r"\s+-\s+", " - ", cleaned)

    # Collapse multiple whitespaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    return cleaned


def expand_abbreviations(text: str) -> str:
    """
    Applies token-aware expansion using word boundaries.
    Guarantees that substrings within unrelated words are never replaced.
    """
    if not text:
        return ""

    normalized = text

    # Apply ASTM Grade patterns first to standardize grades like "A106 Gr.B" -> "ASTM A106 GR.B"
    for pattern, replacement in ASTM_GRADE_PATTERNS:
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)

    # Apply exact token abbreviations
    for pattern, replacement in EXACT_ABBREVIATIONS.items():
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)

    # Clean up any duplicate spaces created during substitution
    normalized = re.sub(r"\s+", " ", normalized).strip()

    return normalized


def normalize_raw_text(raw_description: str) -> str:
    """
    Full text cleaning and abbreviation expansion pipeline.
    """
    cleaned = clean_text(raw_description)
    expanded = expand_abbreviations(cleaned)
    return expanded
