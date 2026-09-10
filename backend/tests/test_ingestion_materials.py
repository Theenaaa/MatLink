import io
import uuid
import pytest
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_token(email: str = "admin@cpcl.co.in", password: str = "Canonix@2026") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


def test_upload_and_validation_csv():
    token = get_auth_token("admin@cpcl.co.in")
    uid = uuid.uuid4().hex[:6].upper()
    
    # Generate CSV with valid rows + 1 duplicate in batch + 1 invalid numeric + 1 negative
    csv_content = f"""Material Code,Description,Order Qty,UOM
CPCL-{uid}-001,VALVE BALL 2IN 150# RF A105,10,EA
CPCL-{uid}-002,GASKET SPIRAL WOUND 3IN 300#,25,NOS
CPCL-{uid}-003,PUMP CENTRIFUGAL 50M3/HR,2,SET
CPCL-{uid}-001,DUPLICATE IN BATCH,5,EA
CPCL-{uid}-004,BOLT HEX M16X65,-10,NOS
CPCL-{uid}-005,NUT HEX M16,INVALID_QTY,NOS
"""
    files = {"file": ("test_batch_cpcl.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    res = client.post(
        "/api/v1/uploads",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200, f"Upload failed: {res.text}"
    data = res.json()
    assert data["file_name"] == "test_batch_cpcl.csv"
    assert data["total_rows"] == 6
    assert data["valid_rows"] == 3
    assert data["invalid_rows"] == 3
    assert len(data["errors"]) == 3
    assert len(data["preview_valid_rows"]) == 3


def test_missing_required_column():
    token = get_auth_token("admin@cpcl.co.in")
    uid = uuid.uuid4().hex[:6].upper()
    # CSV missing UOM column
    csv_content = f"""Material Code,Description,Order Qty
CPCL-{uid}-010,VALVE GATE 4IN 300#,10
"""
    files = {"file": ("missing_col.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    res = client.post(
        "/api/v1/uploads",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "FAILED"
    assert data["invalid_rows"] == 1
    assert any(e["error_type"] == "MISSING_HEADER" for e in data["errors"])


def test_import_dataset_and_material_listing():
    token = get_auth_token("admin@cpcl.co.in")
    uid = uuid.uuid4().hex[:6].upper()
    
    # 1. Upload a clean CSV with unique codes
    code1 = f"CPCL-IMP-{uid}-01"
    code2 = f"CPCL-IMP-{uid}-02"
    code3 = f"CPCL-IMP-{uid}-03"
    csv_content = f"""Material Code,Description,Order Qty,UOM
{code1},SEAMLESS PIPE 2IN SCH40 A106-B,150,MTR
{code2},FLANGE WNRF 2IN 150# A105,20,EA
{code3},TEE EQUAL 2IN SCH40 A234-WPB,15,EA
"""
    files = {"file": ("clean_import.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = client.post(
        "/api/v1/uploads",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert upload_res.status_code == 200
    file_id = upload_res.json()["file_id"]

    # 2. Import
    import_res = client.post(
        f"/api/v1/uploads/{file_id}/import",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert import_res.status_code == 200
    assert import_res.json()["total_imported"] == 3

    # 3. Material Listing & Search
    mat_res = client.get(
        f"/api/v1/materials?q={uid}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert mat_res.status_code == 200
    m_data = mat_res.json()
    assert m_data["total"] == 3
    pipe_item = [it for it in m_data["items"] if it["material_code"] == code1][0]
    assert "PIPE" in pipe_item["raw_description"]

    # 4. Material Details
    detail_res = client.get(
        f"/api/v1/materials/{pipe_item['id']}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert detail_res.status_code == 200
    d_data = detail_res.json()
    assert d_data["material_code"] == code1
    assert d_data["raw_description"] == "SEAMLESS PIPE 2IN SCH40 A106-B"
    assert d_data["order_qty"] == 150.0
    assert d_data["uom"] == "MTR"


def test_tenant_isolation_datasets_and_materials():
    cpcl_token = get_auth_token("admin@cpcl.co.in")
    iocl_token = get_auth_token("admin@iocl.co.in")
    sa_token = get_auth_token("superadmin@canonix.gov.in")
    uid = uuid.uuid4().hex[:6].upper()

    # 1. IOCL uploads a file
    iocl_code = f"IOCL-SECRET-{uid}"
    csv_content = f"""Material Code,Description,Order Qty,UOM
{iocl_code},REFINERY CATALYST PLATINUM 50KG,5,DRUM
"""
    files = {"file": ("iocl_secret.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = client.post(
        "/api/v1/uploads",
        files=files,
        headers={"Authorization": f"Bearer {iocl_token}"}
    )
    assert upload_res.status_code == 200
    iocl_file_id = upload_res.json()["file_id"]

    # IOCL imports the file
    client.post(
        f"/api/v1/uploads/{iocl_file_id}/import",
        headers={"Authorization": f"Bearer {iocl_token}"}
    )

    # 2. CPCL Admin attempts to access IOCL dataset -> MUST 403 Forbidden
    cross_file_res = client.get(
        f"/api/v1/uploads/{iocl_file_id}",
        headers={"Authorization": f"Bearer {cpcl_token}"}
    )
    assert cross_file_res.status_code == 403

    # 3. Super Admin accesses IOCL dataset -> 200 Allowed
    sa_file_res = client.get(
        f"/api/v1/uploads/{iocl_file_id}",
        headers={"Authorization": f"Bearer {sa_token}"}
    )
    assert sa_file_res.status_code == 200
    assert sa_file_res.json()["cpse_code"] == "IOCL"

    # 4. CPCL listing materials must NOT see IOCL secret material
    cpcl_mat_list = client.get(
        f"/api/v1/materials?q={iocl_code}",
        headers={"Authorization": f"Bearer {cpcl_token}"}
    )
    assert cpcl_mat_list.status_code == 200
    assert cpcl_mat_list.json()["total"] == 0

    # 5. Super Admin listing materials CAN see IOCL materials
    sa_mat_list = client.get(
        f"/api/v1/materials?q={iocl_code}",
        headers={"Authorization": f"Bearer {sa_token}"}
    )
    assert sa_mat_list.status_code == 200
    assert sa_mat_list.json()["total"] == 1

