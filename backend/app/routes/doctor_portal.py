from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies.auth import get_current_doctor
from app.db import get_db
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.health_record import HealthRecord
from app.models.consultation import Consultation
from app.models.kiosk_session import KioskSession
from app.models.medicine import Medicine
from app.models.prescription import Prescription
from app.models.prescription_item import PrescriptionItem
from app.schemas.auth import DoctorLoginSchema
from app.schemas.consultation import SaveConsultationSchema
from app.schemas.prescription import CompleteConsultationPrescriptionSchema
from app.utils.auth_tokens import create_access_token
from app.utils.consultation_code import generate_consultation_code
from app.utils.prescription_code import generate_prescription_code
from app.utils.age import calculate_age
from app.utils.security import verify_password
from app.utils.statuses import (
    normalize_appointment_status,
    normalize_kiosk_session_status,
    normalize_prescription_status,
)

router = APIRouter(prefix="/doctor", tags=["Doctor Portal"])
protected_router = APIRouter(
    tags=["Doctor Portal"],
    dependencies=[Depends(get_current_doctor)],
)


@router.post("/login")
def login_doctor(payload: DoctorLoginSchema, db: Session = Depends(get_db)):
    username = payload.username.strip()
    password = payload.password

    doctor = (
        db.query(Doctor)
        .filter(Doctor.username == username, Doctor.is_active == True)
        .first()
    )

    if not doctor or not doctor.password_hash:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(password, doctor.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "message": "Login successful",
        "doctor": {
            "doctor_id": doctor.id,
            "doctor_code": doctor.doctor_code,
            "first_name": doctor.first_name,
            "last_name": doctor.last_name,
            "full_name": f"{doctor.first_name} {doctor.last_name}",
            "username": doctor.username,
            "specialization": doctor.specialization,
        },
        "access_token": create_access_token(entity_id=doctor.id, role="doctor"),
    }


@protected_router.get("/today-patients/{doctor_id}")
def get_today_patients(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    if current_doctor.id != doctor_id:
        raise HTTPException(status_code=403, detail="You can only access your own queue")

    doctor = db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.is_active == True).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    today = date.today()

    results = (
        db.query(Appointment, Patient)
        .join(Patient, Appointment.patient_id == Patient.id)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == today,
            Appointment.status.notin_(["done", "cancelled"]),
        )
        .order_by(Appointment.queue_number.asc())
        .all()
    )

    queue_items = [
        {
            "queue_item_id": f"appointment-{appointment.id}",
            "source": "appointment",
            "kiosk_session_id": None,
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

    scheduled_patient_ids = {patient.id for _, patient in results}

    kiosk_results = (
        db.query(KioskSession, Patient)
        .join(Patient, KioskSession.patient_id == Patient.id)
        .filter(
            func.date(KioskSession.started_at) == today,
            KioskSession.session_status != "done",
        )
        .order_by(KioskSession.queue_number.asc(), KioskSession.started_at.asc())
        .all()
    )

    for kiosk_session, patient in kiosk_results:
        if patient.id in scheduled_patient_ids:
            continue

        queue_items.append(
            {
                "queue_item_id": f"kiosk-{kiosk_session.id}",
                "source": "kiosk",
                "kiosk_session_id": kiosk_session.id,
                "appointment_id": None,
                "appointment_code": kiosk_session.session_code,
                "patient_code": patient.patient_id,
                "full_name": f"{patient.first_name} {patient.last_name}",
                "appointment_date": str(today),
                "appointment_time": (
                    kiosk_session.started_at.strftime("%H:%M:%S")
                    if kiosk_session.started_at
                    else None
                ),
                "queue_number": kiosk_session.queue_number,
                "reason": "Kiosk assessment",
                "status": "Waiting for Consultation",
            }
        )

    return sorted(
        queue_items,
        key=lambda item: (
            item["queue_number"] is None,
            item["queue_number"] if item["queue_number"] is not None else 999999,
            item["appointment_time"] or "",
        ),
    )


@protected_router.get("/patient-details/{patient_code}")
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
    latest_kiosk_session_id = None
    if latest_record:
        latest_kiosk_session_id = latest_record.kiosk_session_id
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

    consultation_history = (
        db.query(Consultation, Doctor)
        .join(Doctor, Consultation.doctor_id == Doctor.id)
        .filter(Consultation.patient_id == patient.id)
        .order_by(Consultation.created_at.desc(), Consultation.id.desc())
        .all()
    )

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
        "latest_kiosk_session_id": latest_kiosk_session_id,
        "latest_health_record": latest_health,
        "consultation_history": [
            {
                "consultation_id": consultation.id,
                "consultation_code": consultation.consultation_code,
                "doctor_name": f"{doctor.first_name} {doctor.last_name}",
                "diagnosis": consultation.diagnosis,
                "consultation_notes": consultation.consultation_notes,
                "created_at": str(consultation.created_at),
            }
            for consultation, doctor in consultation_history
        ],
    }


@protected_router.post("/save-consultation")
def save_consultation(
    payload: SaveConsultationSchema,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    if current_doctor.id != payload.doctor_id:
        raise HTTPException(status_code=403, detail="You can only save your own consultation")

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
        if appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Appointment is not assigned to you")
        if normalize_appointment_status(appointment.status) == "done":
            raise HTTPException(status_code=400, detail="Appointment is already completed")

    kiosk_session_id = payload.kiosk_session_id
    if kiosk_session_id is not None:
        kiosk_session = (
            db.query(KioskSession)
            .filter(KioskSession.id == kiosk_session_id, KioskSession.patient_id == patient.id)
            .first()
        )
        if not kiosk_session:
            raise HTTPException(status_code=404, detail="Kiosk session not found")
        if normalize_kiosk_session_status(kiosk_session.session_status) == "done":
            raise HTTPException(status_code=400, detail="Kiosk session is already completed")

    existing_consultation = None
    if payload.appointment_id is not None:
        existing_consultation = (
            db.query(Consultation)
            .filter(Consultation.appointment_id == payload.appointment_id)
            .first()
        )
    elif kiosk_session_id is not None:
        existing_consultation = (
            db.query(Consultation)
            .filter(Consultation.kiosk_session_id == kiosk_session_id)
            .first()
        )

    if existing_consultation:
        raise HTTPException(status_code=400, detail="A consultation already exists for this patient visit")

    new_consultation = Consultation(
        consultation_code=generate_consultation_code(),
        patient_id=patient.id,
        doctor_id=doctor.id,
        appointment_id=payload.appointment_id,
        kiosk_session_id=kiosk_session_id,
        consultation_notes=payload.consultation_notes,
        diagnosis=payload.diagnosis
    )

    db.add(new_consultation)

    if appointment:
        appointment.status = normalize_appointment_status("done")

    db.commit()
    db.refresh(new_consultation)

    return {
        "message": "Consultation saved successfully",
        "consultation_id": new_consultation.id,
        "consultation_code": new_consultation.consultation_code,
        "patient_code": patient.patient_id,
        "kiosk_session_id": new_consultation.kiosk_session_id,
        "doctor_name": f"{doctor.first_name} {doctor.last_name}",
        "diagnosis": new_consultation.diagnosis
    }


@protected_router.post("/complete-consultation")
def complete_consultation(
    payload: CompleteConsultationPrescriptionSchema,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    if current_doctor.id != payload.doctor_id:
        raise HTTPException(status_code=403, detail="You can only complete your own consultation")

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
        if appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Appointment is not assigned to you")
        if normalize_appointment_status(appointment.status) == "done":
            raise HTTPException(status_code=400, detail="Appointment is already completed")

    kiosk_session = None
    if payload.kiosk_session_id is not None:
        kiosk_session = (
            db.query(KioskSession)
            .filter(KioskSession.id == payload.kiosk_session_id, KioskSession.patient_id == patient.id)
            .first()
        )
        if not kiosk_session:
            raise HTTPException(status_code=404, detail="Kiosk session not found")
        if normalize_kiosk_session_status(kiosk_session.session_status) == "done":
            raise HTTPException(status_code=400, detail="Kiosk session is already completed")

    if not payload.items:
        raise HTTPException(status_code=400, detail="At least one medicine is required")

    validated_items = []
    for item in payload.items:
        medicine = (
            db.query(Medicine)
            .filter(Medicine.id == item.medicine_id, Medicine.is_active == True)
            .first()
        )
        if not medicine:
            raise HTTPException(
                status_code=404,
                detail=f"Medicine with id {item.medicine_id} not found",
            )
        validated_items.append((item, medicine))

    existing_consultation = None
    if payload.appointment_id is not None:
        existing_consultation = (
            db.query(Consultation)
            .filter(Consultation.appointment_id == payload.appointment_id)
            .first()
        )
    elif payload.kiosk_session_id is not None:
        existing_consultation = (
            db.query(Consultation)
            .filter(Consultation.kiosk_session_id == payload.kiosk_session_id)
            .first()
        )

    if existing_consultation:
        raise HTTPException(status_code=400, detail="A consultation already exists for this patient visit")

    new_consultation = Consultation(
        consultation_code=generate_consultation_code(),
        patient_id=patient.id,
        doctor_id=doctor.id,
        appointment_id=payload.appointment_id,
        kiosk_session_id=payload.kiosk_session_id,
        consultation_notes=payload.consultation_notes,
        diagnosis=payload.diagnosis,
    )
    db.add(new_consultation)
    db.flush()

    new_prescription = Prescription(
        prescription_code=generate_prescription_code(),
        consultation_id=new_consultation.id,
        patient_id=patient.id,
        doctor_id=doctor.id,
        status=normalize_prescription_status("pending"),
    )
    db.add(new_prescription)
    db.flush()

    created_items = []
    for item, medicine in validated_items:
        db.add(
            PrescriptionItem(
                prescription_id=new_prescription.id,
                medicine_id=item.medicine_id,
                dosage_instructions=item.dosage_instructions,
                quantity=item.quantity,
            )
        )
        created_items.append(
            {
                "medicine_id": medicine.id,
                "medicine_name": medicine.name,
                "dosage_instructions": item.dosage_instructions,
                "quantity": item.quantity,
            }
        )

    if appointment:
        appointment.status = normalize_appointment_status("done")

    if kiosk_session:
        kiosk_session.session_status = normalize_kiosk_session_status("done")

    db.commit()
    db.refresh(new_consultation)
    db.refresh(new_prescription)

    return {
        "message": "Consultation and prescription saved successfully",
        "consultation_id": new_consultation.id,
        "consultation_code": new_consultation.consultation_code,
        "prescription_id": new_prescription.id,
        "prescription_code": new_prescription.prescription_code,
        "patient_code": patient.patient_id,
        "status": new_prescription.status,
        "items": created_items,
    }


router.include_router(protected_router)
