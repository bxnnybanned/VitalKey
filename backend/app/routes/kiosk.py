from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.patient import Patient
from app.utils.age import calculate_age
from app.models.health_record import HealthRecord
from app.schemas.health_record import SaveHealthRecordSchema

router = APIRouter(prefix="/kiosk", tags=["Kiosk"])


@router.get("/patient/{patient_code}")
def get_patient_by_code(patient_code: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_code).first()
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
        "address": patient.address,
        "emergency_contact": patient.emergency_contact,
        "is_verified": patient.is_verified
    }


@router.post("/save-health-record")
def save_health_record(payload: SaveHealthRecordSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == payload.patient_code).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_record = HealthRecord(
        patient_id=patient.id,
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
        "height_cm": float(latest_record.height_cm) if latest_record.height_cm is not None else None,
        "weight_kg": float(latest_record.weight_kg) if latest_record.weight_kg is not None else None,
        "temperature_c": float(latest_record.temperature_c) if latest_record.temperature_c is not None else None,
        "systolic_bp": latest_record.systolic_bp,
        "diastolic_bp": latest_record.diastolic_bp,
        "oxygen_saturation": float(latest_record.oxygen_saturation) if latest_record.oxygen_saturation is not None else None,
        "heart_rate": latest_record.heart_rate,
        "recorded_at": str(latest_record.recorded_at)
    }