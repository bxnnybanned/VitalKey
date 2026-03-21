from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.db import get_db
from app.models.patient import Patient
from app.utils.age import calculate_age
from app.models.health_record import HealthRecord
from app.models.kiosk_session import KioskSession
from app.schemas.health_record import KioskBasicPatientSchema, SaveHealthRecordSchema
from app.utils.patient_id import generate_patient_id

router = APIRouter(prefix="/kiosk", tags=["Kiosk"])


def _serialize_patient(patient: Patient):
    return {
        "patient_id": patient.patient_id,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "full_name": f"{patient.first_name} {patient.last_name}",
        "birthday": str(patient.birthday),
        "age": calculate_age(patient.birthday),
        "sex": patient.sex,
        "mobile_number": patient.mobile_number,
        "contact_number": patient.contact_number,
        "address": patient.address,
        "emergency_contact": patient.emergency_contact,
        "is_verified": patient.is_verified,
        "patient_source": getattr(patient, "patient_source", "mobile_app"),
    }


def generate_kiosk_session_code(db: Session):
    count = (db.query(func.count(KioskSession.id)).scalar() or 0) + 1
    return f"KSS-{date.today().year}-{count:05d}"


def generate_daily_queue_number(db: Session):
    today = date.today()
    count = (
        db.query(func.count(KioskSession.id))
        .filter(func.date(KioskSession.started_at) == today)
        .scalar()
        or 0
    )
    return count + 1


@router.get("/patient/{patient_code}")
def get_patient_by_code(patient_code: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_code).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return _serialize_patient(patient)


@router.post("/register-basic")
def register_kiosk_patient(payload: KioskBasicPatientSchema, db: Session = Depends(get_db)):
    try:
        birthday = date.fromisoformat(payload.birthday)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid birthday format")

    normalized_contact_number = payload.mobile_number.strip()
    existing_contacts = (
        db.query(Patient)
        .filter(
            (Patient.contact_number == normalized_contact_number)
            | (Patient.mobile_number == normalized_contact_number)
        )
        .all()
    )
    for existing_patient in existing_contacts:
        matches_existing_patient = (
            existing_patient.first_name.strip().lower() == payload.first_name.strip().lower()
            and existing_patient.last_name.strip().lower() == payload.last_name.strip().lower()
            and existing_patient.birthday == birthday
            and existing_patient.sex == payload.sex
        )

        if matches_existing_patient:
            return {
                **_serialize_patient(existing_patient),
                "message": "Existing patient record found. Continuing with this patient.",
                "matched_existing": True,
            }

    new_patient = Patient(
        patient_id=generate_patient_id(),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        birthday=birthday,
        sex=payload.sex,
        email=None,
        mobile_number=None,
        contact_number=normalized_contact_number,
        password=None,
        patient_source="kiosk",
        address=(payload.address or "").strip() or None,
        emergency_contact=None,
        is_verified=False,
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return _serialize_patient(new_patient)


@router.post("/save-health-record")
def save_health_record(payload: SaveHealthRecordSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == payload.patient_code).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    kiosk_session = KioskSession(
        session_code=generate_kiosk_session_code(db),
        patient_id=patient.id,
        queue_number=generate_daily_queue_number(db),
        session_status="completed",
        created_by_device="kiosk_system",
        completed_at=func.now(),
    )
    db.add(kiosk_session)
    db.flush()

    new_record = HealthRecord(
        patient_id=patient.id,
        kiosk_session_id=kiosk_session.id,
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        temperature_c=payload.temperature_c,
        systolic_bp=payload.systolic_bp,
        diastolic_bp=payload.diastolic_bp,
        oxygen_saturation=payload.oxygen_saturation,
        heart_rate=payload.heart_rate
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return {
        "message": "Health record saved successfully",
        "record_id": new_record.id,
        "session_id": kiosk_session.id,
        "session_code": kiosk_session.session_code,
        "queue_number": kiosk_session.queue_number,
        "patient_id": patient.patient_id,
        "full_name": f"{patient.first_name} {patient.last_name}",
        "recorded_at": str(new_record.recorded_at)
    }


@router.get("/latest-health-record/{patient_code}")
def get_latest_health_record(patient_code: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_code).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    latest_record = (
        db.query(HealthRecord)
        .filter(HealthRecord.patient_id == patient.id)
        .order_by(HealthRecord.recorded_at.desc(), HealthRecord.id.desc())
        .first()
    )

    if not latest_record:
        raise HTTPException(status_code=404, detail="No health records found")

    return {
        "patient_id": patient.patient_id,
        "full_name": f"{patient.first_name} {patient.last_name}",
        "session_id": latest_record.kiosk_session_id,
        "height_cm": float(latest_record.height_cm) if latest_record.height_cm is not None else None,
        "weight_kg": float(latest_record.weight_kg) if latest_record.weight_kg is not None else None,
        "temperature_c": float(latest_record.temperature_c) if latest_record.temperature_c is not None else None,
        "systolic_bp": latest_record.systolic_bp,
        "diastolic_bp": latest_record.diastolic_bp,
        "oxygen_saturation": float(latest_record.oxygen_saturation) if latest_record.oxygen_saturation is not None else None,
        "heart_rate": latest_record.heart_rate,
        "recorded_at": str(latest_record.recorded_at)
    }
