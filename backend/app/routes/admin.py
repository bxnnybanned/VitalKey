from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models.doctor import Doctor
from app.models.medicine import Medicine
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.inventory_transaction import InventoryTransaction

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

@router.get("/doctors")
def get_doctors(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).order_by(Doctor.id.desc()).all()

    return [
        {
            "doctor_id": doctor.id,
            "doctor_code": doctor.doctor_code,
            "first_name": doctor.first_name,
            "last_name": doctor.last_name,
            "full_name": f"{doctor.first_name} {doctor.last_name}",
            "specialization": doctor.specialization,
            "is_active": doctor.is_active
        }
        for doctor in doctors
    ]


@router.post("/doctors")
def add_doctor(payload: dict, db: Session = Depends(get_db)):
    required_fields = ["doctor_code", "first_name", "last_name"]
    for field in required_fields:
        if field not in payload or not str(payload[field]).strip():
            raise HTTPException(status_code=400, detail=f"{field} is required")

    existing = db.query(Doctor).filter(Doctor.doctor_code == payload["doctor_code"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor code already exists")

    doctor = Doctor(
        doctor_code=payload["doctor_code"],
        first_name=payload["first_name"],
        last_name=payload["last_name"],
        specialization=payload.get("specialization"),
        is_active=payload.get("is_active", True)
    )

    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    return {
        "message": "Doctor added successfully",
        "doctor_id": doctor.id,
        "doctor_code": doctor.doctor_code
    }


@router.put("/doctors/{doctor_id}")
def update_doctor(doctor_id: int, payload: dict, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor.first_name = payload.get("first_name", doctor.first_name)
    doctor.last_name = payload.get("last_name", doctor.last_name)
    doctor.specialization = payload.get("specialization", doctor.specialization)
    doctor.is_active = payload.get("is_active", doctor.is_active)

    db.commit()

    return {"message": "Doctor updated successfully"}


@router.delete("/doctors/{doctor_id}")
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    db.delete(doctor)
    db.commit()

    return {"message": "Doctor deleted successfully"}

@router.get("/medicines")
def admin_get_medicines(db: Session = Depends(get_db)):
    medicines = db.query(Medicine).order_by(Medicine.id.desc()).all()

    return [
        {
            "medicine_id": med.id,
            "medicine_code": med.medicine_code,
            "name": med.name,
            "description": med.description,
            "stock_quantity": med.stock_quantity,
            "expiration_date": str(med.expiration_date) if med.expiration_date else None,
            "unit": med.unit,
            "is_active": med.is_active
        }
        for med in medicines
    ]


@router.post("/medicines")
def add_medicine(payload: dict, db: Session = Depends(get_db)):
    required_fields = ["medicine_code", "name", "stock_quantity"]
    for field in required_fields:
        if field not in payload:
            raise HTTPException(status_code=400, detail=f"{field} is required")

    existing = db.query(Medicine).filter(Medicine.medicine_code == payload["medicine_code"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Medicine code already exists")

    medicine = Medicine(
        medicine_code=payload["medicine_code"],
        name=payload["name"],
        description=payload.get("description"),
        stock_quantity=payload["stock_quantity"],
        expiration_date=payload.get("expiration_date"),
        unit=payload.get("unit"),
        is_active=payload.get("is_active", True)
    )

    db.add(medicine)
    db.commit()
    db.refresh(medicine)

    return {
        "message": "Medicine added successfully",
        "medicine_id": medicine.id,
        "medicine_code": medicine.medicine_code
    }


@router.put("/medicines/{medicine_id}")
def update_medicine(medicine_id: int, payload: dict, db: Session = Depends(get_db)):
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    medicine.name = payload.get("name", medicine.name)
    medicine.description = payload.get("description", medicine.description)
    medicine.stock_quantity = payload.get("stock_quantity", medicine.stock_quantity)
    medicine.expiration_date = payload.get("expiration_date", medicine.expiration_date)
    medicine.unit = payload.get("unit", medicine.unit)
    medicine.is_active = payload.get("is_active", medicine.is_active)

    db.commit()

    return {"message": "Medicine updated successfully"}

@router.get("/appointments")
def get_all_appointments(db: Session = Depends(get_db)):
    results = (
        db.query(Appointment, Patient, Doctor)
        .join(Patient, Appointment.patient_id == Patient.id)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
        .all()
    )

    return [
        {
            "appointment_id": appointment.id,
            "appointment_code": appointment.appointment_code,
            "patient_code": patient.patient_id,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "doctor_name": f"{doctor.first_name} {doctor.last_name}",
            "appointment_date": str(appointment.appointment_date),
            "appointment_time": str(appointment.appointment_time),
            "queue_number": appointment.queue_number,
            "reason": appointment.reason,
            "status": appointment.status
        }
        for appointment, patient, doctor in results
    ]


@router.put("/appointments/{appointment_id}/status")
def update_appointment_status(appointment_id: int, payload: dict, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if "status" not in payload:
        raise HTTPException(status_code=400, detail="status is required")

    appointment.status = payload["status"]
    db.commit()

    return {"message": "Appointment status updated successfully"}

@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_patients = db.query(func.count(Patient.id)).scalar()
    total_doctors = db.query(func.count(Doctor.id)).scalar()
    total_appointments = db.query(func.count(Appointment.id)).scalar()
    total_pending_prescriptions = db.query(func.count(Prescription.id)).filter(Prescription.status == "Pending").scalar()
    total_released_prescriptions = db.query(func.count(Prescription.id)).filter(Prescription.status == "Released").scalar()

    low_stock_medicines = db.query(Medicine).filter(Medicine.stock_quantity <= 20).count()

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "total_pending_prescriptions": total_pending_prescriptions,
        "total_released_prescriptions": total_released_prescriptions,
        "low_stock_medicines": low_stock_medicines
    }


@router.get("/reports/patient-visits")
def get_patient_visits_report(db: Session = Depends(get_db)):
    visits = (
        db.query(
            Appointment.appointment_date,
            func.count(Appointment.id).label("total_visits")
        )
        .group_by(Appointment.appointment_date)
        .order_by(Appointment.appointment_date.desc())
        .all()
    )

    return [
        {
            "appointment_date": str(item.appointment_date),
            "total_visits": item.total_visits
        }
        for item in visits
    ]


@router.get("/reports/medicine-usage")
def get_medicine_usage_report(db: Session = Depends(get_db)):
    usage = (
        db.query(
            Medicine.name,
            func.sum(InventoryTransaction.quantity_released).label("total_released")
        )
        .join(InventoryTransaction, InventoryTransaction.medicine_id == Medicine.id)
        .group_by(Medicine.name)
        .order_by(func.sum(InventoryTransaction.quantity_released).desc())
        .all()
    )

    return [
        {
            "medicine_name": item.name,
            "total_released": int(item.total_released) if item.total_released is not None else 0
        }
        for item in usage
    ]