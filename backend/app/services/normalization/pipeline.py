"""
CANONIX Master Normalization Pipeline
Coordinates the complete deterministic transformation flow:
RAW DESCRIPTION
        ↓
TEXT CLEANING
        ↓
ABBREVIATION NORMALIZATION
        ↓
UNIT NORMALIZATION
        ↓
ATTRIBUTE EXTRACTION
        ↓
MATERIAL CLASSIFICATION
        ↓
MATERIAL DNA
        ↓
CANONICAL DESCRIPTION
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.services.normalization.text_normalizer import clean_text, expand_abbreviations, normalize_raw_text
from app.services.normalization.material_classifier import classify_material
from app.services.normalization.attribute_extractor import extract_attributes, AttributeResult
from app.services.normalization.material_dna import build_material_dna
from app.services.normalization.canonical_description import build_canonical_description


class NormalizationResult:
    def __init__(
        self,
        raw_description: str,
        normalized_description: str,
        canonical_description: str,
        material_type: str,
        material_group: str,
        material_dna: Dict[str, Any],
        attributes: List[AttributeResult],
        normalization_status: str = "NORMALIZED",
        error_message: Optional[str] = None,
    ):
        self.raw_description = raw_description
        self.normalized_description = normalized_description
        self.canonical_description = canonical_description
        self.material_type = material_type
        self.material_group = material_group
        self.material_dna = material_dna
        self.attributes = attributes
        self.normalization_status = normalization_status
        self.error_message = error_message


def run_normalization_pipeline(raw_description: str) -> NormalizationResult:
    """
    Executes the deterministic, explainable normalization pipeline for a single raw description.
    Never mutates or overwrites raw_description.
    """
    if not raw_description or not raw_description.strip():
        return NormalizationResult(
            raw_description=raw_description or "",
            normalized_description="",
            canonical_description="",
            material_type="OTHER",
            material_group="GENERAL",
            material_dna={"material_type": "OTHER", "material_group": "GENERAL"},
            attributes=[],
            normalization_status="FAILED",
            error_message="Description is empty or missing",
        )

    try:
        # 1. Text Cleaning & Abbreviation Expansion
        normalized_desc = normalize_raw_text(raw_description)

        # 2. Material Classification (Keyword & Token rules, independent of code)
        mat_type, mat_group, type_conf = classify_material(normalized_desc)

        # 3. Modular Attribute Extraction
        attributes = extract_attributes(normalized_desc, mat_type, mat_group)

        # 4. Synthesize Material DNA
        material_dna = build_material_dna(mat_type, mat_group, attributes)

        # 5. Generate Canonical Description
        canonical_desc = build_canonical_description(mat_type, mat_group, attributes, material_dna)

        # Determine status
        if mat_type == "OTHER" and len(attributes) == 0:
            status = "REVIEW_REQUIRED"
            error_msg = "Unable to confidently extract technical specifications from raw description."
        else:
            status = "NORMALIZED"
            error_msg = None

        return NormalizationResult(
            raw_description=raw_description,
            normalized_description=normalized_desc,
            canonical_description=canonical_desc,
            material_type=mat_type,
            material_group=mat_group,
            material_dna=material_dna,
            attributes=attributes,
            normalization_status=status,
            error_message=error_msg,
        )
    except Exception as exc:
        return NormalizationResult(
            raw_description=raw_description,
            normalized_description=clean_text(raw_description),
            canonical_description="",
            material_type="OTHER",
            material_group="GENERAL",
            material_dna={"material_type": "OTHER", "material_group": "GENERAL"},
            attributes=[],
            normalization_status="FAILED",
            error_message=f"Normalization pipeline error: {str(exc)}",
        )
