from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.health_record import HealthRecord
from app.models.consultation import Consultation
from app.schemas.consultation import SaveConsultationSchema
from app.utils.consultation_code import generate_consultation_code
from app.utils.age import calculate_age

router = APIRouter(prefix="/doctor", tags=["Doctor Portal"])


@router.get("/today-patients/{doctor_id}")
def get_today_patients(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.is_active == True).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    today = date.today()

    results = (
        db.query(Appointment, Patient)
        .join(Patient, Appointment.patient_id == Patient.id)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == today
        )
        .order_by(Appointment.queue_number.asc())
        .all()
    )

    return [
        {
            "appointment_id": appointment.id,
            "appointment_code": appointment.appointment_code,
            "patient_code": patient.patient_id,
            "full_name": f"{patient.first_name} {patient.last_name}",
            "appointment_date": str(appointment.appointment_date),
            "appointment_time": str(appointment.appointment_time),
            "queue_number": appointment.queue_number,
            "reason": appointment.reason,
            "status": appointment.status
        }
        for appointment, patient in results
    ]


@router.get("/patient-details/{patient_code}")
def get_patient_details(patient_code: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_code).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    latest_record = (
        db.query(HealthRecord)
        .filter(HealthRecord.patient_id == patient.id)
        .order_by(HealthRecord.recorded_at.desc(), HealthRecord.id.desc())
        .first()
    )

    latest_health = None
    if latest_record:
        latest_health = {
            "height_cm": float(latest_record.height_cm) if latest_record.height_cm is not None else None,
            "weight_kg": float(latest_record.weight_kg) if latest_record.weight_kg is not None else None,
            "temperature_c": float(latest_record.temperature_c) if latest_record.temperature_c is not None else None,
            "systolic_bp": latest_record.systolic_bp,
            "diastolic_bp": latest_record.diastolic_bp,
            "oxygen_saturation": float(latest_record.oxygen_saturation) if latest_record.oxygen_saturation is not None else None,
            "heart_rate": latest_record.heart_rate,
            "recorded_at": str(latest_record.recorded_at)
        }

    return {
        "patient_code": patient.patient_id,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "full_name": f"{patient.first_name} {patient.last_name}",
        "birthday": str(patient.birthday),
        "age": calculate_age(patient.birthday),
        "sex": patient.sex,
        "mobile_number": patient.mobile_number,
        "address": patient.address,
        "emergency_contact": patient.emergency_contact,
        "latest_health_record": latest_health
    }


@router.post("/save-consultation")
def save_consultation(payload: SaveConsultationSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == payload.patient_code).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == payload.doctor_id, Doctor.is_active == True).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    appointment = None
    if payload.appointment_id is not None:
        appointment = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

    new_consultation = Consultation(
        consultation_code=generate_consultation_code(),
        patient_id=patient.id,
        doctor_id=doctor.id,
        appointment_id=payload.appointment_id,
        consultation_notes=payload.consultation_notes,
        diagnosis=payload.diagnosis
    )

    db.add(new_consultation)

    if appointment:
        appointment.status = "Consulted"

    db.commit()
    db.refresh(new_consultation)

    return {
        "message": "Consultation saved successfully",
        "consultation_id": new_consultation.id,
        "consultation_code": new_consultation.consultation_code,
        "patient_code": patient.patient_id,
        "doctor_name": f"{doctor.first_name} {doctor.last_name}",
        "diagnosis": new_consultation.diagnosis
    }