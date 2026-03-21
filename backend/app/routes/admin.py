from datetime import date, time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies.auth import get_current_admin
from app.db import get_db
from app.models.doctor import Doctor
from app.models.medicine import Medicine
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.inventory_transaction import InventoryTransaction
from app.models.inventory_activity_log import InventoryActivityLog
from app.models.clinic_setting import ClinicSetting
from app.models.health_record import HealthRecord
from app.models.kiosk_session import KioskSession
from app.models.admin import Admin
from app.models.medicine_keeper import MedicineKeeper
from app.models.medicine_request import MedicineRequest
from app.schemas.admin import (
    AdminCreateSchema,
    AdminStatusUpdateSchema,
    AppointmentStatusUpdateSchema,
    ClinicSettingUpdateSchema,
    DoctorCreateSchema,
    DoctorUpdateSchema,
    MedicineCreateSchema,
    MedicineKeeperCreateSchema,
    MedicineKeeperUpdateSchema,
    MedicineUpdateSchema,
)
from app.utils.security import hash_password
from app.utils.age import calculate_age
from app.utils.statuses import (
    APPOINTMENT_ALLOWED_TRANSITIONS,
    normalize_appointment_status,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin Panel"],
    dependencies=[Depends(get_current_admin)],
)


def get_super_admin(current_admin: Admin):
    if not current_admin or current_admin.role != "super_admin":
        raise HTTPException(
            status_code=403, detail="Only a super admin can perform this action"
        )

    return current_admin


def serialize_admin(admin: Admin, creator: Admin | None = None):
    return {
        "admin_id": admin.id,
        "first_name": admin.first_name,
        "last_name": admin.last_name,
        "full_name": f"{admin.first_name} {admin.last_name}",
        "email": admin.email,
        "role": admin.role,
        "is_active": admin.is_active,
        "created_by": admin.created_by,
        "created_by_name": (
            f"{creator.first_name} {creator.last_name}" if creator else None
        ),
        "created_at": str(admin.created_at),
    }


def serialize_medicine_keeper(keeper: MedicineKeeper):
    return {
        "keeper_id": keeper.id,
        "keeper_code": keeper.keeper_code,
        "first_name": keeper.first_name,
        "last_name": keeper.last_name,
        "full_name": f"{keeper.first_name} {keeper.last_name}",
        "username": keeper.username,
        "is_active": keeper.is_active,
        "created_at": str(keeper.created_at),
    }


def serialize_inventory_activity(log, keeper=None, medicine=None, prescription=None, request=None):
    return {
        "activity_id": log.id,
        "action_type": log.action_type,
        "reference_type": log.reference_type,
        "details": log.details,
        "created_at": str(log.created_at),
        "keeper_id": log.keeper_id,
        "keeper_name": (
            f"{keeper.first_name} {keeper.last_name}" if keeper else "-"
        ),
        "medicine_id": log.medicine_id,
        "medicine_name": medicine.name if medicine else None,
        "medicine_code": medicine.medicine_code if medicine else None,
        "prescription_id": log.prescription_id,
        "prescription_code": prescription.prescription_code if prescription else None,
        "medicine_request_id": log.medicine_request_id,
        "request_code": request.request_code if request else None,
    }


def parse_time_value(value, field_name: str):
    if value in (None, ""):
        return None

    if isinstance(value, time):
        return value

    try:
        normalized_value = str(value)
        if len(normalized_value) == 5:
            normalized_value = f"{normalized_value}:00"
        return time.fromisoformat(normalized_value)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be a valid time in HH:MM or HH:MM:SS format",
        )


def serialize_health_record(record: HealthRecord):
    return {
        "id": record.id,
        "kiosk_session_id": record.kiosk_session_id,
        "height_cm": float(record.height_cm) if record.height_cm is not None else None,
        "weight_kg": float(record.weight_kg) if record.weight_kg is not None else None,
        "temperature_c": (
            float(record.temperature_c) if record.temperature_c is not None else None
        ),
        "systolic_bp": record.systolic_bp,
        "diastolic_bp": record.diastolic_bp,
        "oxygen_saturation": (
            float(record.oxygen_saturation)
            if record.oxygen_saturation is not None
            else None
        ),
        "heart_rate": record.heart_rate,
        "recorded_at": str(record.recorded_at),
    }


def serialize_kiosk_session(session: KioskSession, records: list[HealthRecord]):
    latest = records[0] if records else None
    return {
        "session_id": session.id,
        "session_code": session.session_code,
        "queue_number": session.queue_number,
        "session_status": session.session_status,
        "created_by_device": session.created_by_device,
        "started_at": str(session.started_at) if session.started_at else None,
        "completed_at": str(session.completed_at) if session.completed_at else None,
        "record_count": len(records),
        "latest_record": serialize_health_record(latest) if latest else None,
        "records": [serialize_health_record(record) for record in records],
    }


def aggregate_daily_patient_visits(appointments, limit: int | None = None):
    grouped = defaultdict(int)

    for appointment in appointments:
        grouped[appointment.appointment_date] += 1

    items = [
        {
            "label": day.isoformat(),
            "appointment_date": day.isoformat(),
            "total_visits": total,
        }
        for day, total in sorted(grouped.items())
    ]

    if limit:
        items = items[-limit:]

    return items


def aggregate_weekly_patient_visits(appointments, limit: int | None = None):
    grouped = defaultdict(int)

    for appointment in appointments:
        iso_year, iso_week, _ = appointment.appointment_date.isocalendar()
        grouped[(iso_year, iso_week)] += 1

    items = []
    for (iso_year, iso_week), total in sorted(grouped.items()):
        items.append(
            {
                "label": f"{iso_year}-W{iso_week:02d}",
                "year": iso_year,
                "week": iso_week,
                "total_visits": total,
            }
        )

    if limit:
        items = items[-limit:]

    return items


def aggregate_monthly_patient_visits(appointments, limit: int | None = None):
    grouped = defaultdict(int)

    for appointment in appointments:
        grouped[(appointment.appointment_date.year, appointment.appointment_date.month)] += 1

    items = []
    for (year, month), total in sorted(grouped.items()):
        items.append(
            {
                "label": f"{year}-{month:02d}",
                "year": year,
                "month": month,
                "total_visits": total,
            }
        )

    if limit:
        items = items[-limit:]

    return items


@router.get("/clinic-settings")
def get_clinic_settings(db: Session = Depends(get_db)):
    settings = (
        db.query(ClinicSetting)
        .order_by(ClinicSetting.id.asc())
        .all()
    )

    return [
        {
            "id": setting.id,
            "day_of_week": setting.day_of_week,
            "is_open": setting.is_open,
            "open_time": (
                setting.open_time.strftime("%H:%M:%S")
                if setting.open_time
                else None
            ),
            "close_time": (
                setting.close_time.strftime("%H:%M:%S")
                if setting.close_time
                else None
            ),
            "slot_interval_minutes": setting.slot_interval_minutes,
        }
        for setting in settings
    ]


@router.put("/clinic-settings/{setting_id}")
def update_clinic_setting(
    setting_id: int, payload: ClinicSettingUpdateSchema, db: Session = Depends(get_db)
):
    setting = db.query(ClinicSetting).filter(ClinicSetting.id == setting_id).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Clinic setting not found")

    payload_data = payload.model_dump(exclude_unset=True)

    is_open = payload_data.get("is_open", setting.is_open)
    open_time = parse_time_value(
        payload_data.get("open_time", setting.open_time), "open_time"
    )
    close_time = parse_time_value(
        payload_data.get("close_time", setting.close_time), "close_time"
    )
    slot_interval_minutes = payload_data.get(
        "slot_interval_minutes", setting.slot_interval_minutes
    )

    if slot_interval_minutes is None:
        raise HTTPException(
            status_code=400, detail="slot_interval_minutes is required"
        )

    try:
        slot_interval_minutes = int(slot_interval_minutes)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400, detail="slot_interval_minutes must be a valid integer"
        )

    if slot_interval_minutes <= 0:
        raise HTTPException(
            status_code=400, detail="slot_interval_minutes must be greater than 0"
        )

    if is_open:
        if not open_time or not close_time:
            raise HTTPException(
                status_code=400,
                detail="Open and close times are required when the clinic is open",
            )

    setting.is_open = is_open
    setting.open_time = open_time if is_open else None
    setting.close_time = close_time if is_open else None
    setting.slot_interval_minutes = slot_interval_minutes

    if setting.is_open and setting.open_time >= setting.close_time:
        raise HTTPException(
            status_code=400, detail="Open time must be earlier than close time"
        )

    db.commit()
    db.refresh(setting)

    return {
        "message": "Clinic setting updated successfully",
        "setting": {
            "id": setting.id,
            "day_of_week": setting.day_of_week,
            "is_open": setting.is_open,
            "open_time": (
                setting.open_time.strftime("%H:%M:%S")
                if setting.open_time
                else None
            ),
            "close_time": (
                setting.close_time.strftime("%H:%M:%S")
                if setting.close_time
                else None
            ),
            "slot_interval_minutes": setting.slot_interval_minutes,
        },
    }

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
            "username": doctor.username,
            "specialization": doctor.specialization,
            "is_active": doctor.is_active
        }
        for doctor in doctors
    ]


@router.post("/doctors")
def add_doctor(payload: DoctorCreateSchema, db: Session = Depends(get_db)):
    existing = db.query(Doctor).filter(Doctor.doctor_code == payload.doctor_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor code already exists")

    username = payload.username
    password = payload.password

    if username and str(username).strip():
        existing_username = db.query(Doctor).filter(Doctor.username == username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already exists")

    doctor = Doctor(
        doctor_code=payload.doctor_code,
        first_name=payload.first_name,
        last_name=payload.last_name,
        username=username.strip() if username and str(username).strip() else None,
        password_hash=hash_password(password) if password and str(password).strip() else None,
        specialization=payload.specialization,
        is_active=payload.is_active
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
def update_doctor(doctor_id: int, payload: DoctorUpdateSchema, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    payload_data = payload.model_dump(exclude_unset=True)
    username = payload_data.get("username", doctor.username)
    password = payload_data.get("password")

    if username and str(username).strip():
        existing_username = (
            db.query(Doctor)
            .filter(Doctor.username == username, Doctor.id != doctor_id)
            .first()
        )
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already exists")

    doctor.first_name = payload_data.get("first_name", doctor.first_name)
    doctor.last_name = payload_data.get("last_name", doctor.last_name)
    doctor.username = username.strip() if username and str(username).strip() else None
    if password and str(password).strip():
        doctor.password_hash = hash_password(password)
    doctor.specialization = payload_data.get("specialization", doctor.specialization)
    doctor.is_active = payload_data.get("is_active", doctor.is_active)

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
def add_medicine(payload: MedicineCreateSchema, db: Session = Depends(get_db)):
    existing = db.query(Medicine).filter(Medicine.medicine_code == payload.medicine_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Medicine code already exists")

    medicine = Medicine(
        medicine_code=payload.medicine_code,
        name=payload.name,
        description=payload.description,
        stock_quantity=payload.stock_quantity,
        expiration_date=payload.expiration_date,
        unit=payload.unit,
        is_active=payload.is_active
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
def update_medicine(medicine_id: int, payload: MedicineUpdateSchema, db: Session = Depends(get_db)):
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    payload_data = payload.model_dump(exclude_unset=True)
    medicine.name = payload_data.get("name", medicine.name)
    medicine.description = payload_data.get("description", medicine.description)
    medicine.stock_quantity = payload_data.get("stock_quantity", medicine.stock_quantity)
    medicine.expiration_date = payload_data.get("expiration_date", medicine.expiration_date)
    medicine.unit = payload_data.get("unit", medicine.unit)
    medicine.is_active = payload_data.get("is_active", medicine.is_active)

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
def update_appointment_status(
    appointment_id: int,
    payload: AppointmentStatusUpdateSchema,
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    try:
        target_status = normalize_appointment_status(payload.status)
        current_status = normalize_appointment_status(appointment.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if target_status != current_status and target_status not in APPOINTMENT_ALLOWED_TRANSITIONS.get(current_status, set()):
        raise HTTPException(status_code=400, detail="Invalid appointment status transition")

    appointment.status = target_status
    db.commit()

    return {"message": "Appointment status updated successfully"}

@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_patients = db.query(func.count(Patient.id)).scalar()
    total_doctors = db.query(func.count(Doctor.id)).scalar()
    total_appointments = db.query(func.count(Appointment.id)).scalar()
    total_pending_prescriptions = db.query(func.count(Prescription.id)).filter(Prescription.status == "pending").scalar()
    total_released_prescriptions = db.query(func.count(Prescription.id)).filter(Prescription.status == "released").scalar()

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
    appointments = db.query(Appointment).order_by(Appointment.appointment_date.asc()).all()
    return aggregate_daily_patient_visits(appointments)


@router.get("/reports/patient-visits/daily")
def get_daily_patient_visits_report(
    limit: int = 30, db: Session = Depends(get_db)
):
    appointments = db.query(Appointment).order_by(Appointment.appointment_date.asc()).all()
    return aggregate_daily_patient_visits(appointments, limit=limit)


@router.get("/reports/patient-visits/weekly")
def get_weekly_patient_visits_report(
    limit: int = 12, db: Session = Depends(get_db)
):
    appointments = db.query(Appointment).order_by(Appointment.appointment_date.asc()).all()
    return aggregate_weekly_patient_visits(appointments, limit=limit)


@router.get("/reports/patient-visits/monthly")
def get_monthly_patient_visits_report(
    limit: int = 12, db: Session = Depends(get_db)
):
    appointments = db.query(Appointment).order_by(Appointment.appointment_date.asc()).all()
    return aggregate_monthly_patient_visits(appointments, limit=limit)


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


@router.get("/reports/summary")
def get_reports_summary(db: Session = Depends(get_db)):
    total_patient_visits = db.query(func.count(Appointment.id)).scalar() or 0
    total_medicines_dispensed = (
        db.query(func.sum(InventoryTransaction.quantity_released)).scalar() or 0
    )
    total_dispensing_transactions = (
        db.query(func.count(InventoryTransaction.id)).scalar() or 0
    )

    top_medicine = (
        db.query(
            Medicine.name,
            func.sum(InventoryTransaction.quantity_released).label("total_released"),
        )
        .join(InventoryTransaction, InventoryTransaction.medicine_id == Medicine.id)
        .group_by(Medicine.name)
        .order_by(func.sum(InventoryTransaction.quantity_released).desc())
        .first()
    )

    return {
        "total_patient_visits": int(total_patient_visits),
        "total_medicines_dispensed": int(total_medicines_dispensed),
        "total_dispensing_transactions": int(total_dispensing_transactions),
        "most_dispensed_medicine": {
            "medicine_name": top_medicine.name if top_medicine else None,
            "total_released": int(top_medicine.total_released) if top_medicine and top_medicine.total_released is not None else 0,
        },
    }


@router.get("/patients")
def get_patients(search: str = "", db: Session = Depends(get_db)):
    query = db.query(Patient)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (Patient.patient_id.ilike(term))
            | (Patient.first_name.ilike(term))
            | (Patient.last_name.ilike(term))
            | (Patient.email.ilike(term))
            | (Patient.mobile_number.ilike(term))
            | (Patient.contact_number.ilike(term))
        )

    patients = query.order_by(Patient.last_name.asc(), Patient.first_name.asc(), Patient.id.desc()).all()

    return [
        {
            "id": patient.id,
            "patient_code": patient.patient_id,
            "full_name": f"{patient.first_name} {patient.last_name}",
            "birthday": str(patient.birthday),
            "age": calculate_age(patient.birthday),
            "sex": patient.sex,
            "email": patient.email,
            "mobile_number": patient.mobile_number,
            "contact_number": patient.contact_number,
            "address": patient.address,
            "is_verified": patient.is_verified,
            "patient_source": patient.patient_source,
            "created_at": str(patient.created_at),
        }
        for patient in patients
    ]


@router.get("/patients/{patient_code}")
def get_patient_record(patient_code: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_code).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    health_records = (
        db.query(HealthRecord)
        .filter(HealthRecord.patient_id == patient.id)
        .order_by(HealthRecord.recorded_at.desc(), HealthRecord.id.desc())
        .all()
    )

    latest_health_record = (
        serialize_health_record(health_records[0]) if health_records else None
    )

    appointments = (
        db.query(Appointment, Doctor)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .filter(Appointment.patient_id == patient.id)
        .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
        .all()
    )

    kiosk_sessions = (
        db.query(KioskSession)
        .filter(KioskSession.patient_id == patient.id)
        .order_by(KioskSession.started_at.desc(), KioskSession.id.desc())
        .all()
    )

    records_by_session = {}
    for record in health_records:
        if record.kiosk_session_id:
            records_by_session.setdefault(record.kiosk_session_id, []).append(record)

    serialized_sessions = [
        serialize_kiosk_session(session, records_by_session.get(session.id, []))
        for session in kiosk_sessions
    ]

    return {
        "patient": {
            "id": patient.id,
            "patient_code": patient.patient_id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "full_name": f"{patient.first_name} {patient.last_name}",
            "birthday": str(patient.birthday),
            "age": calculate_age(patient.birthday),
            "sex": patient.sex,
            "email": patient.email,
            "mobile_number": patient.mobile_number,
            "contact_number": patient.contact_number,
            "address": patient.address,
            "emergency_contact": patient.emergency_contact,
            "profile_picture": patient.profile_picture,
            "is_verified": patient.is_verified,
            "patient_source": patient.patient_source,
            "created_at": str(patient.created_at),
        },
        "summary": {
            "health_record_count": len(health_records),
            "appointment_count": len(appointments),
            "kiosk_session_count": len(kiosk_sessions),
            "last_recorded_at": health_records[0].recorded_at.isoformat() if health_records else None,
        },
        "latest_health_record": latest_health_record,
        "kiosk_sessions": serialized_sessions,
        "health_records": [serialize_health_record(record) for record in health_records],
        "appointments": [
            {
                "appointment_id": appointment.id,
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
        ],
    }


@router.get("/admins")
def get_admins(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    get_super_admin(current_admin)

    admins = db.query(Admin).order_by(Admin.created_at.desc(), Admin.id.desc()).all()
    creator_map = {
        creator.id: creator for creator in db.query(Admin).all()
    }

    return [
        serialize_admin(admin, creator_map.get(admin.created_by))
        for admin in admins
    ]


@router.post("/admins")
def create_admin(
    payload: AdminCreateSchema,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    requester_admin = get_super_admin(current_admin)

    existing_admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Email already exists")

    admin = Admin(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password=hash_password(payload.password),
        role="admin",
        created_by=requester_admin.id,
        is_active=payload.is_active,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "message": "Admin added successfully",
        "admin": serialize_admin(admin, requester_admin),
    }


@router.put("/admins/{admin_id}/status")
def update_admin_status(
    admin_id: int,
    payload: AdminStatusUpdateSchema,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    requester_admin = get_super_admin(current_admin)

    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    if admin.role == "super_admin":
        raise HTTPException(status_code=400, detail="Super admin status cannot be changed")

    admin.is_active = payload.is_active
    admin.created_by = admin.created_by or requester_admin.id
    db.commit()
    db.refresh(admin)

    return {
        "message": "Admin status updated successfully",
        "admin": serialize_admin(admin, requester_admin),
    }


@router.get("/medicine-keepers")
def get_medicine_keepers(db: Session = Depends(get_db)):
    keepers = (
        db.query(MedicineKeeper)
        .order_by(MedicineKeeper.created_at.desc(), MedicineKeeper.id.desc())
        .all()
    )
    return [serialize_medicine_keeper(keeper) for keeper in keepers]


@router.post("/medicine-keepers")
def create_medicine_keeper(payload: MedicineKeeperCreateSchema, db: Session = Depends(get_db)):
    existing_code = (
        db.query(MedicineKeeper)
        .filter(MedicineKeeper.keeper_code == payload.keeper_code)
        .first()
    )
    if existing_code:
        raise HTTPException(status_code=400, detail="Medicine keeper code already exists")

    existing_username = (
        db.query(MedicineKeeper)
        .filter(MedicineKeeper.username == payload.username)
        .first()
    )
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")

    keeper = MedicineKeeper(
        keeper_code=payload.keeper_code,
        first_name=payload.first_name,
        last_name=payload.last_name,
        username=payload.username,
        password_hash=hash_password(payload.password),
        is_active=payload.is_active,
    )

    db.add(keeper)
    db.commit()
    db.refresh(keeper)

    return {
        "message": "Medicine keeper added successfully",
        "keeper": serialize_medicine_keeper(keeper),
    }


@router.put("/medicine-keepers/{keeper_id}")
def update_medicine_keeper(
    keeper_id: int,
    payload: MedicineKeeperUpdateSchema,
    db: Session = Depends(get_db),
):
    keeper = db.query(MedicineKeeper).filter(MedicineKeeper.id == keeper_id).first()
    if not keeper:
        raise HTTPException(status_code=404, detail="Medicine keeper not found")

    payload_data = payload.model_dump(exclude_unset=True)
    username = payload_data.get("username", keeper.username)
    if username and str(username).strip():
        existing_username = (
            db.query(MedicineKeeper)
            .filter(MedicineKeeper.username == username, MedicineKeeper.id != keeper_id)
            .first()
        )
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already exists")

    keeper.first_name = payload_data.get("first_name", keeper.first_name)
    keeper.last_name = payload_data.get("last_name", keeper.last_name)
    keeper.username = username.strip() if username and str(username).strip() else keeper.username
    keeper.is_active = payload_data.get("is_active", keeper.is_active)

    password = payload_data.get("password")
    if password and str(password).strip():
        keeper.password_hash = hash_password(password)

    db.commit()
    db.refresh(keeper)

    return {
        "message": "Medicine keeper updated successfully",
        "keeper": serialize_medicine_keeper(keeper),
    }


@router.get("/inventory-activity")
def get_inventory_activity(
    search: str = "",
    action_type: str = "",
    db: Session = Depends(get_db),
):
    query = (
        db.query(
            InventoryActivityLog,
            MedicineKeeper,
            Medicine,
            Prescription,
            MedicineRequest,
        )
        .join(MedicineKeeper, InventoryActivityLog.keeper_id == MedicineKeeper.id)
        .outerjoin(Medicine, InventoryActivityLog.medicine_id == Medicine.id)
        .outerjoin(Prescription, InventoryActivityLog.prescription_id == Prescription.id)
        .outerjoin(
            MedicineRequest,
            InventoryActivityLog.medicine_request_id == MedicineRequest.id,
        )
    )

    if action_type and action_type.strip():
        query = query.filter(InventoryActivityLog.action_type == action_type.strip())

    rows = (
        query.order_by(
            InventoryActivityLog.created_at.desc(),
            InventoryActivityLog.id.desc(),
        ).all()
    )

    serialized = [
        serialize_inventory_activity(log, keeper, medicine, prescription, request)
        for log, keeper, medicine, prescription, request in rows
    ]

    if search and search.strip():
        term = search.strip().lower()
        serialized = [
            item
            for item in serialized
            if term in " ".join(
                filter(
                    None,
                    [
                        item["action_type"],
                        item["reference_type"],
                        item["details"],
                        item["keeper_name"],
                        item["medicine_name"],
                        item["medicine_code"],
                        item["prescription_code"],
                        item["request_code"],
                    ],
                )
            ).lower()
        ]

    return serialized
