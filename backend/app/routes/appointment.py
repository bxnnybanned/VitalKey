from datetime import date, datetime, time, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.schemas.appointment import BookAppointmentSchema
from app.utils.appointment_code import generate_appointment_code

router = APIRouter(prefix="/appointments", tags=["Appointments"])

CLINIC_OPEN = time(8, 0, 0)
CLINIC_CLOSE = time(15, 0, 0)


def generate_time_slots(start_time: time, end_time: time, interval_minutes: int = 30):
    slots = []
    current = datetime.combine(date.today(), start_time)
    end_dt = datetime.combine(date.today(), end_time)

    while current <= end_dt:
        slots.append(current.time().replace(microsecond=0))
        current += timedelta(minutes=interval_minutes)

    return slots


@router.get("/available-doctors")
def get_available_doctors(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).filter(Doctor.is_active == True).all()

    return [
        {
            "doctor_id": doctor.id,
            "doctor_code": doctor.doctor_code,
            "full_name": f"{doctor.first_name} {doctor.last_name}",
            "specialization": doctor.specialization
        }
        for doctor in doctors
    ]


@router.get("/available-slots/{doctor_id}")
def get_available_slots(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.is_active == True).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    today = date.today()
    now = datetime.now().time().replace(second=0, microsecond=0)

    if now > CLINIC_CLOSE:
        return {
            "doctor_id": doctor.id,
            "doctor_name": f"{doctor.first_name} {doctor.last_name}",
            "appointment_date": str(today),
            "available_slots": []
        }

    all_slots = generate_time_slots(CLINIC_OPEN, CLINIC_CLOSE, 30)

    filtered_slots = [slot for slot in all_slots if slot >= now]

    booked_slots = db.query(Appointment.appointment_time).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == today
    ).all()

    booked_times = {row[0] for row in booked_slots}

    available_slots = [
        slot.strftime("%H:%M:%S")
        for slot in filtered_slots
        if slot not in booked_times
    ]

    return {
        "doctor_id": doctor.id,
        "doctor_name": f"{doctor.first_name} {doctor.last_name}",
        "appointment_date": str(today),
        "available_slots": available_slots
    }


@router.post("/book")
def book_appointment(payload: BookAppointmentSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.mobile_number == payload.mobile_number).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not patient.is_verified:
        raise HTTPException(status_code=403, detail="Patient account is not verified")

    doctor = db.query(Doctor).filter(Doctor.id == payload.doctor_id, Doctor.is_active == True).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    today = date.today()
    now = datetime.now().time().replace(second=0, microsecond=0)

    if now > CLINIC_CLOSE:
        raise HTTPException(status_code=400, detail="Clinic booking hours are already closed for today")

    if payload.appointment_time < CLINIC_OPEN or payload.appointment_time > CLINIC_CLOSE:
        raise HTTPException(status_code=400, detail="Appointment time must be within clinic hours (8:00 AM to 3:00 PM)")

    if payload.appointment_time < now:
        raise HTTPException(status_code=400, detail="You can only book current or upcoming time slots for today")

    existing_same_slot = db.query(Appointment).filter(
        Appointment.doctor_id == payload.doctor_id,
        Appointment.appointment_date == today,
        Appointment.appointment_time == payload.appointment_time
    ).first()

    if existing_same_slot:
        raise HTTPException(status_code=400, detail="Selected time slot is already booked")

    max_queue = db.query(func.max(Appointment.queue_number)).filter(
        Appointment.doctor_id == payload.doctor_id,
        Appointment.appointment_date == today
    ).scalar()

    next_queue = 1 if max_queue is None else max_queue + 1

    new_appointment = Appointment(
        appointment_code=generate_appointment_code(),
        patient_id=patient.id,
        doctor_id=doctor.id,
        appointment_date=today,
        appointment_time=payload.appointment_time,
        queue_number=next_queue,
        reason=payload.reason,
        status="Pending"
    )

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return {
        "message": "Appointment booked successfully",
        "appointment_code": new_appointment.appointment_code,
        "patient_id": patient.patient_id,
        "doctor_name": f"{doctor.first_name} {doctor.last_name}",
        "appointment_date": str(new_appointment.appointment_date),
        "appointment_time": str(new_appointment.appointment_time),
        "queue_number": new_appointment.queue_number,
        "status": new_appointment.status
    }


@router.get("/my-appointments/{mobile_number}")
def get_my_appointments(mobile_number: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.mobile_number == mobile_number).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    appointments = (
        db.query(Appointment, Doctor)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .filter(Appointment.patient_id == patient.id)
        .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
        .all()
    )

    return [
        {
            "appointment_code": appointment.appointment_code,
            "doctor_name": f"{doctor.first_name} {doctor.last_name}",
            "specialization": doctor.specialization,
            "appointment_date": str(appointment.appointment_date),
            "appointment_time": str(appointment.appointment_time),
            "queue_number": appointment.queue_number,
            "reason": appointment.reason,
            "status": appointment.status,
        }
        for appointment, doctor in appointments
    ]