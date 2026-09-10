# CANONIX – Master Project Implementation Plan

CANONIX is an enterprise AI-driven National Material Identity, Standardization, and Harmonization Platform designed for Central Public Sector Enterprises (CPSEs) under the Ministry of Petroleum & Natural Gas (SIH Problem Statement 26099).

This implementation plan covers the complete end-to-end architecture, database design, ingestion pipelines, AI/NLP harmonization engine, expert review workflows, national material mapping, procurement intelligence, and duplicate prevention copilot.

---

## User Review Required

> [!IMPORTANT]
> **Strict Execution Principle**: In accordance with Sections 65, 88, and 96 of the master specification, **AI development will NOT begin until Milestone 1 (Auth, Ingestion, Validation, Storage, and Material Listing) is fully completed and operational.**

> [!IMPORTANT]
> **Data Ownership & Isolation**: Uploaded files will strictly **never contain a CPSE column**. The backend binds uploaded data deterministically to the authenticated user's `cpse_id` from their JWT token to prevent cross-organization tampering.

> [!NOTE]
> **Database Requirement**: PostgreSQL with the `pgvector` extension is required for storing material vectors and running fast candidate retrieval. Docker Compose will be configured to provision PostgreSQL + pgvector automatically.

---

## Open Questions

1. **Local Python & Node Environment**: Do you plan to run FastAPI and Next.js directly on your local machine (using Node.js and Python venv) or fully inside Docker containers via Docker Compose?
2. **CPCL Dataset Location**: Do you already have the 12,000-row dummy CPCL Excel file, or should we prepare a robust sample generator/dataset matching the CPCL Oil & Gas schema (`Material Code`, `Description`, `Order Qty`, `UOM`) for local ingestion testing?

---

## Proposed System Architecture & Directory Layout

```
canonix/
├── docker-compose.yml
├── README.md
├── frontend/                     # Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
│   ├── package.json
│   ├── src/
│   │   ├── app/                  # Route handlers and layout
│   │   │   ├── (auth)/login/
│   │   │   ├── (cpse)/dashboard/
│   │   │   ├── (cpse)/materials/
│   │   │   ├── (cpse)/upload/
│   │   │   ├── (cpse)/validation/
│   │   │   ├── (cpse)/harmonization/
│   │   │   ├── (cpse)/national-mappings/
│   │   │   ├── (admin)/admin/dashboard/
│   │   │   ├── (admin)/admin/cpses/
│   │   │   ├── (admin)/admin/rules/
│   │   │   ├── (expert)/expert/review-queue/
│   │   │   ├── (expert)/expert/material-comparison/
│   │   │   ├── (procurement)/procurement/dashboard/
│   │   │   ├── (shared)/search/
│   │   │   └── (shared)/material-creation-copilot/
│   │   ├── components/           # UI design system, tables, charts, badges
│   │   ├── features/             # Feature-specific state and logic
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utilities, API client (axios/fetch), auth helpers
│   │   └── types/                # TypeScript interfaces and DTOs
├── backend/                      # Python FastAPI application
│   ├── pyproject.toml / requirements.txt
│   ├── alembic.ini
│   ├── migrations/               # Alembic database migrations
│   └── app/
│       ├── main.py               # FastAPI entrypoint and middleware
│       ├── core/                 # Config (Pydantic settings), security (JWT, hashing)
│       ├── database/             # SQLAlchemy engine, session maker, Base
│       ├── models/               # SQLAlchemy ORM models
│       ├── schemas/              # Pydantic request/response validation schemas
│       ├── api/                  # FastAPI routers (auth, materials, uploads, matching, etc.)
│       ├── services/             # Business logic layers
│       ├── ai/                   # NLP, normalization rules, embeddings, hybrid matching
│       │   ├── normalization/    # Rule engine and dictionary lookups
│       │   ├── nlp/              # spaCy NER and regex attribute parsers
│       │   ├── embeddings/       # Sentence Transformer wrapper
│       │   ├── matching/         # Hybrid scoring and candidate ranking
│       │   └── rules/            # Engineering constraint validation (valves, pipes, etc.)
│       └── utils/                # Excel/CSV parser, data quality metrics, logger
└── data/                         # Sample datasets and benchmarks
    ├── cpcl/
    ├── iocl/
    ├── bpcl/
    └── test/
```

---

## Phased Implementation Plan

### Phase 1: Project Foundation & Environment Setup
* Initialize Git repository structure.
* Configure `docker-compose.yml` with:
  * PostgreSQL 16 + `pgvector` extension.
  * Backend service (FastAPI, Python 3.11+).
  * Frontend service (Next.js, Node.js 20+).
* Initialize FastAPI backend with Alembic migration scaffolding, CORS configuration, and structured logging.
* Initialize Next.js frontend with Tailwind CSS, TypeScript, and standard industrial dark/light enterprise design tokens.

### Phase 2: Database Schema & Authentication (RBAC)
* Create core database tables via Alembic migrations:
  * `roles`: `SUPER_ADMIN`, `CPSE_ADMIN`, `MATERIAL_EXPERT`, `PROCUREMENT_ANALYST`.
  * `cpse`: `id`, `code` (e.g., CPCL, IOCL, BPCL), `name`, `status`.
  * `users`: `id`, `name`, `email`, `password_hash`, `role_id`, `cpse_id`, `is_active`.
  * `uploaded_files`: `id`, `cpse_id`, `uploaded_by`, `file_name`, `total_rows`, `valid_rows`, `invalid_rows`, `status`.
  * `materials`: `id`, `cpse_id`, `uploaded_file_id`, `source_row_number`, `material_code`, `raw_description`, `order_qty`, `uom`, `status`.
  * `material_attributes`: Flexible EAV schema for Material DNA (`material_id`, `attribute_name`, `raw_value`, `normalized_value`, `normalized_unit`, `confidence_score`, `extraction_method`).
  * `material_embeddings`: Vector storage (`material_id`, `embedding` vector(384/768), `model_name`, `embedding_version`).
  * `material_matches`: `material_a_id`, `material_b_id`, `semantic_score`, `attribute_score`, `rule_score`, `final_score`, `relationship_type`, `explanation`, `status`.
  * `national_materials`: `id`, `national_material_code` (`NM-xxxxxx`), `canonical_description`, `material_type`, `status`.
  * `material_mappings`: Legacy code mappings (`national_material_id`, `material_id`, `cpse_id`).
  * `audit_logs`: Detailed immutable action logs.
* Implement JWT authentication endpoints:
  * `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
  * Deterministic backend RBAC dependency: auto-injects `cpse_id` and enforces tenant isolation.

### Phase 3: Milestone 1 — Ingestion, Validation & Material Explorer
* **Excel & CSV Ingestion Engine**:
  * Upload handler: accepts `.xlsx`, `.xls`, `.csv`.
  * Fast streaming validation using Pandas/openpyxl checking:
    1. Mandatory headers: `Material Code`, `Description`, `Order Qty`, `UOM`.
    2. Missing values and duplicates within the uploaded batch.
    3. Type validation (numeric non-negative quantities, recognized basic UOMs).
* **Validation & Preview UI**:
  * File dropzone with immediate syntax and integrity summary (Total rows, Valid, Invalid, Error logs).
  * Batch confirmation button to commit valid records into PostgreSQL without overwriting historical batches.
* **CPSE Material Master Explorer**:
  * High-performance paginated table supporting server-side filtering, searching, and sorting.
  * Detail view showing raw material fields, upload source metadata, and status badges.

### Phase 4: Milestone 2 — Normalization & Material DNA Extraction
* **Normalization Engine**:
  * Abbreviation dictionary (`CS` $\rightarrow$ `CARBON STEEL`, `SMLS` $\rightarrow$ `SEAMLESS`, `CL300` $\rightarrow$ `CLASS 300`, `B36.10` $\rightarrow$ `ASME B36.10`).
  * Dimensional conversion to canonical metric units ($8" \rightarrow 203.2\text{ mm}$).
* **Attribute Extraction (spaCy + Regex Engine)**:
  * Regex extractors for pressure classes, schedules, nominal pipe sizes, and standard specifications.
  * Domain dictionary-backed entity recognizer to extract:
    * Pipe: Size, Schedule, Metallurgy/Grade, Construction, End Type, Standard.
    * Valve: Type, Size, Rating, Body Material, Trim, Connection.
    * Fittings: Type, Angle, Grade, Connection, Schedule.
* **Material DNA JSON & Structured Persistence**:
  * Stores normalized attributes in `material_attributes` table with confidence scores.
  * Generates standardized canonical description strings following deterministic ordering:
    `[TYPE] [SIZE] [MATERIAL] [GRADE] [CONSTRUCTION] [SCHEDULE] [PRESSURE] [CONNECTION] [STANDARD]`.

### Phase 5: Milestone 3 — Embeddings, Vector Search & Hybrid Matching
* **Semantic Embeddings**:
  * Generate dense vector representations for normalized/canonical descriptions using Sentence Transformers (`all-MiniLM-L6-v2` or domain fine-tuned model).
  * Persist in `material_embeddings` with pgvector HNSW/IVFFlat index.
* **pgvector Candidate Retrieval**:
  * Fast vector similarity query retrieves Top-$K$ candidate matches ($K=20$).
* **Hybrid Matching Engine**:
  * Computes multi-dimensional similarity:
    $$\text{Final Score} = (0.40 \times \text{Semantic}) + (0.30 \times \text{Attribute}) + (0.20 \times \text{Rule}) + (0.10 \times \text{Classification})$$
* **Hard Engineering Constraints**:
  * Overrides high text similarity if critical physical attributes mismatch (e.g. Class 150 vs Class 300; Carbon Steel A106 Gr.B vs Stainless Steel A312 TP304).
  * Categorizes relationship: `SAME`, `NEAR_DUPLICATE`, `FUNCTIONALLY_EQUIVALENT`, `APPROVED_SUBSTITUTE`, `RELATED`, `DIFFERENT`.
* **Explainable AI (XAI) Generator**:
  * Generates structured attribute comparison diffs and plain-English explanations for every recommendation.

### Phase 6: Milestone 4 — Expert Review & National Material Master
* **Material Expert Review Queue**:
  * Dashboard displaying pending match recommendations sorted by confidence tier.
* **Side-by-Side Comparison Screen**:
  * Compares Material A vs Material B with attribute-by-attribute matching badges (Match / Mismatch / Unknown), confidence indicators, and AI explanation.
  * Action controls: `APPROVE`, `REJECT`, `MODIFY`, `REQUEST MORE INFO`.
* **National Material Identity Creation**:
  * Upon approval: generate unique National Material ID (`NM-000001`).
  * Establish bidirectional mapping in `material_mappings` (`CPCL: M-PIPE-00772` $\leftrightarrow$ `NM-000001` $\leftrightarrow$ `IOCL: M-PIPE-00923`).
  * Raw descriptions remain untouched in legacy tables.

### Phase 7: Milestone 5 — Procurement Intelligence, Duplicate Copilot & Governance
* **Procurement Intelligence Engine**:
  * Aggregates quantity demands across CPSEs mapped to identical National Material IDs.
  * Calculates potential volume consolidation and bulk procurement savings opportunities.
* **Material Creation Copilot**:
  * Real-time duplicate prevention interface for CPSE engineers creating new material codes.
  * Auto-extracts Material DNA on keystroke, searches existing National Materials, and warns if duplicate or functionally equivalent items already exist.
* **Natural Language Search / "Ask the Material Master"**:
  * Search by engineering parameters ("Find 8 inch seamless carbon steel pipes").
* **Audit Logs & Governance Dashboard**:
  * Comprehensive log of every import, normalization, AI match, expert approval, and mapping edit with timestamps and user details.

---

## Verification Plan

### Automated Testing
* **Unit Tests (Backend)**:
  * Ingestion validation test suite (detecting duplicate codes, invalid UOMs, malformed Excel sheets).
  * Normalization rule test suite (abbreviation mapping, unit conversions).
  * Engineering rule engine test suite (verifying that pressure or grade mismatches correctly downgrade match status).
  * Hybrid matching math & scoring verification.
* **Integration Tests (API)**:
  * Auth & tenant isolation test: verifying a CPCL user cannot fetch or mutate IOCL material records.
  * Ingestion-to-storage pipeline test with sample multi-row Excel sheets.
  * Expert approval flow creating `NM-xxxxxx` and corresponding legacy mappings.
* **Frontend E2E & Component Tests**:
  * Login flow, upload modal drag-and-drop, validation summary display, side-by-side comparison screen interaction.

### Manual Verification
* **Demonstration Scenario**:
  1. Login as CPCL Admin $\rightarrow$ Upload sample CPCL material master $\rightarrow$ Verify validation preview $\rightarrow$ Import into PostgreSQL.
  2. Inspect Material DNA extraction on `M-PIPE-00772`.
  3. Login as IOCL Admin $\rightarrow$ Upload IOCL dataset $\rightarrow$ Trigger AI candidate matching.
  4. Login as Material Expert $\rightarrow$ Open side-by-side comparison between CPCL and IOCL pipes $\rightarrow$ Verify XAI explanation $\rightarrow$ Approve match.
  5. Verify creation of `NM-000001` and legacy mapping integrity.
  6. Open Procurement Analyst Dashboard $\rightarrow$ Verify aggregated national demand.
  7. Open Material Creation Copilot $\rightarrow$ Enter duplicate description $\rightarrow$ Verify real-time duplicate alert.
