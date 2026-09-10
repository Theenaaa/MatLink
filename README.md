# CANONIX
### National Material Code Standardization & Harmonization Platform Across CPSEs
**Ministry of Petroleum & Natural Gas | Chennai Petroleum Corporation Limited (CPCL)**
*Smart India Hackathon (SIH) Problem Statement 26099*

---

## Overview
CANONIX is an enterprise AI-driven platform engineered to harmonize heterogeneous Material Master data across Central Public Sector Enterprises (CPSEs) such as CPCL, IOCL, BPCL, HPCL, and ONGC.

### Core Philosophy:
`DETECT` → `UNDERSTAND` → `NORMALIZE` → `HARMONIZE` → `EXPLAIN` → `VALIDATE` → `GOVERN` → `PREVENT` → `OPTIMIZE`

---

## Technology Stack
- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.0, Alembic
- **Database**: PostgreSQL 16+ with `pgvector` extension
- **AI & NLP**: spaCy, Sentence Transformers (`all-MiniLM-L6-v2`), scikit-learn

---

## Getting Started

### 1. Backend Setup
```bash
cd backend
py -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to access the CANONIX portal.
Backend Swagger Docs: `http://localhost:8000/docs`
