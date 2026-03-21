import os
import shutil
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.patient import Patient
from app.models.otp_code import OTPCode
from app.utils.age import calculate_age
from app.schemas.auth import (
    RegisterBasicSchema,
    VerifyOTPSchema,
    ResendOTPSchema,
    CompleteProfileSchema,
    LoginSchema,
    ProfileUpdateSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
)
from app.utils.security import hash_password, verify_password
from app.utils.patient_id import generate_patient_id
from app.utils.otp import generate_otp, otp_expiration
from app.utils.email_sender import send_email_otp

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register-basic")
def register_basic(payload: RegisterBasicSchema, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing_email = db.query(Patient).filter(Patient.email == payload.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_mobile = db.query(Patient).filter(
        Patient.mobile_number == payload.mobile_number
    ).first()
    if existing_mobile:
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    new_patient = Patient(
        patient_id=None,
        first_name=payload.first_name,
        last_name=payload.last_name,
        birthday=payload.birthday,
        sex=payload.sex,
        email=payload.email,
        mobile_number=payload.mobile_number,
        password=hash_password(payload.password),
        patient_source="mobile_app",
        address=None,
        emergency_contact=None,
        is_verified=False,
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    otp = OTPCode(
        email=payload.email,
        otp_code=generate_otp(),
        expires_at=otp_expiration(),
        is_used=False,
        purpose="register",
    )

    db.add(otp)
    db.commit()
    db.refresh(otp)

    email_sent = True
    email_error = None

    try:
        send_email_otp(payload.email, otp.otp_code)
    except Exception as e:
        email_sent = False
        email_error = str(e)
        print("EMAIL SEND ERROR (register-basic):", e)

    return {
        "message": "Basic registration successful. Verify OTP to continue.",
        "email": new_patient.email,
        "email_sent": email_sent,
        "email_error": email_error,
        "otp_for_dev_only": otp.otp_code,
    }


@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Account not found")

    otp_record = (
        db.query(OTPCode)
        .filter(
            OTPCode.email == payload.email,
            OTPCode.otp_code == payload.otp_code,
            OTPCode.is_used == False,
            OTPCode.purpose == "register",
        )
        .order_by(OTPCode.id.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now() > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")

    otp_record.is_used = True
    patient.is_verified = True
    db.commit()

    return {
        "message": "OTP verified successfully. Please complete your profile.",
        "email": patient.email,
        "is_verified": patient.is_verified,
    }


@router.post("/resend-otp")
def resend_otp(payload: ResendOTPSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Account not found")

    otp = OTPCode(
        email=payload.email,
        otp_code=generate_otp(),
        expires_at=otp_expiration(),
        is_used=False,
        purpose="register",
    )

    db.add(otp)
    db.commit()
    db.refresh(otp)

    email_sent = True
    email_error = None

    try:
        send_email_otp(payload.email, otp.otp_code)
    except Exception as e:
        email_sent = False
        email_error = str(e)
        print("EMAIL SEND ERROR (resend-otp):", e)

    return {
        "message": "OTP resent successfully",
        "email": payload.email,
        "email_sent": email_sent,
        "email_error": email_error,
        "otp_for_dev_only": otp.otp_code,
    }


@router.post("/complete-profile")
def complete_profile(payload: CompleteProfileSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Account not found")

    if not patient.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Account not verified. Please verify OTP first.",
        )

    patient.address = payload.address
    patient.emergency_contact = payload.emergency_contact

    if not patient.patient_id:
        patient.patient_id = generate_patient_id()

    db.commit()
    db.refresh(patient)

    return {
        "message": "Profile completed successfully",
        "patient_id": patient.patient_id,
        "full_name": f"{patient.first_name} {patient.last_name}",
        "mobile_number": patient.mobile_number,
        "email": patient.email,
    }


@router.post("/login")
def login_patient(payload: LoginSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.email == payload.email).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Account not found")

    if not patient.password:
        raise HTTPException(
            status_code=403,
            detail="This patient record does not have a mobile app account yet.",
        )

    if not verify_password(payload.password, patient.password):
        raise HTTPException(status_code=401, detail="Invalid password")

    if not patient.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Account not verified. Please verify OTP first.",
        )

    if not patient.address or not patient.emergency_contact or not patient.patient_id:
        raise HTTPException(
            status_code=403,
            detail="Profile incomplete. Please complete your profile first.",
        )

    return {
        "message": "Login successful",
        "patient_id": patient.patient_id,
        "name": f"{patient.first_name} {patient.last_name}",
        "mobile_number": patient.mobile_number,
        "email": patient.email,
    }


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Account not found")

    otp = OTPCode(
        email=payload.email,
        otp_code=generate_otp(),
        expires_at=otp_expiration(),
        is_used=False,
        purpose="reset_password",
    )

    db.add(otp)
    db.commit()
    db.refresh(otp)

    email_sent = True
    email_error = None

    try:
        send_email_otp(payload.email, otp.otp_code)
    except Exception as e:
        email_sent = False
        email_error = str(e)
        print("EMAIL SEND ERROR (forgot-password):", e)

    return {
        "message": "Password reset OTP sent successfully",
        "email": payload.email,
        "email_sent": email_sent,
        "email_error": email_error,
        "otp_for_dev_only": otp.otp_code,
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Account not found")

    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    otp_record = (
        db.query(OTPCode)
        .filter(
            OTPCode.email == payload.email,
            OTPCode.otp_code == payload.otp_code,
            OTPCode.is_used == False,
            OTPCode.purpose == "reset_password",
        )
        .order_by(OTPCode.id.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now() > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")

    otp_record.is_used = True
    patient.password = hash_password(payload.new_password)

    db.commit()
    db.refresh(patient)

    return {
        "message": "Password reset successfully",
        "email": patient.email,
    }


@router.get("/profile/{mobile_number}")
def get_profile(mobile_number: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(
        Patient.mobile_number == mobile_number
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return {
        "patient_id": patient.patient_id,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "full_name": f"{patient.first_name} {patient.last_name}",
        "birthday": str(patient.birthday),
        "age": calculate_age(patient.birthday),
        "sex": patient.sex,
        "mobile_number": patient.mobile_number,
        "email": patient.email,
        "address": patient.address,
        "emergency_contact": patient.emergency_contact,
        "profile_picture": patient.profile_picture,
    }


@router.put("/profile/{mobile_number}")
def update_profile(
    mobile_number: str,
    payload: ProfileUpdateSchema,
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(
        Patient.mobile_number == mobile_number
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    payload_data = payload.model_dump(exclude_unset=True)
    new_mobile_number = payload_data.get("new_mobile_number", patient.mobile_number)

    if new_mobile_number != patient.mobile_number:
        existing = db.query(Patient).filter(
            Patient.mobile_number == new_mobile_number,
            Patient.id != patient.id,
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Mobile number already in use")

        patient.mobile_number = new_mobile_number

    patient.address = payload_data.get("address", patient.address)
    patient.emergency_contact = payload_data.get(
        "emergency_contact", patient.emergency_contact
    )
    patient.profile_picture = payload_data.get(
        "profile_picture", patient.profile_picture
    )

    db.commit()
    db.refresh(patient)

    return {
        "message": "Profile updated successfully",
        "patient_id": patient.patient_id,
        "full_name": f"{patient.first_name} {patient.last_name}",
        "mobile_number": patient.mobile_number,
        "profile_picture": patient.profile_picture,
    }


@router.post("/profile/upload-picture")
def upload_profile_picture(
    mobile_number: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(
        Patient.mobile_number == mobile_number
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {file.content_type}",
        )

    upload_dir = "uploads/profile_pictures"
    os.makedirs(upload_dir, exist_ok=True)

    file_extension = os.path.splitext(file.filename)[1].lower()

    if not file_extension:
        if file.content_type in ["image/jpeg", "image/jpg"]:
            file_extension = ".jpg"
        elif file.content_type == "image/png":
            file_extension = ".png"
        elif file.content_type == "image/webp":
            file_extension = ".webp"
        else:
            file_extension = ".jpg"

    safe_filename = f"{patient.mobile_number}_{patient.id}{file_extension}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    patient.profile_picture = f"/uploads/profile_pictures/{safe_filename}"
    db.commit()
    db.refresh(patient)

    return {
        "message": "Profile picture uploaded successfully",
        "profile_picture": patient.profile_picture,
    }
