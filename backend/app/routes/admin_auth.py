from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.admin import Admin
from app.schemas.auth import AdminLoginSchema, AdminRegisterSchema
from app.utils.auth_tokens import create_access_token
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/admin-auth", tags=["Admin Auth"])

@router.post("/register")
def register_admin(payload: AdminRegisterSchema, db: Session = Depends(get_db)):
    existing_admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Email already exists")

    total_admins = db.query(Admin).count()
    if total_admins > 0:
        raise HTTPException(
            status_code=403,
            detail="Public admin registration is disabled. Use Admin Management instead.",
        )

    admin = Admin(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password=hash_password(payload.password),
        role="super_admin",
        created_by=None,
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
def login_admin(payload: AdminLoginSchema, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == payload.email).first()

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin account is inactive")

    if not verify_password(payload.password, admin.password):
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
        "access_token": create_access_token(entity_id=admin.id, role=admin.role)
    }
