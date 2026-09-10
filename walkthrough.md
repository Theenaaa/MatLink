# CANONIX — Phase 2A Implementation Walkthrough
## Authentication, RBAC & Role-Based Application Shell

**Problem Statement 26099** | **Ministry of Petroleum & Natural Gas / CPCL**  
**Theme:** Smart Automation · Material Identity, Standardization and Harmonization Platform

---

### Overview of Phase 2A Completion

Phase 2A delivers the complete security and role-governed user experience on top of the Phase 1 enterprise foundation. It enforces zero-leakage Multi-Tenant CPSE Isolation and provides tailored operational dashboards for all four primary stakeholder roles.

```
LOGIN (/login)
  │
  ├── Authenticate JWT (HS256)
  ├── Extract Claims: sub (User ID), role (Role Name), cpse_id (Organization Code)
  │
  ├── ROLE-BASED ROUTING
  │     ├── SUPER_ADMIN         ──►  /dashboard/super-admin (National Command Hub)
  │     ├── CPSE_ADMIN          ──►  /dashboard/cpse-admin (Enterprise Ingestion & Validation)
  │     ├── MATERIAL_EXPERT     ──►  /dashboard/material-expert (Material DNA Studio)
  │     └── PROCUREMENT_ANALYST ──►  /dashboard/procurement-analyst (Spend & Duplicates Radar)
  │
  └── TENANT ISOLATION GUARD
        ├── CPSE User ──► Strictly bound to user.cpse_id (e.g. CPCL)
        │                 Crossing to IOCL / ONGC ──► HTTP 403 Forbidden
        └── Super Admin ──► Universal multi-tenant visibility
```

---

### Key Components Implemented

#### 1. Database Schema & Migration (`backend/migrations/versions/001_create_rbac_tables.py`)
- **`roles` Table**: Primary key, unique `name`, description, timestamps.
- **`cpse` Table**: Organization identifier with unique `code` (e.g., `CPCL`, `IOCL`, `ONGC`, `GAIL`), `name`, `status`.
- **`users` Table**: Secure user record with unique `email`, `password_hash`, foreign keys to `roles` (RESTRICT) and `cpse` (SET NULL), `is_active`, and `last_login_at`.
- **Alembic Migration**: `001_create_rbac_tables` applied directly to PostgreSQL on port 5432.

#### 2. Security & Tenant-Isolation Dependencies (`backend/app/api/deps.py`)
- **`get_current_user` / `get_current_active_user`**: Validates bearer JWT, decodes claims, and loads user profile with relations using SQLAlchemy `joinedload`.
- **`require_role` / `require_super_admin` / `require_cpse_admin` / `require_material_expert` / `require_procurement_analyst`**: Reusable FastAPI dependency role guards.
- **`enforce_cpse_access(target_cpse, current_user)`**: Ensures a CPSE user can never query or mutate another organization's catalog. Super Admins bypass this restriction for national oversight.

#### 3. Seed Database (`backend/app/database/seed_rbac.py`)
Populated standard roles, CPSE entities, and verified credentials (Password: `Canonix@2026`):

| Role | Email | CPSE Binding | Workstation Purpose |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | `superadmin@canonix.gov.in` | Universal / None | National command hub, CPSE directory, master taxonomies |
| **CPSE_ADMIN** | `admin@cpcl.co.in` | **CPCL** | Catalog ingestion, job monitoring, validation error desk |
| **MATERIAL_EXPERT** | `expert@cpcl.co.in` | **CPCL** | Material DNA decomposition, regex rules, canonical catalog |
| **PROCUREMENT_ANALYST** | `analyst@cpcl.co.in` | **CPCL** | Duplicate inventory radar, price variance, inter-CPSE transfers |
| **CPSE_ADMIN (Tenant 2)** | `admin@iocl.co.in` | **IOCL** | Secondary tenant for verifying cross-boundary isolation |

#### 4. Frontend Role-Based Application Shell & Login
- **SSO Login Screen (`/login`)**:
  - Branded for MoPNG, CPCL & Smart India Hackathon.
  - One-click interactive demo account cards for each role.
  - Automatic role detection and redirect to authorized route upon login.
- **Authentication Context (`frontend/src/context/AuthContext.tsx`)**:
  - Manages JWT tokens in `localStorage`, user state, and automatic token verification via `/api/v1/auth/me`.
- **Role Shell Layout (`frontend/src/components/RoleShell.tsx`)**:
  - Global header with emblem, active CPSE tenant badge, tenant isolation status, user pill, and logout.
  - Dynamic role-tailored sidebar with role-specific navigation links.
  - **Live RBAC Isolation Tester**: In-app buttons to test tenant boundary enforcement (CPCL vs IOCL).
- **Four Dedicated Role Dashboards**:
  1. `/dashboard/super-admin`: National Master Command Portal with cross-CPSE federation table and duplication matrix.
  2. `/dashboard/cpse-admin`: Enterprise Catalog Administration with Batch Ingestion uploader (CSV/XLSX), Async Processing Jobs (`processing_jobs`), and Row-Level Validation Center (`validation_errors`).
  3. `/dashboard/material-expert`: Material DNA Studio with multi-dimensional JSONB attribute decomposition, normalization comparison, and confidence scoring.
  4. `/dashboard/procurement-analyst`: Spend Rationalization Hub with cross-enterprise duplicate radar, price variance tracking, and pooling recommendations.

---

### Verification & Testing Results

#### Automated Pytest Suite (7 Passed)
```
tests/test_auth_rbac.py::test_login_success PASSED            [ 14%]
tests/test_auth_rbac.py::test_login_invalid_password PASSED   [ 28%]
tests/test_auth_rbac.py::test_get_me PASSED                   [ 42%]
tests/test_auth_rbac.py::test_rbac_authorization PASSED       [ 57%]
tests/test_auth_rbac.py::test_tenant_isolation PASSED         [ 71%]
tests/test_health.py::test_root PASSED                        [ 85%]
tests/test_health.py::test_health_check PASSED                [100%]
============================== 7 passed in 2.23s ==============================
```

#### End-to-End Integration Suite (`scripts/verify_phase2a.py` — 13/13 Passed)
```
[PASS] 1. Backend Health: online (v1.0.0)
[PASS] 2. Super Admin Login: SUPER_ADMIN (superadmin@canonix.gov.in)
[PASS] 3. CPCL Admin Login: CPSE_ADMIN [Tenant: CPCL]
[PASS] 4. Material Expert Login: MATERIAL_EXPERT [Tenant: CPCL]
[PASS] 5. Procurement Analyst Login: PROCUREMENT_ANALYST [Tenant: CPCL]
[PASS] 6. RBAC Guard: PASSED (CPCL Admin blocked from Super Admin endpoint with 403)
[PASS] 7. Tenant Isolation: PASSED (CPCL Admin blocked from IOCL tenant data with 403)
[PASS] 8. Super Admin Universal Access: PASSED (Access granted to IOCL)
[PASS] 9. Frontend /login: 200 OK
[PASS] 10. Frontend /dashboard/super-admin: 200 OK
[PASS] 11. Frontend /dashboard/cpse-admin: 200 OK
[PASS] 12. Frontend /dashboard/material-expert: 200 OK
[PASS] 13. Frontend /dashboard/procurement-analyst: 200 OK
============================================================
ALL 13 PHASE 2A TESTS PASSED WITH 100% SUCCESS!
============================================================
```

#### Next.js Production Build
```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.04 kB        92.1 kB
├ ○ /_not-found                          871 B          87.9 kB
├ ○ /dashboard                           1.48 kB        88.5 kB
├ ○ /dashboard/cpse-admin                4.94 kB          92 kB
├ ○ /dashboard/material-expert           4.14 kB        91.2 kB
├ ○ /dashboard/procurement-analyst       4.22 kB        91.3 kB
├ ○ /dashboard/super-admin               4.83 kB        91.9 kB
└ ○ /login                               5.46 kB        92.5 kB
✓ Compiled successfully (0 errors, 0 warnings)
```

---

### Ready for Next Phase: Phase 2B
With Authentication, RBAC, Multi-Tenant Isolation, and the Role Shell fully verified, the next phase is **Phase 2B: Ingestion Engine & Database Storage**:
1. Multipart upload endpoint for raw CPSE files (`.csv`, `.xlsx`).
2. Schema & table definition for `materials` (raw immutable layer), `material_attributes` (EAV), `validation_errors`, and `processing_jobs`.
3. Asynchronous background parsing and row-level validation.
4. Material master listing API with search, filtering, and pagination scoped strictly to the authenticated CPSE.
