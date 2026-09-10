"""
CANONIX Phase 3 Normalization Test Suite
Validates:
1. Rule-based abbreviation expansion
2. Physical dimension normalization (INCH -> MM)
3. Material classification independent of code prefixes
4. Attribute extraction and confidence scoring
5. Material DNA structured representation
6. Canonical description generation
7. Strict preservation of raw_description and material_code
8. Error containment for unknown descriptions
9. API endpoints for single & batch normalization
"""

import pytest
import io
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.services.normalization import (
    run_normalization_pipeline,
    clean_text,
    expand_abbreviations,
    normalize_dimension_to_mm,
    classify_material,
    extract_attributes,
    build_material_dna,
    build_canonical_description,
)

client = TestClient(app)


def get_auth_token(email: str = "admin@cpcl.co.in", password: str = "Canonix@2026") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


# ─── Unit Tests for Transformation Engine ─────────────────────────────────────

def test_piping_sample_1():
    """
    Test Case 1: PIPE 8 BE, SMLS, A106 GR.B, STD
    Expected: PIPE, 203.2 MM, SEAMLESS, ASTM A106 GR.B, STD, BE
    """
    res = run_normalization_pipeline("PIPE 8 BE, SMLS, A106 GR.B, STD")
    assert res.material_type == "PIPE"
    assert res.material_group == "PIPING"

    attr_map = {a.name: a for a in res.attributes}
    assert "size" in attr_map
    assert attr_map["size"].normalized_value == "203.2"
    assert attr_map["size"].normalized_unit == "MM"

    assert "construction" in attr_map
    assert attr_map["construction"].normalized_value == "SEAMLESS"

    assert "material_grade" in attr_map
    assert "ASTM A106 GR.B" in attr_map["material_grade"].normalized_value

    assert "schedule" in attr_map
    assert attr_map["schedule"].normalized_value == "STD"

    assert "end_type" in attr_map
    assert attr_map["end_type"].normalized_value == "BE"

    # Material DNA
    dna = res.material_dna
    assert dna["material_type"] == "PIPE"
    assert dna["size"]["value"] == 203.2
    assert dna["size"]["unit"] == "MM"
    assert dna["construction"] == "SEAMLESS"
    assert dna["schedule"] == "STD"
    assert dna["end_type"] == "BE"


def test_piping_sample_2_equivalence():
    """
    Test Case 2: PIPE 8 INCH BE, SEAMLESS, ASTM A106 Gr.B, SCH.STD, B-36.10
    Produces equivalent core attributes as Sample 1, with ASME B36.10 standard.
    """
    res = run_normalization_pipeline("PIPE 8 INCH BE, SEAMLESS, ASTM A106 Gr.B, SCH.STD, B-36.10")
    assert res.material_type == "PIPE"
    assert res.material_group == "PIPING"

    attr_map = {a.name: a for a in res.attributes}
    assert attr_map["size"].normalized_value == "203.2"
    assert attr_map["size"].normalized_unit == "MM"
    assert attr_map["construction"].normalized_value == "SEAMLESS"
    assert "ASTM A106 GR.B" in attr_map["material_grade"].normalized_value
    assert attr_map["schedule"].normalized_value == "STD"
    assert attr_map["end_type"].normalized_value == "BE"
    assert attr_map["standard"].normalized_value == "ASME B36.10"

    # DNA matches Sample 1 on core attributes
    dna = res.material_dna
    assert dna["size"]["value"] == 203.2
    assert dna["standard"] == "ASME B36.10"


def test_unit_normalization_2_inch_to_mm():
    """
    Test Case 3: 2 INCH -> 50.8 MM
    """
    val, unit = normalize_dimension_to_mm("2", "INCH")
    assert val == 50.8
    assert unit == "MM"

    res = run_normalization_pipeline("PIPE 2 INCH SEAMLESS")
    attr_map = {a.name: a for a in res.attributes}
    assert attr_map["size"].normalized_value == "50.8"
    assert attr_map["size"].normalized_unit == "MM"


def test_pressure_class_normalization():
    """
    Test Case 4: CL300 / 300# -> CLASS 300
    """
    res1 = run_normalization_pipeline("FLANGE 2 INCH CL300 RF")
    attr_map1 = {a.name: a for a in res1.attributes}
    assert attr_map1["pressure_class"].normalized_value == "CLASS 300"

    res2 = run_normalization_pipeline("FLANGE 2 INCH 300# RF")
    attr_map2 = {a.name: a for a in res2.attributes}
    assert attr_map2["pressure_class"].normalized_value == "CLASS 300"


def test_standard_normalization():
    """
    Test Case 5: B-36.10 -> ASME B36.10
    """
    res = run_normalization_pipeline("PIPE 8 INCH B-36.10")
    attr_map = {a.name: a for a in res.attributes}
    assert attr_map["standard"].normalized_value == "ASME B36.10"


def test_ss_token_aware():
    """
    Test Case 6: SS -> STAINLESS STEEL without modifying words like PRESSURE
    """
    # Standalone SS expanded
    res1 = run_normalization_pipeline("PIPE 2 INCH SS 316L")
    assert "STAINLESS STEEL" in res1.normalized_description

    # Word containing SS (PRESSURE) not modified
    res2 = run_normalization_pipeline("PRESSURE TRANSMITTER 0-10 BAR")
    assert "PRESSURE" in res2.normalized_description
    assert "STAINLESS STEEL" not in res2.normalized_description


def test_cs_expansion():
    """
    Test Case 7: CS -> CARBON STEEL
    """
    res = run_normalization_pipeline("VALVE 2 INCH CS A105")
    assert "CARBON STEEL" in res.normalized_description
    assert "ASTM A105" in res.normalized_description


def test_smls_expansion():
    """
    Test Case 8: SMLS -> SEAMLESS
    """
    res = run_normalization_pipeline("PIPE 8 INCH SMLS A106")
    assert "SEAMLESS" in res.normalized_description
    attr_map = {a.name: a for a in res.attributes}
    assert attr_map["construction"].normalized_value == "SEAMLESS"


def test_unknown_description_no_invented_attributes():
    """
    Test Case 9: Unknown / unparseable description results in no invented attributes
    """
    res = run_normalization_pipeline("MISCELLANEOUS OFFICE STATIONERY BOX 500")
    assert res.material_type == "OTHER"
    assert len(res.attributes) == 0
    assert res.material_dna["size"] is None
    assert res.normalization_status in ["REVIEW_REQUIRED", "FAILED"]


def test_raw_description_and_code_preservation():
    """
    Test Cases 10 & 11:
    - raw_description remains 100% unchanged
    - material_code (e.g. M-PIPE-00772) remains exact string
    """
    token = get_auth_token("admin@cpcl.co.in")
    code = "M-PIPE-00772"
    raw_desc = "PIPE 8 BE, SMLS, A106 GR.B, STD"

    csv_content = f'''Material Code,Description,Order Qty,UOM
{code},"{raw_desc}",10,EA
'''
    files = {"file": ("test_code_preserve.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = client.post("/api/v1/uploads", files=files, headers={"Authorization": f"Bearer {token}"})
    assert upload_res.status_code == 200
    file_id = upload_res.json()["file_id"]

    # Import
    imp_res = client.post(f"/api/v1/uploads/{file_id}/import", headers={"Authorization": f"Bearer {token}"})
    assert imp_res.status_code == 200

    # Query material
    mat_res = client.get(f"/api/v1/materials?q={code}", headers={"Authorization": f"Bearer {token}"})
    assert mat_res.status_code == 200
    mats = mat_res.json()["items"]
    assert len(mats) == 1
    mat_id = mats[0]["id"]
    assert mats[0]["material_code"] == code
    assert mats[0]["raw_description"] == raw_desc

    # Trigger normalization on single material
    norm_res = client.post(f"/api/v1/materials/{mat_id}/normalize", headers={"Authorization": f"Bearer {token}"})
    assert norm_res.status_code == 200
    data = norm_res.json()

    # RAW DESCRIPTION MUST BE EXACTLY AS UPLOADED
    assert data["raw_description"] == raw_desc
    # MATERIAL CODE MUST BE EXACTLY AS SUPPLIED
    assert data["material_code"] == code

    # DERIVED FIELDS MUST BE POPULATED SEPARATELY
    assert data["normalization_status"] == "NORMALIZED"
    assert data["material_type"] == "PIPE"
    assert data["material_group"] == "PIPING"
    assert data["canonical_description"] is not None
    assert "8 INCH" in data["canonical_description"]
    assert "SEAMLESS" in data["canonical_description"]
    assert data["material_dna"]["size"]["value"] == 203.2
    assert len(data["attributes"]) > 0


def test_batch_normalization_arbitrary_sizes():
    """
    Test Case 12: Batch normalization on multiple items without hardcoded limits
    """
    token = get_auth_token("admin@cpcl.co.in")
    uid = uuid.uuid4().hex[:6].upper()

    csv_rows = [
        f"CPCL-BAT-{uid}-01,VALVE BALL 2IN 150# RF A105,5,EA",
        f"CPCL-BAT-{uid}-02,PIPE 4 INCH SCH 40 SEAMLESS A106,10,MTR",
        f"CPCL-BAT-{uid}-03,GASKET SPIRAL WOUND 3IN 300# 316L,20,NOS",
        f"CPCL-BAT-{uid}-04,FLANGE WELD NECK 6IN 150# A105,8,EA",
        f"CPCL-BAT-{uid}-05,UNKNOWN NON TECHNICAL GADGET,1,SET",
    ]
    csv_content = "Material Code,Description,Order Qty,UOM\n" + "\n".join(csv_rows) + "\n"

    files = {"file": ("batch_norm_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = client.post("/api/v1/uploads", files=files, headers={"Authorization": f"Bearer {token}"})
    assert upload_res.status_code == 200
    file_id = upload_res.json()["file_id"]

    client.post(f"/api/v1/uploads/{file_id}/import", headers={"Authorization": f"Bearer {token}"})

    # Trigger batch normalize endpoint for this dataset
    batch_res = client.post(
        "/api/v1/materials/normalize",
        json={"uploaded_file_id": file_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert batch_res.status_code == 200
    bdata = batch_res.json()
    assert bdata["total_processed"] == 5
    assert bdata["normalized_count"] >= 4
    assert bdata["review_required_count"] >= 1


def test_material_details_raw_vs_canonix_intelligence():
    """
    Test Case 13 & 14:
    Material detail endpoint provides both RAW source data and Canonix Intelligence
    with structured attributes (raw_value, normalized_value, unit, confidence, method).
    """
    token = get_auth_token("admin@cpcl.co.in")
    uid = uuid.uuid4().hex[:6].upper()
    code = f"CPCL-DET-{uid}"

    csv_content = f"""Material Code,Description,Order Qty,UOM
{code},VALVE GATE 3IN 300# RF A216 WCB FLANGED,4,EA
"""
    files = {"file": ("det_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = client.post("/api/v1/uploads", files=files, headers={"Authorization": f"Bearer {token}"})
    file_id = upload_res.json()["file_id"]
    client.post(f"/api/v1/uploads/{file_id}/import", headers={"Authorization": f"Bearer {token}"})

    mat_list = client.get(f"/api/v1/materials?q={code}", headers={"Authorization": f"Bearer {token}"})
    mat_id = mat_list.json()["items"][0]["id"]

    # Normalize
    client.post(f"/api/v1/materials/{mat_id}/normalize", headers={"Authorization": f"Bearer {token}"})

    # Fetch full detail
    det_res = client.get(f"/api/v1/materials/{mat_id}", headers={"Authorization": f"Bearer {token}"})
    assert det_res.status_code == 200
    d = det_res.json()

    # Section A: RAW DATA
    assert d["material_code"] == code
    assert d["raw_description"] == "VALVE GATE 3IN 300# RF A216 WCB FLANGED"
    assert d["order_qty"] == 4.0
    assert d["uom"] == "EA"

    # Section B: CANONIX INTELLIGENCE
    assert d["material_type"] == "VALVE"
    assert d["material_group"] == "VALVES"
    assert d["material_dna"]["valve_type"] == "GATE"
    assert d["material_dna"]["size"]["value"] == 76.2  # 3 inch = 76.2 mm
    assert d["material_dna"]["pressure_class"] == "CLASS 300"

    # Attributes list with explainability
    for attr in d["attributes"]:
        assert attr["attribute_name"] is not None
        assert attr["confidence_score"] > 0
        assert attr["extraction_method"] is not None


# ─── Phase 3 Correction Regression Tests ──────────────────────────────────────

def test_centrifugal_pump_regression():
    """
    Regression Test 1: CENTRIFUGAL PUMP 50 M3/HR CARBON STEEL
    Verifies:
    - PUMP classification
    - ROTATING_EQUIPMENT group
    - No size = 50 M3/HR (physical size is None, flow_rate is extracted)
    - material_family and body_material are CARBON STEEL
    - material_grade is None (generic metallurgy is not treated as ASTM grade)
    - No duplicate CARBON STEEL in canonical description
    """
    res = run_normalization_pipeline("CENTRIFUGAL PUMP 50 M3/HR CARBON STEEL")

    # 1. Classification
    assert res.material_type == "PUMP"
    assert res.material_group == "ROTATING_EQUIPMENT"

    # 2. Attributes
    attr_map = {a.name: a for a in res.attributes}
    assert "size" not in attr_map, "50 M3/HR must not be stored as physical size"
    assert "flow_rate" in attr_map
    assert attr_map["flow_rate"].normalized_value == "50"
    assert attr_map["flow_rate"].normalized_unit == "M3/HR"

    assert "material_family" in attr_map
    assert attr_map["material_family"].normalized_value == "CARBON STEEL"
    assert "body_material" in attr_map
    assert attr_map["body_material"].normalized_value == "CARBON STEEL"
    assert "material_grade" not in attr_map, "Generic CARBON STEEL must not be fabricated into an ASTM grade"

    assert "pump_type" in attr_map
    assert attr_map["pump_type"].normalized_value == "CENTRIFUGAL"

    # 3. Material DNA
    dna = res.material_dna
    assert dna["material_type"] == "PUMP"
    assert dna["material_group"] == "ROTATING_EQUIPMENT"
    assert dna["size"] is None
    assert dna["pump_type"] == "CENTRIFUGAL"
    assert dna["body_material"] == "CARBON STEEL"
    assert dna["material_family"] == "CARBON STEEL"
    assert dna["material_grade"] is None
    assert dna["flow_rate"]["value"] == 50.0
    assert dna["flow_rate"]["unit"] == "M3/HR"

    # 4. Canonical Description
    canonical = res.canonical_description
    assert "CARBON STEEL" in canonical
    assert "PUMP" in canonical
    assert "CENTRIFUGAL" in canonical
    assert canonical.count("CARBON STEEL") == 1, f"CARBON STEEL must not be duplicated in: {canonical}"
    assert "50 M3/HR" not in canonical, "Flow rate should not pollute canonical equipment description"
    assert canonical == "CENTRIFUGAL CARBON STEEL PUMP"


def test_canonical_description_deduplication_generic():
    """
    Regression Test 4: Verify canonical descriptions do not contain repeated identical tokens/attributes.
    """
    samples = [
        ("CENTRIFUGAL PUMP 50 M3/HR CARBON STEEL CS", ["CARBON STEEL"]),
        ("VALVE 2 INCH CS CARBON STEEL A105", ["CARBON STEEL"]),
        ("PIPE 8 INCH CS CARBON STEEL SMLS A106", ["CARBON STEEL"]),
        ("FLANGE 2 INCH CS CARBON STEEL CLASS 150", ["CARBON STEEL"]),
    ]

    for raw_desc, phrases_to_check in samples:
        res = run_normalization_pipeline(raw_desc)
        canonical = res.canonical_description
        for phrase in phrases_to_check:
            count = canonical.upper().count(phrase.upper())
            assert count == 1, f"Phrase '{phrase}' duplicated ({count} times) in canonical description: '{canonical}'"

