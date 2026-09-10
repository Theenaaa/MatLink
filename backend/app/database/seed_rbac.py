"""
CANONIX Seed Script - Phase 2A
Populates:
1. Standard Roles (SUPER_ADMIN, CPSE_ADMIN, MATERIAL_EXPERT, PROCUREMENT_ANALYST)
2. Primary CPSEs (CPCL, IOCL, ONGC, GAIL)
3. Initial Seed Users for all roles and CPSE isolation testing
"""
import sys
import os

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database.session import SessionLocal
from app.models.role import Role
from app.models.cpse import CPSE
from app.models.user import User
from app.core.security import get_password_hash


def seed_rbac():
    db = SessionLocal()
    try:
        print("[CANONIX SEED] Starting RBAC and Tenant seed...")

        # 1. Seed Roles
        roles_data = [
            {
                "name": "SUPER_ADMIN",
                "description": "National platform administrator with universal cross-CPSE visibility and master control",
            },
            {
                "name": "CPSE_ADMIN",
                "description": "Enterprise administrator responsible for single-CPSE ingestion, users, and catalog operations",
            },
            {
                "name": "MATERIAL_EXPERT",
                "description": "Technical cataloguer and engineering expert reviewing material DNA, classification, and standardization",
            },
            {
                "name": "PROCUREMENT_ANALYST",
                "description": "Strategic sourcing and procurement analyst evaluating cross-CPSE duplicates and spend rationalization",
            },
        ]

        role_objects = {}
        for r_info in roles_data:
            existing = db.query(Role).filter(Role.name == r_info["name"]).first()
            if not existing:
                role = Role(name=r_info["name"], description=r_info["description"])
                db.add(role)
                db.flush()
                role_objects[r_info["name"]] = role
                print(f"  + Created Role: {role.name}")
            else:
                role_objects[r_info["name"]] = existing
                print(f"  = Found Role: {existing.name}")

        # 2. Seed CPSEs
        cpse_data = [
            {"code": "CPCL", "name": "Chennai Petroleum Corporation Limited", "status": "ACTIVE"},
            {"code": "IOCL", "name": "Indian Oil Corporation Limited", "status": "ACTIVE"},
            {"code": "ONGC", "name": "Oil and Natural Gas Corporation", "status": "ACTIVE"},
            {"code": "GAIL", "name": "GAIL (India) Limited", "status": "ACTIVE"},
        ]

        cpse_objects = {}
        for c_info in cpse_data:
            existing = db.query(CPSE).filter(CPSE.code == c_info["code"]).first()
            if not existing:
                cpse = CPSE(code=c_info["code"], name=c_info["name"], status=c_info["status"])
                db.add(cpse)
                db.flush()
                cpse_objects[c_info["code"]] = cpse
                print(f"  + Created CPSE: {cpse.code} ({cpse.name})")
            else:
                cpse_objects[c_info["code"]] = existing
                print(f"  = Found CPSE: {existing.code}")

        # 3. Seed Users
        default_pwd = get_password_hash("Canonix@2026")

        users_data = [
            {
                "name": "MoPNG National Administrator",
                "email": "superadmin@canonix.gov.in",
                "password_hash": default_pwd,
                "role": role_objects["SUPER_ADMIN"],
                "cpse": None,
            },
            {
                "name": "CPCL Material Admin",
                "email": "admin@cpcl.co.in",
                "password_hash": default_pwd,
                "role": role_objects["CPSE_ADMIN"],
                "cpse": cpse_objects["CPCL"],
            },
            {
                "name": "CPCL Senior Cataloguer",
                "email": "expert@cpcl.co.in",
                "password_hash": default_pwd,
                "role": role_objects["MATERIAL_EXPERT"],
                "cpse": None,
            },
            {
                "name": "CPCL Procurement Lead",
                "email": "analyst@cpcl.co.in",
                "password_hash": default_pwd,
                "role": role_objects["PROCUREMENT_ANALYST"],
                "cpse": None,
            },
            {
                "name": "IOCL Refinery Admin",
                "email": "admin@iocl.co.in",
                "password_hash": default_pwd,
                "role": role_objects["CPSE_ADMIN"],
                "cpse": cpse_objects["IOCL"],
            },
        ]

        for u_info in users_data:
            existing = db.query(User).filter(User.email == u_info["email"]).first()
            if not existing:
                user = User(
                    name=u_info["name"],
                    email=u_info["email"],
                    password_hash=u_info["password_hash"],
                    role_id=u_info["role"].id,
                    cpse_id=u_info["cpse"].id if u_info["cpse"] else None,
                    is_active=True,
                )
                db.add(user)
                print(f"  + Created User: {u_info['email']} [{u_info['role'].name}] (CPSE: {u_info['cpse'].code if u_info['cpse'] else 'ALL'})")
            else:
                print(f"  = Found User: {existing.email}")

        db.commit()
        print("[CANONIX SEED] Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[CANONIX SEED ERROR] Failed to seed database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_rbac()
