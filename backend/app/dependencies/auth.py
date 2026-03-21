from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.admin import Admin
from app.models.doctor import Doctor
from app.models.medicine_keeper import MedicineKeeper
from app.utils.auth_tokens import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)


def get_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is required",
        )

    return decode_access_token(credentials.credentials)


def get_current_admin(
    payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> Admin:
    if payload.get("role") not in {"admin", "super_admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required",
        )

    admin = (
        db.query(Admin)
        .filter(Admin.id == int(payload["sub"]), Admin.is_active == True)
        .first()
    )
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin account is not available",
        )
    return admin


def get_current_doctor(
    payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> Doctor:
    if payload.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor access is required",
        )

    doctor = (
        db.query(Doctor)
        .filter(Doctor.id == int(payload["sub"]), Doctor.is_active == True)
        .first()
    )
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Doctor account is not available",
        )
    return doctor


def get_current_medicine_keeper(
    payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> MedicineKeeper:
    if payload.get("role") != "inventory":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inventory access is required",
        )

    keeper = (
        db.query(MedicineKeeper)
        .filter(MedicineKeeper.id == int(payload["sub"]), MedicineKeeper.is_active == True)
        .first()
    )
    if not keeper:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Medicine keeper account is not available",
        )
    return keeper
