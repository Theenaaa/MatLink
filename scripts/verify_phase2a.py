import httpx
import json
import sys

BASE_API = "http://127.0.0.1:8000"
BASE_WEB = "http://localhost:3000"

print("=" * 60)
print("CANONIX PHASE 2A: RBAC & AUTHENTICATION VERIFICATION")
print("=" * 60)

client = httpx.Client(timeout=10.0)

# 1. Health check
res = client.get(f"{BASE_API}/health")
assert res.status_code == 200, f"Health check failed: {res.status_code}"
h = res.json()
print(f"[PASS] 1. Backend Health: {h['status']} (v{h['version']})")

# 2. Super Admin Login
res = client.post(f"{BASE_API}/api/v1/auth/login", json={
    "email": "superadmin@canonix.gov.in",
    "password": "Canonix@2026"
})
assert res.status_code == 200, f"Super Admin login failed: {res.text}"
sa_data = res.json()
sa_token = sa_data["access_token"]
print(f"[PASS] 2. Super Admin Login: {sa_data['user']['role']['name']} ({sa_data['user']['email']})")

# 3. CPCL Admin Login
res = client.post(f"{BASE_API}/api/v1/auth/login", json={
    "email": "admin@cpcl.co.in",
    "password": "Canonix@2026"
})
assert res.status_code == 200, f"CPCL Admin login failed: {res.text}"
cpcl_data = res.json()
cpcl_token = cpcl_data["access_token"]
print(f"[PASS] 3. CPCL Admin Login: {cpcl_data['user']['role']['name']} [Tenant: {cpcl_data['user']['cpse']['code']}]")

# 4. Material Expert Login
res = client.post(f"{BASE_API}/api/v1/auth/login", json={
    "email": "expert@cpcl.co.in",
    "password": "Canonix@2026"
})
assert res.status_code == 200, f"Material Expert login failed: {res.text}"
expert_data = res.json()
print(f"[PASS] 4. Material Expert Login: {expert_data['user']['role']['name']} [Tenant: {expert_data['user']['cpse']['code']}]")

# 5. Procurement Analyst Login
res = client.post(f"{BASE_API}/api/v1/auth/login", json={
    "email": "analyst@cpcl.co.in",
    "password": "Canonix@2026"
})
assert res.status_code == 200, f"Procurement Analyst login failed: {res.text}"
analyst_data = res.json()
print(f"[PASS] 5. Procurement Analyst Login: {analyst_data['user']['role']['name']} [Tenant: {analyst_data['user']['cpse']['code']}]")

# 6. RBAC Guard: CPCL Admin -> Super Admin endpoint (Must 403)
res = client.get(
    f"{BASE_API}/api/v1/auth/verify/super-admin",
    headers={"Authorization": f"Bearer {cpcl_token}"}
)
assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}"
print("[PASS] 6. RBAC Guard: PASSED (CPCL Admin blocked from Super Admin endpoint with 403)")

# 7. Tenant Isolation: CPCL Admin -> IOCL data (Must 403)
res = client.get(
    f"{BASE_API}/api/v1/auth/verify/tenant-access/IOCL",
    headers={"Authorization": f"Bearer {cpcl_token}"}
)
assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}"
print("[PASS] 7. Tenant Isolation: PASSED (CPCL Admin blocked from IOCL tenant data with 403)")

# 8. Super Admin Universal Access: -> IOCL data (Must 200)
res = client.get(
    f"{BASE_API}/api/v1/auth/verify/tenant-access/IOCL",
    headers={"Authorization": f"Bearer {sa_token}"}
)
assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
sa_tenant = res.json()
print(f"[PASS] 8. Super Admin Universal Access: PASSED (Access granted to {sa_tenant['target_cpse']})")

# 9. Frontend Route check
res = client.get(f"{BASE_WEB}/login")
assert res.status_code == 200, f"Frontend /login returned {res.status_code}"
print("[PASS] 9. Frontend /login: 200 OK")

res = client.get(f"{BASE_WEB}/dashboard/super-admin")
assert res.status_code == 200, f"Frontend /dashboard/super-admin returned {res.status_code}"
print("[PASS] 10. Frontend /dashboard/super-admin: 200 OK")

res = client.get(f"{BASE_WEB}/dashboard/cpse-admin")
assert res.status_code == 200, f"Frontend /dashboard/cpse-admin returned {res.status_code}"
print("[PASS] 11. Frontend /dashboard/cpse-admin: 200 OK")

res = client.get(f"{BASE_WEB}/dashboard/material-expert")
assert res.status_code == 200, f"Frontend /dashboard/material-expert returned {res.status_code}"
print("[PASS] 12. Frontend /dashboard/material-expert: 200 OK")

res = client.get(f"{BASE_WEB}/dashboard/procurement-analyst")
assert res.status_code == 200, f"Frontend /dashboard/procurement-analyst returned {res.status_code}"
print("[PASS] 13. Frontend /dashboard/procurement-analyst: 200 OK")

print("=" * 60)
print("ALL 13 PHASE 2A TESTS PASSED WITH 100% SUCCESS!")
print("=" * 60)
