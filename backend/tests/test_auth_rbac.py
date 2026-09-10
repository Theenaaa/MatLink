import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@canonix.gov.in", "password": "Canonix@2026"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "superadmin@canonix.gov.in"
    assert data["user"]["role"]["name"] == "SUPER_ADMIN"


def test_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@canonix.gov.in", "password": "WrongPassword!"},
    )
    assert response.status_code == 401


def test_get_me():
    # 1. Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@cpcl.co.in", "password": "Canonix@2026"},
    )
    token = login_res.json()["access_token"]

    # 2. Get /me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "admin@cpcl.co.in"
    assert me_data["role"]["name"] == "CPSE_ADMIN"
    assert me_data["cpse"]["code"] == "CPCL"


def test_rbac_authorization():
    # CPSE admin login
    cpcl_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@cpcl.co.in", "password": "Canonix@2026"},
    )
    cpcl_token = cpcl_res.json()["access_token"]

    # CPSE Admin accessing CPSE Admin endpoint -> Allowed
    ok_res = client.get(
        "/api/v1/auth/verify/cpse-admin",
        headers={"Authorization": f"Bearer {cpcl_token}"},
    )
    assert ok_res.status_code == 200

    # CPSE Admin accessing Super Admin endpoint -> Forbidden
    forbidden_res = client.get(
        "/api/v1/auth/verify/super-admin",
        headers={"Authorization": f"Bearer {cpcl_token}"},
    )
    assert forbidden_res.status_code == 403


def test_tenant_isolation():
    # CPCL admin
    cpcl_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@cpcl.co.in", "password": "Canonix@2026"},
    )
    cpcl_token = cpcl_res.json()["access_token"]

    # Access CPCL -> Allowed
    own_tenant = client.get(
        "/api/v1/auth/verify/tenant-access/CPCL",
        headers={"Authorization": f"Bearer {cpcl_token}"},
    )
    assert own_tenant.status_code == 200

    # Access IOCL -> Forbidden (Tenant isolation!)
    cross_tenant = client.get(
        "/api/v1/auth/verify/tenant-access/IOCL",
        headers={"Authorization": f"Bearer {cpcl_token}"},
    )
    assert cross_tenant.status_code == 403

    # Super Admin accessing IOCL -> Allowed (Universal tenant visibility)
    sa_res = client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@canonix.gov.in", "password": "Canonix@2026"},
    )
    sa_token = sa_res.json()["access_token"]
    sa_tenant = client.get(
        "/api/v1/auth/verify/tenant-access/IOCL",
        headers={"Authorization": f"Bearer {sa_token}"},
    )
    assert sa_tenant.status_code == 200
