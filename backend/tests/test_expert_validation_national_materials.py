"""
CANONIX Phase 5 Test Suite
Covers:
- Priority ranking for Expert Review Queue
- Human-in-the-Loop decision actions (APPROVE, REJECT, MODIFY)
- Strict validation rules (mandatory comments, hard block enforcement)
- Audit log and review action tracking
- National Material Code sequence generation (NM-000001, ...)
- Strict requirement: National Material creation requires APPROVED match
- Ineligible relationships blocked from common National Material (DIFFERENT, RELATED, unconfirmed SUBSTITUTE)
- Material mappings start as PENDING (not silently APPROVED)
- Preservation of AI evidence and decision lineage
- Raw data immutability
- Role-based access and tenant compliance
- Full API integration
"""

import pytest
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.cpse import CPSE
from app.models.material import Material
from app.models.material_match import MaterialMatch
from app.models.review_action import ReviewAction
from app.models.audit_log import AuditLog
from app.models.national_material import NationalMaterial
from app.models.material_mapping import MaterialMapping
from app.services.expert_review_service import (
    calculate_review_priority,
    get_review_queue,
    review_match,
    get_expert_dashboard_metrics,
)
from app.services.national_material_service import (
    generate_next_national_code,
    create_national_material,
    create_national_material_from_match,
    approve_national_material,
    reject_national_material,
    map_legacy_material,
    approve_material_mapping,
)


@pytest.fixture
def expert_user(db: Session) -> User:
    return db.query(User).filter(User.email == "expert@cpcl.co.in").first()


@pytest.fixture
def superadmin_user(db: Session) -> User:
    return db.query(User).filter(User.email == "superadmin@canonix.gov.in").first()


@pytest.fixture
def cpcl_cpse(db: Session) -> CPSE:
    return db.query(CPSE).filter(CPSE.code == "CPCL").first()


@pytest.fixture
def iocl_cpse(db: Session) -> CPSE:
    return db.query(CPSE).filter(CPSE.code == "IOCL").first()


@pytest.fixture
def sample_materials(db: Session, cpcl_cpse: CPSE, iocl_cpse: CPSE):
    m1 = Material(
        material_code="CPCL-VALVE-001",
        raw_description="BALL VALVE 2 INCH 150# CS BODY",
        canonical_description="CARBON STEEL BALL VALVE 2 INCH 150#",
        material_type="VALVE",
        material_group="VALVES",
        cpse_id=cpcl_cpse.id,
        order_qty=10.0,
        uom="NOS",
        status="ACTIVE",
        normalization_status="NORMALIZED",
        material_dna={"type": "VALVE", "attributes": {"size": "2 INCH", "rating": "150#", "material": "CS"}},
    )
    m2 = Material(
        material_code="IOCL-VALVE-002",
        raw_description="VALVE BALL 2IN CLASS 150 WCB",
        canonical_description="CARBON STEEL BALL VALVE 2 INCH 150#",
        material_type="VALVE",
        material_group="VALVES",
        cpse_id=iocl_cpse.id,
        order_qty=25.0,
        uom="NOS",
        status="ACTIVE",
        normalization_status="NORMALIZED",
        material_dna={"type": "VALVE", "attributes": {"size": "2 INCH", "rating": "150#", "material": "WCB"}},
    )
    m3 = Material(
        material_code="CPCL-PUMP-003",
        raw_description="CENTRIFUGAL PUMP 50 M3/HR",
        canonical_description="CENTRIFUGAL PUMP 50 M3/HR",
        material_type="PUMP",
        material_group="PUMPS",
        cpse_id=cpcl_cpse.id,
        order_qty=2.0,
        uom="SET",
        status="ACTIVE",
        normalization_status="NORMALIZED",
        material_dna={"type": "PUMP", "attributes": {"capacity": "50 M3/HR"}},
    )
    db.add_all([m1, m2, m3])
    db.commit()
    db.refresh(m1)
    db.refresh(m2)
    db.refresh(m3)
    return m1, m2, m3


def make_match(
    material_a_id: int,
    material_b_id: int,
    relationship_type: str = "SAME",
    final_score: float = 0.95,
    semantic_score: float = 0.95,
    attribute_score: float = 0.95,
    rule_score: float = 1.0,
    classification_score: float = 1.0,
    hard_blocked: bool = False,
    status: str = "PENDING",
    reviewed_by: Optional[int] = None,
    reviewed_at: Optional[datetime] = None,
    explanation: str = "Test match explanation",
    comparison_details: Optional[dict] = None,
) -> MaterialMatch:
    return MaterialMatch(
        material_a_id=material_a_id,
        material_b_id=material_b_id,
        relationship_type=relationship_type,
        final_score=final_score,
        semantic_score=semantic_score,
        attribute_score=attribute_score,
        rule_score=rule_score,
        classification_score=classification_score,
        hard_blocked=hard_blocked,
        status=status,
        reviewed_by=reviewed_by,
        reviewed_at=reviewed_at,
        explanation=explanation,
        comparison_details=comparison_details or {},
    )


# ==========================================
# 1. PRIORITY CALCULATION TESTS
# ==========================================

def test_priority_calculation_hard_blocked():
    match = make_match(material_a_id=1, material_b_id=2, final_score=0.92, hard_blocked=True)
    assert calculate_review_priority(match) == "HIGH"


def test_priority_calculation_borderline_score():
    match = make_match(material_a_id=1, material_b_id=2, final_score=0.88, hard_blocked=False)
    assert calculate_review_priority(match) == "HIGH"


def test_priority_calculation_attribute_mismatch():
    match = make_match(
        material_a_id=1,
        material_b_id=2,
        final_score=0.96,
        hard_blocked=False,
        comparison_details={"rating": {"status": "MISMATCH"}},
    )
    assert calculate_review_priority(match) == "HIGH"


def test_priority_calculation_unknown_attribute():
    match = make_match(
        material_a_id=1,
        material_b_id=2,
        final_score=0.96,
        hard_blocked=False,
        comparison_details={"schedule": {"status": "UNKNOWN"}},
    )
    assert calculate_review_priority(match) == "MEDIUM"


def test_priority_calculation_high_confidence():
    match = make_match(
        material_a_id=1,
        material_b_id=2,
        final_score=0.98,
        hard_blocked=False,
        comparison_details={"material": {"status": "MATCH"}},
    )
    assert calculate_review_priority(match) == "LOW"


# ==========================================
# 2. REVIEW QUEUE AND RANKING TESTS
# ==========================================

def test_review_queue_ranking_and_filtering(db: Session, sample_materials):
    m1, m2, m3 = sample_materials

    # Create 2 matches: one high priority (hard-blocked), one low priority
    match1 = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        final_score=0.95,
        hard_blocked=False,
        status="PENDING",
    )
    match2 = make_match(
        material_a_id=m1.id,
        material_b_id=m3.id,
        relationship_type="DIFFERENT",
        semantic_score=0.60,
        attribute_score=0.20,
        rule_score=0.0,
        classification_score=0.0,
        final_score=0.35,
        hard_blocked=True,
        status="PENDING",
    )
    db.add_all([match1, match2])
    db.commit()

    queue = get_review_queue(db=db, status_filter="PENDING")
    assert queue["total"] == 2
    # High priority item must be ranked first
    assert queue["items"][0]["priority"] == "HIGH"
    assert queue["items"][0]["match_id"] == match2.id


# ==========================================
# 3. HUMAN-IN-THE-LOOP ACTIONS
# ==========================================

def test_review_match_approve_success(db: Session, sample_materials, expert_user: User):
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        final_score=0.94,
        status="PENDING",
    )
    db.add(match)
    db.commit()

    reviewed = review_match(db, match_id=match.id, user=expert_user, action="APPROVE")
    assert reviewed.status == "APPROVED"
    assert reviewed.reviewed_by == expert_user.id
    assert reviewed.reviewed_at is not None

    # Check ReviewAction recorded
    action_rec = db.query(ReviewAction).filter(ReviewAction.match_id == match.id).first()
    assert action_rec is not None
    assert action_rec.action == "APPROVE"
    assert action_rec.reviewer_id == expert_user.id

    # Check AuditLog recorded
    audit_rec = db.query(AuditLog).filter(AuditLog.entity_id == match.id).first()
    assert audit_rec is not None
    assert audit_rec.action == "MATCH_APPROVE"


def test_review_match_approve_hard_blocked_same_prevented(db: Session, sample_materials, expert_user: User):
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        final_score=0.70,
        hard_blocked=True,
        status="PENDING",
    )
    db.add(match)
    db.commit()

    with pytest.raises(ValueError, match="Cannot approve a hard-blocked match as SAME"):
        review_match(db, match_id=match.id, user=expert_user, action="APPROVE")


def test_review_match_reject_requires_comment(db: Session, sample_materials, expert_user: User):
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="NEAR_DUPLICATE",
        final_score=0.82,
        status="PENDING",
    )
    db.add(match)
    db.commit()

    with pytest.raises(ValueError, match="Rejection requires an explanatory comment"):
        review_match(db, match_id=match.id, user=expert_user, action="REJECT", comment="")


def test_review_match_reject_success(db: Session, sample_materials, expert_user: User):
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="NEAR_DUPLICATE",
        final_score=0.82,
        status="PENDING",
    )
    db.add(match)
    db.commit()

    reviewed = review_match(
        db,
        match_id=match.id,
        user=expert_user,
        action="REJECT",
        comment="Incompatible valve trim material per refinery standards.",
    )
    assert reviewed.status == "REJECTED"


def test_review_match_modify_success(db: Session, sample_materials, expert_user: User):
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        final_score=0.88,
        status="PENDING",
    )
    db.add(match)
    db.commit()

    reviewed = review_match(
        db,
        match_id=match.id,
        user=expert_user,
        action="MODIFY",
        comment="Materials have slight metallurgy differences; setting to NEAR_DUPLICATE.",
        modified_relationship="NEAR_DUPLICATE",
    )
    assert reviewed.status == "APPROVED"
    assert reviewed.relationship_type == "NEAR_DUPLICATE"

    # Action record
    action_rec = db.query(ReviewAction).filter(ReviewAction.match_id == match.id).first()
    assert action_rec.previous_relationship == "SAME"
    assert action_rec.new_relationship == "NEAR_DUPLICATE"


# ==========================================
# 4. NATIONAL MATERIAL CODE GENERATION
# ==========================================

def test_national_material_code_generation_sequential(db: Session, expert_user: User):
    code1 = generate_next_national_code(db)
    assert code1 == "NM-000001"

    nm1 = NationalMaterial(
        national_material_code=code1,
        canonical_description="CARBON STEEL BALL VALVE 2 INCH 150#",
        material_type="VALVE",
        material_group="VALVES",
        material_dna={"type": "VALVE"},
        status="APPROVED",
        created_by=expert_user.id,
    )
    db.add(nm1)
    db.commit()

    code2 = generate_next_national_code(db)
    assert code2 == "NM-000002"


# ==========================================
# 5. STRICT VERIFICATION: CREATION FROM MATCH
# ==========================================

def test_create_national_material_from_unapproved_match_rejected(db: Session, sample_materials, expert_user: User):
    """
    CORRECTION 2: Match MUST be APPROVED. A PENDING match must be rejected server-side.
    """
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        final_score=0.95,
        status="PENDING",  # Not approved!
    )
    db.add(match)
    db.commit()

    with pytest.raises(ValueError, match="Match must be explicitly APPROVED"):
        create_national_material_from_match(db, match_id=match.id, user=expert_user)


def test_create_national_material_from_rejected_match_rejected(db: Session, sample_materials, expert_user: User):
    """
    CORRECTION 2: A REJECTED match must be rejected server-side.
    """
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        final_score=0.95,
        status="REJECTED",
        reviewed_by=expert_user.id,
    )
    db.add(match)
    db.commit()

    with pytest.raises(ValueError, match="Match must be explicitly APPROVED"):
        create_national_material_from_match(db, match_id=match.id, user=expert_user)


def test_create_national_material_from_ineligible_relationship_rejected(db: Session, sample_materials, expert_user: User):
    """
    CORRECTION 3: DIFFERENT and RELATED cannot form a National Material Identity.
    """
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="DIFFERENT",
        final_score=0.30,
        status="APPROVED",
        reviewed_by=expert_user.id,
    )
    db.add(match)
    db.commit()

    with pytest.raises(ValueError, match="cannot be grouped under a single National Material Identity"):
        create_national_material_from_match(db, match_id=match.id, user=expert_user)


def test_create_national_material_substitute_requires_authorization(db: Session, sample_materials, expert_user: User):
    """
    CORRECTION 3: APPROVED_SUBSTITUTE requires explicit authorization.
    """
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="APPROVED_SUBSTITUTE",
        final_score=0.88,
        status="APPROVED",
        reviewed_by=expert_user.id,
    )
    db.add(match)
    db.commit()

    # Without explicit authorization -> Error
    with pytest.raises(ValueError, match="requires explicit expert justification"):
        create_national_material_from_match(db, match_id=match.id, user=expert_user, data={})

    # With explicit authorization -> Allowed
    res = create_national_material_from_match(
        db,
        match_id=match.id,
        user=expert_user,
        data={"explicit_substitute_authorization": True},
    )
    assert res["national_material"].national_material_code.startswith("NM-")


def test_create_national_material_from_approved_match_full_flow(db: Session, sample_materials, expert_user: User):
    """
    Tests complete approved match creation flow:
    - Status of National Material = PENDING_APPROVAL
    - Status of Mappings = PENDING (Correction 1)
    - Full AI evidence preserved (Correction 4)
    """
    m1, m2, _ = sample_materials
    now = datetime.now(timezone.utc)
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        semantic_score=0.96,
        attribute_score=0.94,
        rule_score=1.0,
        classification_score=1.0,
        final_score=0.95,
        status="APPROVED",
        reviewed_by=expert_user.id,
        reviewed_at=now,
        explanation="Identical 2 inch CS ball valves with class 150 rating across CPCL and IOCL.",
    )
    db.add(match)
    db.commit()

    result = create_national_material_from_match(db, match_id=match.id, user=expert_user)
    nat_mat = result["national_material"]
    mappings = result["mappings"]

    assert nat_mat.national_material_code == "NM-000001"
    assert nat_mat.status == "PENDING_APPROVAL"
    assert nat_mat.originating_match_id == match.id

    # CORRECTION 4: AI Evidence Preserved
    assert nat_mat.ai_evidence is not None
    assert nat_mat.ai_evidence["semantic_score"] == 0.96
    assert nat_mat.ai_evidence["attribute_score"] == 0.94
    assert nat_mat.ai_evidence["rule_score"] == 1.0
    assert nat_mat.ai_evidence["classification_score"] == 1.0
    assert nat_mat.ai_evidence["final_score"] == 0.95
    assert nat_mat.ai_evidence["ai_relationship"] == "SAME"
    assert nat_mat.ai_evidence["reviewed_by"] == expert_user.id

    # CORRECTION 1: Mappings MUST start as PENDING
    assert len(mappings) == 2
    for m in mappings:
        assert m.status == "PENDING"
        assert m.national_material_id == nat_mat.id


# ==========================================
# 6. APPROVAL AND IMMUTABILITY
# ==========================================

def test_approve_national_material_and_mappings(db: Session, sample_materials, expert_user: User):
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        final_score=0.95,
        status="APPROVED",
        reviewed_by=expert_user.id,
    )
    db.add(match)
    db.commit()

    res = create_national_material_from_match(db, match_id=match.id, user=expert_user)
    nat_mat = res["national_material"]

    # Approve National Material
    approved_nat = approve_national_material(db, national_material_id=nat_mat.id, user=expert_user)
    assert approved_nat.status == "APPROVED"
    assert approved_nat.approved_by == expert_user.id

    # All associated mappings must now be APPROVED
    for m in approved_nat.mappings:
        assert m.status == "APPROVED"
        assert m.approved_by == expert_user.id


def test_raw_data_immutability_preserved(db: Session, sample_materials, expert_user: User):
    """
    CORRECTION 5: Verify raw_description, material_code, order_qty, uom are completely untouched.
    """
    m1, m2, _ = sample_materials
    raw_desc = m1.raw_description
    mat_code = m1.material_code
    qty = m1.order_qty
    uom = m1.uom

    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        final_score=0.95,
        status="APPROVED",
        reviewed_by=expert_user.id,
    )
    db.add(match)
    db.commit()

    create_national_material_from_match(db, match_id=match.id, user=expert_user)

    # Re-fetch m1
    db.refresh(m1)
    assert m1.raw_description == raw_desc
    assert m1.material_code == mat_code
    assert m1.order_qty == qty
    assert m1.uom == uom


# ==========================================
# 7. DASHBOARD METRICS & RECENT ACTIONS
# ==========================================

def test_expert_dashboard_metrics(db: Session, sample_materials, expert_user: User):
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        final_score=0.95,
        status="PENDING",
    )
    db.add(match)
    db.commit()

    metrics = get_expert_dashboard_metrics(db)
    assert metrics["pending_reviews"] == 1
    assert metrics["approved_today"] == 0

    review_match(db, match_id=match.id, user=expert_user, action="APPROVE")

    metrics_after = get_expert_dashboard_metrics(db)
    assert metrics_after["pending_reviews"] == 0
    assert metrics_after["approved_today"] == 1
    assert len(metrics_after["recent_reviews"]) == 1


# ==========================================
# 8. API INTEGRATION TESTS
# ==========================================

def test_api_expert_review_workflow(client, db: Session, sample_materials, expert_user: User):
    m1, m2, _ = sample_materials
    match = make_match(
        material_a_id=m1.id,
        material_b_id=m2.id,
        relationship_type="SAME",
        final_score=0.95,
        status="PENDING",
        explanation="API test match",
    )
    db.add(match)
    db.commit()

    # 1. Login as Material Expert
    login_res = client.post("/api/v1/auth/login", json={"email": "expert@cpcl.co.in", "password": "Canonix@2026"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Review Queue
    q_res = client.get("/api/v1/expert/review-queue", headers=headers)
    assert q_res.status_code == 200
    assert q_res.json()["total"] >= 1

    # 3. Approve Match via API
    app_res = client.post(f"/api/v1/matches/{match.id}/approve", headers=headers)
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "APPROVED"

    # 4. Create National Material from Approved Match via API
    nm_res = client.post(f"/api/v1/national-materials/from-match/{match.id}", headers=headers)
    assert nm_res.status_code == 200
    nm_data = nm_res.json()["national_material"]
    assert nm_data["national_material_code"] == "NM-000001"
    assert nm_data["status"] == "PENDING_APPROVAL"
    # Verify mappings start as PENDING
    assert len(nm_data["mappings"]) == 2
    for mp in nm_data["mappings"]:
        assert mp["status"] == "PENDING"

    # 5. Approve National Material via API
    app_nm_res = client.post(f"/api/v1/national-materials/{nm_data['id']}/approve", headers=headers)
    assert app_nm_res.status_code == 200
    assert app_nm_res.json()["status"] == "APPROVED"
    for mp in app_nm_res.json()["mappings"]:
        assert mp["status"] == "APPROVED"

    # 6. Check Material Details includes National Mapping
    mat_detail = client.get(f"/api/v1/materials/{m1.id}", headers=headers)
    assert mat_detail.status_code == 200
    assert mat_detail.json()["national_mapping"] is not None
    assert mat_detail.json()["national_mapping"]["national_material_code"] == "NM-000001"
