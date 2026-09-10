"""
CANONIX Phase 4 AI Semantic Material Matching & Candidate Discovery Test Suite
Validates:
1. Identical normalized materials match as SAME (score >= 0.90)
2. Different size reduces score, not SAME
3. Different material family (e.g. CS vs SS) triggers hard block
4. Pressure class conflict (e.g. 150# vs 300#) triggers hard block
5. Different material types classify as DIFFERENT
6. Missing optional attribute yields UNKNOWN, not MISMATCH (no hard block)
7. Cross-CPSE candidate discovery (CPCL vs IOCL)
8. No self-match
9. Pair deduplication (A-B and B-A stored canonically as A < B)
10. Embedding dimension is exactly 384
11. Embedding determinism (same DNA -> identical vector)
12. Stale embedding hash change detection
13. Raw data preservation (raw_description and material_code strictly immutable)
14. Unnormalized materials rejected cleanly
15. Hard constraint overrides high semantic score (capped <= 0.50)
"""

import pytest
import uuid
import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.models.cpse import CPSE
from app.models.material import Material
from app.models.material_attribute import MaterialAttribute
from app.models.material_embedding import MaterialEmbedding
from app.models.material_match import MaterialMatch
from app.services.normalization import run_normalization_pipeline
from app.services.matching import (
    EMBEDDING_MODEL,
    EMBEDDING_DIMENSION,
    SAME_THRESHOLD,
    embed_material,
    batch_embed_materials,
    find_top_k_candidates,
    compare_technical_attributes,
    evaluate_engineering_rules,
    calculate_hybrid_score,
    compute_classification_score,
    classify_relationship,
    generate_match_explanation,
    match_single_material,
    generate_deterministic_embedding_text,
    compute_source_text_hash,
    embed_text,
)

client = TestClient(app)


def get_auth_token(email: str = "admin@cpcl.co.in", password: str = "Canonix@2026") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


def create_normalized_material(db, code: str, raw_desc: str, cpse_code: str = "CPCL") -> Material:
    """Helper to normalize and persist a material with attributes and DNA into the test database."""
    cpse = db.query(CPSE).filter(CPSE.code == cpse_code).first()
    norm_res = run_normalization_pipeline(raw_desc)

    safe_code = f"{code}-{uuid.uuid4().hex[:6]}"
    mat = Material(
        material_code=safe_code,
        raw_description=raw_desc,
        canonical_description=norm_res.canonical_description,
        material_type=norm_res.material_type,
        material_group=norm_res.material_group,
        material_dna=norm_res.material_dna,
        normalization_status="NORMALIZED",
        cpse_id=cpse.id,
        order_qty=10,
        uom="NOS",
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)

    for attr in norm_res.attributes:
        db.add(MaterialAttribute(
            material_id=mat.id,
            attribute_name=attr.name,
            raw_value=attr.raw_value,
            normalized_value=attr.normalized_value,
            normalized_unit=attr.normalized_unit,
            confidence_score=attr.confidence,
            extraction_method=attr.method,
        ))
    db.commit()
    db.refresh(mat)
    return mat


# ─── 1. Identical Normalized Materials Match (SAME) ───────────────────────────

def test_identical_normalized_materials_match_same(db):
    """
    PIPE 8 BE, SMLS, A106 GR.B, STD (CPCL) vs
    PIPE 8 INCH BE, SEAMLESS, ASTM A106 Gr.B, SCH.STD (IOCL)
    Should yield SAME (final_score >= 0.90) and hard_blocked = False.
    """
    mat_a = create_normalized_material(db, "TEST-CPCL-001", "PIPE 8 BE, SMLS, A106 GR.B, STD", "CPCL")
    mat_b = create_normalized_material(db, "TEST-IOCL-001", "PIPE 8 INCH BE, SEAMLESS, ASTM A106 Gr.B, SCH.STD", "IOCL")

    embed_material(mat_a, db)
    embed_material(mat_b, db)

    matches = match_single_material(mat_a.id, db)
    assert len(matches) > 0

    match_b = next((m for m in matches if m.material_b_id == mat_b.id or m.material_a_id == mat_b.id), None)
    assert match_b is not None, "Candidate IOCL material was not matched"
    assert match_b.relationship_type == "SAME"
    assert match_b.final_score >= SAME_THRESHOLD
    assert match_b.hard_blocked is False
    assert len(match_b.explanation) > 0


# ─── 2. Different Size (8" vs 2") ─────────────────────────────────────────────

def test_different_size_reduces_score(db):
    """
    PIPE 8 BE, SMLS, A106 GR.B, STD vs PIPE 2 BE, SMLS, A106 GR.B, STD
    Should have size mismatch, cannot be SAME.
    """
    mat_8in = create_normalized_material(db, "TEST-P-8IN", "PIPE 8 BE, SMLS, A106 GR.B, STD", "CPCL")
    mat_2in = create_normalized_material(db, "TEST-P-2IN", "PIPE 2 BE, SMLS, A106 GR.B, STD", "CPCL")

    embed_material(mat_8in, db)
    embed_material(mat_2in, db)

    matches = match_single_material(mat_8in.id, db)
    match_found = next((m for m in matches if m.material_b_id == mat_2in.id or m.material_a_id == mat_2in.id), None)

    if match_found:
        assert match_found.relationship_type != "SAME", "Different sizes must not be classified as SAME"
        details = match_found.comparison_details
        if "size" in details:
            assert details["size"]["status"] == "MISMATCH"


# ─── 3. Different Material Family (CS vs SS) ──────────────────────────────────

def test_different_material_family_hard_blocked(db):
    """
    Carbon Steel (A106) vs Stainless Steel (A312 TP304)
    Must be hard_blocked = True and cannot be SAME.
    """
    mat_cs = create_normalized_material(db, "TEST-CS-PIPE", "PIPE 8 BE, SMLS, A106 GR.B, STD", "CPCL")
    mat_ss = create_normalized_material(db, "TEST-SS-PIPE", "PIPE 8 BE, SMLS, ASTM A312 TP304, STD", "IOCL")

    embed_material(mat_cs, db)
    embed_material(mat_ss, db)

    matches = match_single_material(mat_cs.id, db)
    match = next((m for m in matches if m.material_b_id == mat_ss.id or m.material_a_id == mat_ss.id), None)

    assert match is not None
    assert match.hard_blocked is True
    assert match.relationship_type != "SAME"
    assert match.final_score <= 0.50
    assert "incompatibility" in match.explanation.lower() or "conflict" in match.explanation.lower()


# ─── 4. Pressure Class Conflict (150# vs 300#) ────────────────────────────────

def test_pressure_class_conflict_hard_blocked(db):
    """
    FLANGE CLASS 150 vs FLANGE CLASS 300
    Must trigger hard block on pressure rating conflict.
    """
    mat_150 = create_normalized_material(db, "TEST-FLG-150", "FLANGE WNRF 8 INCH CLASS 150 ASTM A105", "CPCL")
    mat_300 = create_normalized_material(db, "TEST-FLG-300", "FLANGE WNRF 8 INCH CLASS 300 ASTM A105", "IOCL")

    embed_material(mat_150, db)
    embed_material(mat_300, db)

    matches = match_single_material(mat_150.id, db)
    match = next((m for m in matches if m.material_b_id == mat_300.id or m.material_a_id == mat_300.id), None)

    assert match is not None
    assert match.hard_blocked is True
    assert match.relationship_type != "SAME"
    assert match.final_score <= 0.50
    assert "pressure" in match.explanation.lower() or "conflict" in match.explanation.lower()


# ─── 5. Different Material Types (PIPE vs VALVE) ──────────────────────────────

def test_different_material_types_classify_as_different(db):
    """
    PIPE vs VALVE
    Must trigger MATERIAL_TYPE_MISMATCH hard block and classify as DIFFERENT.
    """
    mat_pipe = create_normalized_material(db, "TEST-PIPE-DIFF", "PIPE 8 BE, SMLS, A106 GR.B, STD", "CPCL")
    mat_valve = create_normalized_material(db, "TEST-VALVE-DIFF", "GATE VALVE 8 INCH CLASS 150 FLANGED ASTM A216 WCB", "CPCL")

    rules = evaluate_engineering_rules(mat_pipe, mat_valve)
    assert rules["hard_block"] is True
    assert any(r["rule"] == "MATERIAL_TYPE_MISMATCH" for r in rules["rules_triggered"])

    cls_score = compute_classification_score(mat_pipe, mat_valve)
    assert cls_score < 1.0

    rel = classify_relationship(final_score=0.40, hard_blocked=True)
    assert rel == "DIFFERENT"


# ─── 6. Unknown Attribute Handling ────────────────────────────────────────────

def test_unknown_attribute_handling():
    """
    When one material lacks an attribute present in the other,
    the status must be UNKNOWN, NOT MISMATCH, and NOT hard-blocked.
    """
    dna_a = {"material_type": "PIPE", "size": {"value": 203.2, "unit": "MM"}, "material_grade": "A106 GR.B", "standard": "ASME B16.9"}
    dna_b = {"material_type": "PIPE", "size": {"value": 203.2, "unit": "MM"}, "material_grade": "A106 GR.B"}  # missing standard

    score, details = compare_technical_attributes(dna_a, dna_b)
    assert "standard" in details
    assert details["standard"]["status"] == "UNKNOWN"
    assert details["standard"]["status"] != "MISMATCH"


# ─── 7. Cross-CPSE Candidate Discovery ────────────────────────────────────────

def test_cross_cpse_candidate_discovery(db):
    """
    Candidate discovery must find matching items across different CPSEs.
    """
    mat_cpcl = create_normalized_material(db, "TEST-CPCL-CROSS", "CENTRIFUGAL PUMP 50 M3/HR CARBON STEEL", "CPCL")
    mat_iocl = create_normalized_material(db, "TEST-IOCL-CROSS", "PUMP CENTRIFUGAL 50 M3/HR CS", "IOCL")

    # Generate embeddings
    embed_material(mat_cpcl, db)
    embed_material(mat_iocl, db)

    candidates = find_top_k_candidates(mat_cpcl.id, db, top_k=5)
    candidate_ids = [c[0].id for c in candidates]
    assert mat_iocl.id in candidate_ids, "IOCL pump candidate was not discovered for CPCL pump"


# ─── 8. No Self-Match ─────────────────────────────────────────────────────────

def test_no_self_match(db):
    """
    Material cannot match itself in candidate discovery or pipeline.
    """
    mat = create_normalized_material(db, "TEST-SELF-01", "PIPE 6 BE, SMLS, A106 GR.B, STD", "CPCL")
    embed_material(mat, db)

    candidates = find_top_k_candidates(mat.id, db)
    assert all(c[0].id != mat.id for c in candidates)

    matches = match_single_material(mat.id, db)
    assert all(m.material_a_id != m.material_b_id for m in matches)


# ─── 9. Pair Deduplication (Canonical Order A < B) ────────────────────────────

def test_pair_deduplication(db):
    """
    A-B and B-A must be stored under canonical order material_a_id < material_b_id.
    """
    mat_a = create_normalized_material(db, "TEST-PAIR-A", "BALL VALVE 4 INCH CLASS 150 FLANGED WCB", "CPCL")
    mat_b = create_normalized_material(db, "TEST-PAIR-B", "VALVE BALL 4 INCH 150# FLG ASTM A216 WCB", "IOCL")

    embed_material(mat_a, db)
    embed_material(mat_b, db)

    # Match from A
    match_single_material(mat_a.id, db)
    low_id, high_id = sorted([mat_a.id, mat_b.id])
    pairs_count_1 = db.query(MaterialMatch).filter(
        MaterialMatch.material_a_id == low_id,
        MaterialMatch.material_b_id == high_id,
    ).count()
    assert pairs_count_1 == 1

    # Match from B (inverse)
    match_single_material(mat_b.id, db)
    pairs_count_2 = db.query(MaterialMatch).filter(
        MaterialMatch.material_a_id == low_id,
        MaterialMatch.material_b_id == high_id,
    ).count()
    assert pairs_count_2 == 1, "Inverse match created duplicate row instead of updating canonical pair"

    # Confirm that inverted order (high_id as material_a_id) never exists in DB
    inverted_count = db.query(MaterialMatch).filter(
        MaterialMatch.material_a_id == high_id,
        MaterialMatch.material_b_id == low_id,
    ).count()
    assert inverted_count == 0, "Non-canonical pair (A > B) exists in database!"


# ─── 10. Embedding Dimension is Exactly 384 ───────────────────────────────────

def test_embedding_dimension(db):
    """
    Embedding vectors must be exactly 384-dimensional for all-MiniLM-L6-v2.
    """
    mat = create_normalized_material(db, "TEST-DIM-01", "PIPE 10 BE, SMLS, A106 GR.B, STD", "CPCL")
    emb = embed_material(mat, db)

    assert len(emb.embedding) == EMBEDDING_DIMENSION
    assert len(emb.embedding) == 384
    assert emb.model_name == EMBEDDING_MODEL


# ─── 11. Embedding Determinism ────────────────────────────────────────────────

def test_embedding_determinism(db):
    """
    The same material text must produce identical vector embeddings.
    """
    mat = create_normalized_material(db, "TEST-DET-01", "GATE VALVE 6 INCH CLASS 300 FLANGED WCB", "CPCL")
    emb1 = embed_material(mat, db)
    vec1 = np.array(emb1.embedding, dtype=np.float32)

    # Re-embed directly from deterministic text
    text = generate_deterministic_embedding_text(mat)
    vec2 = np.array(embed_text(text), dtype=np.float32)

    cosine_sim = float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))
    assert cosine_sim >= 0.99999, f"Embedding is not deterministic: cosine={cosine_sim}"


# ─── 12. Stale Embedding Detection ────────────────────────────────────────────

def test_stale_embedding_detection(db):
    """
    Changing material DNA must produce a different source_text_hash.
    """
    mat = create_normalized_material(db, "TEST-STALE-01", "PIPE 4 BE, SMLS, A106 GR.B, STD", "CPCL")
    emb = embed_material(mat, db)
    initial_hash = emb.source_text_hash

    # Modify DNA
    mat.material_dna = {**mat.material_dna, "schedule": "SCH 80"}
    db.commit()

    new_text = generate_deterministic_embedding_text(mat)
    new_hash = compute_source_text_hash(new_text)

    assert initial_hash != new_hash, "DNA modification failed to change embedding text hash"


# ─── 13. Raw Data Preservation ────────────────────────────────────────────────

def test_raw_data_preservation(db):
    """
    raw_description and material_code must remain strictly unaltered through matching.
    """
    raw = "PIPE 8 BE, SMLS, A106 GR.B, STD"
    code = "TEST-PRESERVE-01"
    mat = create_normalized_material(db, code, raw, "CPCL")
    saved_code = mat.material_code
    saved_raw = mat.raw_description

    # Run embedding and matching
    embed_material(mat, db)
    match_single_material(mat.id, db)

    db.refresh(mat)
    assert mat.raw_description == saved_raw, "raw_description was altered!"
    assert mat.material_code == saved_code, "material_code was altered!"


# ─── 14. Unnormalized Material Rejected ───────────────────────────────────────

def test_unnormalized_material_rejected(db):
    """
    Materials that are not NORMALIZED must be rejected by embedding and matching.
    """
    cpse = db.query(CPSE).filter(CPSE.code == "CPCL").first()
    raw_mat = Material(
        material_code=f"TEST-RAW-{uuid.uuid4().hex[:6]}",
        raw_description="UNPROCESSED DESCRIPTION STRING",
        normalization_status="RAW",
        cpse_id=cpse.id,
        order_qty=1,
        uom="NOS",
    )
    db.add(raw_mat)
    db.commit()
    db.refresh(raw_mat)

    with pytest.raises(ValueError, match="unnormalized"):
        embed_material(raw_mat, db)

    with pytest.raises(ValueError, match="unnormalized"):
        match_single_material(raw_mat.id, db)


# ─── 15. Hard Constraint Overrides High Semantic Score ────────────────────────

def test_hard_constraint_overrides_high_semantic_score(db):
    """
    Even if semantic similarity is 0.99, a pressure class conflict must
    force hard_blocked = True, cap the final score <= 0.50, and prevent SAME.
    """
    mat_150 = create_normalized_material(db, "TEST-OVR-150", "FLANGE WNRF 8 INCH CLASS 150 ASTM A105", "CPCL")
    mat_300 = create_normalized_material(db, "TEST-OVR-300", "FLANGE WNRF 8 INCH CLASS 300 ASTM A105", "IOCL")

    rules = evaluate_engineering_rules(mat_150, mat_300)
    assert rules["hard_block"] is True

    # Calculate hybrid score with artificially high semantic similarity (0.99)
    score = calculate_hybrid_score(
        semantic_score=0.99,
        attribute_score=1.0,
        rule_score=rules["rule_score"],
        classification_score=1.0,
        hard_blocked=True,
    )

    assert score <= 0.50
    rel = classify_relationship(score, hard_blocked=True)
    assert rel != "SAME"
    assert rel != "NEAR_DUPLICATE"
