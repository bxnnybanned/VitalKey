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

    admin = Admin(
        first_name=payload["first_name"],
        last_name=payload["last_name"],
        email=payload["email"],
        password=hash_password(payload["password"]),
        is_active=True
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "message": "Admin account created successfully",
        "admin_id": admin.id,
        "email": admin.email
    }


@router.post("/login")
def login_admin(payload: dict, db: Session = Depends(get_db)):
    if "email" not in payload or "password" not in payload:
        raise HTTPException(status_code=400, detail="Email and password are required")

    admin = db.query(Admin).filter(Admin.email == payload["email"]).first()

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(payload["password"], admin.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "message": "Login successful",
        "admin": {
            "id": admin.id,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "email": admin.email
        },
        "access_token": f"admin-{admin.id}"
    }