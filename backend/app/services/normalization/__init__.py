from app.services.normalization.pipeline import run_normalization_pipeline, NormalizationResult
from app.services.normalization.text_normalizer import clean_text, expand_abbreviations, normalize_raw_text
from app.services.normalization.unit_normalizer import normalize_dimension_to_mm, parse_numeric_dimension
from app.services.normalization.material_classifier import classify_material
from app.services.normalization.attribute_extractor import extract_attributes, AttributeResult
from app.services.normalization.material_dna import build_material_dna
from app.services.normalization.canonical_description import build_canonical_description

__all__ = [
    "run_normalization_pipeline",
    "NormalizationResult",
    "clean_text",
    "expand_abbreviations",
    "normalize_raw_text",
    "normalize_dimension_to_mm",
    "parse_numeric_dimension",
    "classify_material",
    "extract_attributes",
    "AttributeResult",
    "build_material_dna",
    "build_canonical_description",
]
