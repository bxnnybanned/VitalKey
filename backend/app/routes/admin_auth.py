from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.admin import Admin
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/admin-auth", tags=["Admin Auth"])

@router.post("/register")
def register_admin(payload: dict, db: Session = Depends(get_db)):
    required_fields = ["first_name", "last_name", "email", "password"]

    for field in required_fields:
        if field not in payload or not str(payload[field]).strip():
            raise HTTPException(status_code=400, detail=f"{field} is required")

    existing_admin = db.query(Admin).filter(Admin.email == payload["email"]).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Email already exists")

    total_admins = db.query(Admin).count()
    requester_admin = None

    if total_admins > 0:
        requester_admin_id = payload.get("requester_admin_id")
        if not requester_admin_id:
            raise HTTPException(
                status_code=403,
                detail="Only a super admin can create another admin account",
            )

        requester_admin = (
            db.query(Admin)
            .filter(Admin.id == requester_admin_id, Admin.is_active == True)
            .first()
        )

        if not requester_admin or requester_admin.role != "super_admin":
            raise HTTPException(
                status_code=403,
                detail="Only a super admin can create another admin account",
            )

    admin = Admin(
        first_name=payload["first_name"],
        last_name=payload["last_name"],
        email=payload["email"],
        password=hash_password(payload["password"]),
        role="super_admin" if total_admins == 0 else "admin",
        created_by=requester_admin.id if requester_admin else None,
        is_active=True
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "message": "Admin account created successfully",
        "admin_id": admin.id,
        "email": admin.email,
        "role": admin.role,
    }


@router.post("/login")
def login_admin(payload: dict, db: Session = Depends(get_db)):
    if "email" not in payload or "password" not in payload:
        raise HTTPException(status_code=400, detail="Email and password are required")

    admin = db.query(Admin).filter(Admin.email == payload["email"]).first()

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin account is inactive")

    if not verify_password(payload["password"], admin.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "message": "Login successful",
        "admin": {
            "id": admin.id,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "email": admin.email,
            "role": admin.role,
            "is_active": admin.is_active,
        },
        "access_token": f"admin-{admin.id}"
    }
