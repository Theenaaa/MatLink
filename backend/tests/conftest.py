import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import get_db
from app.database.base import Base
from app.models.role import Role
from app.models.cpse import CPSE
from app.models.user import User
from app.core.security import get_password_hash

# Use the dedicated test database
TEST_SQLALCHEMY_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:5432/canonix_test"
)

engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_test_database(db):
    print("Seeding test database...")
    roles_data = [
        {"name": "SUPER_ADMIN", "description": "Super admin"},
        {"name": "CPSE_ADMIN", "description": "Enterprise admin"},
        {"name": "MATERIAL_EXPERT", "description": "Expert"},
        {"name": "PROCUREMENT_ANALYST", "description": "Analyst"},
    ]
    role_objects = {}
    for r_info in roles_data:
        existing = db.query(Role).filter(Role.name == r_info["name"]).first()
        if not existing:
            role = Role(name=r_info["name"], description=r_info["description"])
            db.add(role)
            db.flush()
            role_objects[r_info["name"]] = role
        else:
            role_objects[r_info["name"]] = existing

    cpse_data = [
        {"code": "CPCL", "name": "Chennai Petroleum", "status": "ACTIVE"},
        {"code": "IOCL", "name": "Indian Oil", "status": "ACTIVE"},
        {"code": "ONGC", "name": "ONGC", "status": "ACTIVE"},
        {"code": "GAIL", "name": "GAIL", "status": "ACTIVE"},
    ]
    cpse_objects = {}
    for c_info in cpse_data:
        existing = db.query(CPSE).filter(CPSE.code == c_info["code"]).first()
        if not existing:
            cpse = CPSE(code=c_info["code"], name=c_info["name"], status=c_info["status"])
            db.add(cpse)
            db.flush()
            cpse_objects[c_info["code"]] = cpse
        else:
            cpse_objects[c_info["code"]] = existing

    default_pwd = get_password_hash("Canonix@2026")
    users_data = [
        {"name": "MoPNG National Administrator", "email": "superadmin@canonix.gov.in", "role": role_objects["SUPER_ADMIN"], "cpse": None},
        {"name": "CPCL Material Admin", "email": "admin@cpcl.co.in", "role": role_objects["CPSE_ADMIN"], "cpse": cpse_objects["CPCL"]},
        {"name": "CPCL Senior Cataloguer", "email": "expert@cpcl.co.in", "role": role_objects["MATERIAL_EXPERT"], "cpse": None},
        {"name": "CPCL Procurement Lead", "email": "analyst@cpcl.co.in", "role": role_objects["PROCUREMENT_ANALYST"], "cpse": None},
        {"name": "IOCL Refinery Admin", "email": "admin@iocl.co.in", "role": role_objects["CPSE_ADMIN"], "cpse": cpse_objects["IOCL"]},
    ]
    for u_info in users_data:
        existing = db.query(User).filter(User.email == u_info["email"]).first()
        if not existing:
            user = User(
                name=u_info["name"],
                email=u_info["email"],
                password_hash=default_pwd,
                role_id=u_info["role"].id,
                cpse_id=u_info["cpse"].id if u_info["cpse"] else None,
                is_active=True,
            )
            db.add(user)
    db.commit()


from sqlalchemy import text

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Sets up the test database schema and seed data.
    Runs once per test session.
    """
    # Create all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Seed the database
    db = TestingSessionLocal()
    try:
        seed_test_database(db)
    finally:
        db.close()

    yield
    # Optional teardown logic here (like dropping tables)
    # We can leave tables so they can be inspected, but drop them on next run.


@pytest.fixture(scope="function", autouse=True)
def clean_test_data():
    """
    Clears the test artifact tables before each test function to ensure isolated tests.
    Leaves roles, cpse, and users intact.
    """
    db = TestingSessionLocal()
    try:
        # Delete dependent tables first in foreign key order
        db.execute(text("DELETE FROM review_actions"))
        db.execute(text("DELETE FROM material_mappings"))
        db.execute(text("DELETE FROM national_materials"))
        db.execute(text("DELETE FROM audit_logs"))
        db.execute(text("DELETE FROM material_matches"))
        db.execute(text("DELETE FROM material_embeddings"))
        db.execute(text("DELETE FROM material_attributes"))
        db.execute(text("DELETE FROM validation_errors"))
        db.execute(text("DELETE FROM processing_jobs"))
        db.execute(text("DELETE FROM materials"))
        db.execute(text("DELETE FROM uploaded_files"))
        db.commit()
    finally:
        db.close()


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def db():
    database = TestingSessionLocal()
    try:
        yield database
    finally:
        database.close()

@pytest.fixture
def client():
    # Use TestClient with the overridden dependency
    with TestClient(app) as c:
        yield c
