from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies.auth import get_current_medicine_keeper
from app.db import get_db
from app.models.inventory_transaction import InventoryTransaction
from app.models.inventory_activity_log import InventoryActivityLog
from app.models.medicine import Medicine
from app.models.medicine_keeper import MedicineKeeper
from app.models.medicine_request import MedicineRequest
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.prescription_item import PrescriptionItem
from app.models.doctor import Doctor
from app.models.consultation import Consultation
from app.models.health_record import HealthRecord
from app.schemas.inventory import (
    InventoryLoginSchema,
    UpdateMedicineRequestStatusSchema,
    UpdatePrescriptionStatusSchema,
)
from app.schemas.medicine import (
    InventoryMedicineCreateSchema,
    InventoryMedicineUpdateSchema,
)
from app.utils.auth_tokens import create_access_token
from app.utils.security import verify_password
from app.utils.statuses import (
    MEDICINE_REQUEST_ALLOWED_TRANSITIONS,
    PRESCRIPTION_ALLOWED_TRANSITIONS,
    normalize_medicine_request_status,
    normalize_prescription_status,
)

router = APIRouter(prefix="/inventory", tags=["Inventory System"])
protected_router = APIRouter(
    tags=["Inventory System"],
    dependencies=[Depends(get_current_medicine_keeper)],
)

LOW_STOCK_THRESHOLD = 10
EXPIRING_DAYS = 30
def get_keeper_or_404(keeper_id: int, db: Session) -> MedicineKeeper:
    keeper = (
        db.query(MedicineKeeper)
        .filter(MedicineKeeper.id == keeper_id, MedicineKeeper.is_active == True)
        .first()
    )
    if not keeper:
        raise HTTPException(status_code=404, detail="Medicine keeper not found")
    return keeper


def log_inventory_activity(
    db: Session,
    *,
    keeper_id: int,
    action_type: str,
    reference_type: str,
    details: str,
    medicine_id: int | None = None,
    prescription_id: int | None = None,
    medicine_request_id: int | None = None,
):
    db.add(
        InventoryActivityLog(
            keeper_id=keeper_id,
            medicine_id=medicine_id,
            prescription_id=prescription_id,
            medicine_request_id=medicine_request_id,
            action_type=action_type,
            reference_type=reference_type,
            details=details,
        )
    )


def serialize_prescription(
    prescription: Prescription,
    patient: Patient,
    doctor: Doctor,
    items_data,
    health_summary=None,
    consultation_data=None,
):
    return {
        "prescription_id": prescription.id,
        "prescription_code": prescription.prescription_code,
        "status": prescription.status,
        "created_at": str(prescription.created_at),
        "prepared_at": str(prescription.prepared_at) if prescription.prepared_at else None,
        "ready_at": str(prescription.ready_at) if prescription.ready_at else None,
        "released_at": str(prescription.released_at) if prescription.released_at else None,
        "patient_id": patient.patient_id,
        "patient_name": f"{patient.first_name} {patient.last_name}",
        "doctor_name": f"{doctor.first_name} {doctor.last_name}",
        "doctor_specialization": doctor.specialization,
        "health_summary": health_summary,
        "consultation": consultation_data,
        "items": [
            {
                "prescription_item_id": item.id,
                "medicine_id": medicine.id,
                "medicine_name": medicine.name,
                "dosage_instructions": item.dosage_instructions,
                "quantity": item.quantity,
                "stock_quantity": medicine.stock_quantity,
                "unit": medicine.unit,
                "is_available": medicine.stock_quantity >= item.quantity,
            }
            for item, medicine in items_data
        ],
    }


def serialize_health_summary(record: HealthRecord | None):
    if not record:
        return None

    return {
        "height_cm": float(record.height_cm) if record.height_cm is not None else None,
        "weight_kg": float(record.weight_kg) if record.weight_kg is not None else None,
        "temperature_c": float(record.temperature_c) if record.temperature_c is not None else None,
        "systolic_bp": record.systolic_bp,
        "diastolic_bp": record.diastolic_bp,
        "oxygen_saturation": (
            float(record.oxygen_saturation) if record.oxygen_saturation is not None else None
        ),
        "heart_rate": record.heart_rate,
        "recorded_at": str(record.recorded_at) if record.recorded_at else None,
    }


def serialize_medicine(medicine: Medicine):
    return {
        "medicine_id": medicine.id,
        "medicine_code": medicine.medicine_code,
        "name": medicine.name,
        "description": medicine.description,
        "stock_quantity": medicine.stock_quantity,
        "expiration_date": str(medicine.expiration_date) if medicine.expiration_date else None,
        "unit": medicine.unit,
        "is_active": medicine.is_active,
    }


@router.post("/login")
def login_inventory_keeper(
    payload: InventoryLoginSchema, db: Session = Depends(get_db)
):
    keeper = (
        db.query(MedicineKeeper)
        .filter(
            MedicineKeeper.username == payload.username,
            MedicineKeeper.is_active == True,
        )
        .first()
    )

    if not keeper or not verify_password(payload.password, keeper.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "message": "Login successful",
        "keeper": {
            "keeper_id": keeper.id,
            "keeper_code": keeper.keeper_code,
            "first_name": keeper.first_name,
            "last_name": keeper.last_name,
            "full_name": f"{keeper.first_name} {keeper.last_name}",
            "username": keeper.username,
        },
        "access_token": create_access_token(entity_id=keeper.id, role="inventory"),
    }


@protected_router.get("/dashboard-summary")
def get_inventory_dashboard_summary(db: Session = Depends(get_db)):
    today = date.today()
    start_of_today = datetime.combine(today, datetime.min.time())
    expiring_cutoff = today + timedelta(days=EXPIRING_DAYS)

    total_pending = db.query(Prescription).filter(Prescription.status == "pending").count()
    total_prepared = db.query(Prescription).filter(Prescription.status == "prepared").count()
    total_ready = (
        db.query(Prescription).filter(Prescription.status == "ready").count()
    )
    total_released_today = (
        db.query(Prescription)
        .filter(
            Prescription.status == "released",
            Prescription.released_at >= start_of_today,
        )
        .count()
    )
    low_stock_count = (
        db.query(Medicine)
        .filter(Medicine.is_active == True, Medicine.stock_quantity <= LOW_STOCK_THRESHOLD)
        .count()
    )
    expiring_count = (
        db.query(Medicine)
        .filter(
            Medicine.is_active == True,
            Medicine.expiration_date != None,
            Medicine.expiration_date <= expiring_cutoff,
        )
        .count()
    )

    return {
        "pending_prescriptions": total_pending,
        "prepared_prescriptions": total_prepared,
        "ready_for_pickup": total_ready,
        "released_today": total_released_today,
        "low_stock_medicines": low_stock_count,
        "expiring_medicines": expiring_count,
    }


@protected_router.get("/medicines")
def get_inventory_medicines(db: Session = Depends(get_db)):
    medicines = db.query(Medicine).order_by(Medicine.name.asc(), Medicine.id.desc()).all()
    return [serialize_medicine(medicine) for medicine in medicines]


@protected_router.post("/medicines")
def create_inventory_medicine(
    payload: InventoryMedicineCreateSchema,
    db: Session = Depends(get_db),
    current_keeper: MedicineKeeper = Depends(get_current_medicine_keeper),
):
    existing = (
        db.query(Medicine)
        .filter(Medicine.medicine_code == payload.medicine_code)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Medicine code already exists")

    keeper = current_keeper

    medicine = Medicine(
        medicine_code=payload.medicine_code.strip(),
        name=payload.name.strip(),
        description=payload.description,
        stock_quantity=int(payload.stock_quantity),
        expiration_date=payload.expiration_date,
        unit=payload.unit,
        is_active=payload.is_active,
    )

    db.add(medicine)
    db.commit()
    db.refresh(medicine)

    log_inventory_activity(
        db,
        keeper_id=keeper.id,
        action_type="Create Medicine",
        reference_type="Medicine",
        medicine_id=medicine.id,
        details=(
            f"Added medicine {medicine.name} ({medicine.medicine_code}) "
            f"with stock {medicine.stock_quantity}."
        ),
    )
    db.commit()

    return {
        "message": "Medicine added successfully",
        "medicine": serialize_medicine(medicine),
    }


@protected_router.put("/medicines/{medicine_id}")
def update_inventory_medicine(
    medicine_id: int,
    payload: InventoryMedicineUpdateSchema,
    db: Session = Depends(get_db),
    current_keeper: MedicineKeeper = Depends(get_current_medicine_keeper),
):
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    keeper = current_keeper
    previous_name = medicine.name
    previous_stock = medicine.stock_quantity
    previous_status = medicine.is_active

    payload_data = payload.model_dump(exclude_unset=True)

    if "name" in payload_data and str(payload_data["name"]).strip():
        medicine.name = str(payload_data["name"]).strip()
    if "description" in payload_data:
        medicine.description = payload_data.get("description")
    if "stock_quantity" in payload_data and payload_data["stock_quantity"] is not None:
        medicine.stock_quantity = int(payload_data["stock_quantity"])
    if "expiration_date" in payload_data:
        medicine.expiration_date = payload_data.get("expiration_date")
    if "unit" in payload_data:
        medicine.unit = payload_data.get("unit")
    if "is_active" in payload_data:
        medicine.is_active = bool(payload_data.get("is_active"))

    db.commit()
    db.refresh(medicine)

    log_inventory_activity(
        db,
        keeper_id=keeper.id,
        action_type="Update Medicine",
        reference_type="Medicine",
        medicine_id=medicine.id,
        details=(
            f"Updated {previous_name} ({medicine.medicine_code}). "
            f"Stock: {previous_stock} -> {medicine.stock_quantity}. "
            f"Status: {'Active' if previous_status else 'Inactive'} -> "
            f"{'Active' if medicine.is_active else 'Inactive'}."
        ),
    )
    db.commit()

    return {
        "message": "Medicine updated successfully",
        "medicine": serialize_medicine(medicine),
    }


@protected_router.delete("/medicines/{medicine_id}")
def delete_inventory_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_keeper: MedicineKeeper = Depends(get_current_medicine_keeper),
):
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    keeper = current_keeper
    medicine_name = medicine.name
    medicine_code = medicine.medicine_code

    used_in_prescriptions = (
        db.query(PrescriptionItem)
        .filter(PrescriptionItem.medicine_id == medicine_id)
        .first()
    )
    used_in_requests = (
        db.query(MedicineRequest)
        .filter(MedicineRequest.medicine_id == medicine_id)
        .first()
    )
    used_in_transactions = (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.medicine_id == medicine_id)
        .first()
    )

    if used_in_prescriptions or used_in_requests or used_in_transactions:
        raise HTTPException(
            status_code=400,
            detail=(
                "This medicine already has records in the system. "
                "Set it as inactive instead of deleting it."
            ),
        )

    db.delete(medicine)
    db.commit()

    log_inventory_activity(
        db,
        keeper_id=keeper.id,
        action_type="Delete Medicine",
        reference_type="Medicine",
        details=f"Deleted medicine {medicine_name} ({medicine_code}).",
    )
    db.commit()

    return {"message": "Medicine deleted successfully"}


@protected_router.get("/prescriptions")
def get_inventory_prescriptions(db: Session = Depends(get_db)):
    results = (
        db.query(Prescription, Patient, Doctor)
        .join(Patient, Prescription.patient_id == Patient.id)
        .join(Doctor, Prescription.doctor_id == Doctor.id)
        .order_by(Prescription.created_at.desc(), Prescription.id.desc())
        .all()
    )

    response = []
    for prescription, patient, doctor in results:
        consultation = (
            db.query(Consultation)
            .filter(Consultation.id == prescription.consultation_id)
            .first()
        )
        summary_record = None
        if consultation and consultation.kiosk_session_id:
            summary_record = (
                db.query(HealthRecord)
                .filter(HealthRecord.kiosk_session_id == consultation.kiosk_session_id)
                .order_by(HealthRecord.recorded_at.desc(), HealthRecord.id.desc())
                .first()
            )
        items = (
            db.query(PrescriptionItem, Medicine)
            .join(Medicine, PrescriptionItem.medicine_id == Medicine.id)
            .filter(PrescriptionItem.prescription_id == prescription.id)
            .all()
        )
        response.append(
            serialize_prescription(
                prescription,
                patient,
                doctor,
                items,
                health_summary=serialize_health_summary(summary_record),
                consultation_data={
                    "consultation_code": consultation.consultation_code if consultation else None,
                    "consultation_notes": consultation.consultation_notes if consultation else None,
                    "diagnosis": consultation.diagnosis if consultation else None,
                },
            )
        )

    return response


@protected_router.put("/prescriptions/{prescription_id}/status")
def update_inventory_prescription_status(
    prescription_id: int,
    payload: UpdatePrescriptionStatusSchema,
    db: Session = Depends(get_db),
    current_keeper: MedicineKeeper = Depends(get_current_medicine_keeper),
):
    try:
        target_status = normalize_prescription_status(payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if current_keeper.id != payload.keeper_id:
        raise HTTPException(status_code=403, detail="You can only submit your own inventory actions")

    keeper = current_keeper
    prescription = (
        db.query(Prescription).filter(Prescription.id == prescription_id).first()
    )
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    items = (
        db.query(PrescriptionItem, Medicine)
        .join(Medicine, PrescriptionItem.medicine_id == Medicine.id)
        .filter(PrescriptionItem.prescription_id == prescription.id)
        .all()
    )
    if not items:
        raise HTTPException(status_code=400, detail="Prescription has no items")

    now = datetime.now()

    current_status = normalize_prescription_status(prescription.status)
    if target_status != current_status and target_status not in PRESCRIPTION_ALLOWED_TRANSITIONS.get(current_status, set()):
        raise HTTPException(status_code=400, detail="Invalid prescription status transition")

    if target_status == "prepared":
        prescription.status = target_status
        prescription.prepared_by = keeper.id
        prescription.prepared_at = now
        log_inventory_activity(
            db,
            keeper_id=keeper.id,
            action_type="Prepare Prescription",
            reference_type="Prescription",
            prescription_id=prescription.id,
            details=f"Prepared prescription {prescription.prescription_code}.",
        )

    elif target_status == "ready":
        prescription.status = target_status
        if not prescription.prepared_by:
            prescription.prepared_by = keeper.id
        if not prescription.prepared_at:
            prescription.prepared_at = now
        prescription.ready_by = keeper.id
        prescription.ready_at = now
        log_inventory_activity(
            db,
            keeper_id=keeper.id,
            action_type="Ready for Pickup",
            reference_type="Prescription",
            prescription_id=prescription.id,
            details=(
                f"Marked prescription {prescription.prescription_code} as ready for pickup."
            ),
        )

    elif target_status == "released":
        for item, medicine in items:
            if medicine.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Insufficient stock for {medicine.name}. "
                        f"Available: {medicine.stock_quantity}, Required: {item.quantity}"
                    ),
                )

        for item, medicine in items:
            medicine.stock_quantity -= item.quantity
            db.add(
                InventoryTransaction(
                    prescription_id=prescription.id,
                    medicine_id=medicine.id,
                    quantity_released=item.quantity,
                    transaction_type="Release",
                    processed_by=keeper.id,
                )
            )

        prescription.status = target_status
        if not prescription.prepared_by:
            prescription.prepared_by = keeper.id
        if not prescription.prepared_at:
            prescription.prepared_at = now
        if not prescription.ready_by:
            prescription.ready_by = keeper.id
        if not prescription.ready_at:
            prescription.ready_at = now
        prescription.released_by = keeper.id
        prescription.released_at = now
        log_inventory_activity(
            db,
            keeper_id=keeper.id,
            action_type="Release Prescription",
            reference_type="Prescription",
            prescription_id=prescription.id,
            details=(
                f"Released prescription {prescription.prescription_code} to patient."
            ),
        )

    db.commit()

    return {
        "message": "Prescription status updated successfully",
        "prescription_id": prescription.id,
        "prescription_code": prescription.prescription_code,
        "status": prescription.status,
        "processed_by": f"{keeper.first_name} {keeper.last_name}",
    }


@protected_router.get("/transaction-history")
def get_inventory_transactions(db: Session = Depends(get_db)):
    transactions = (
        db.query(InventoryTransaction, Medicine, Prescription, MedicineKeeper)
        .join(Medicine, InventoryTransaction.medicine_id == Medicine.id)
        .join(Prescription, InventoryTransaction.prescription_id == Prescription.id)
        .outerjoin(MedicineKeeper, InventoryTransaction.processed_by == MedicineKeeper.id)
        .order_by(InventoryTransaction.released_at.desc(), InventoryTransaction.id.desc())
        .all()
    )

    return [
        {
            "transaction_id": tx.id,
            "prescription_code": prescription.prescription_code,
            "medicine_name": medicine.name,
            "quantity_released": tx.quantity_released,
            "transaction_type": tx.transaction_type,
            "processed_by": (
                f"{keeper.first_name} {keeper.last_name}" if keeper else "-"
            ),
            "released_at": str(tx.released_at),
        }
        for tx, medicine, prescription, keeper in transactions
    ]


@protected_router.get("/medicine-requests")
def get_inventory_medicine_requests(db: Session = Depends(get_db)):
    requests = (
        db.query(MedicineRequest, Patient, Medicine)
        .join(Patient, MedicineRequest.patient_id == Patient.id)
        .join(Medicine, MedicineRequest.medicine_id == Medicine.id)
        .order_by(MedicineRequest.requested_at.desc(), MedicineRequest.id.desc())
        .all()
    )

    return [
        {
            "request_id": request.id,
            "request_code": request.request_code,
            "patient_id": patient.patient_id,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "medicine_name": medicine.name,
            "stock_quantity": medicine.stock_quantity,
            "quantity": request.quantity,
            "reason": request.reason,
            "status": request.status,
            "requested_at": str(request.requested_at),
            "processed_at": str(request.processed_at) if request.processed_at else None,
        }
        for request, patient, medicine in requests
    ]


@protected_router.put("/medicine-requests/{request_id}/status")
def update_inventory_medicine_request_status(
    request_id: int,
    payload: UpdateMedicineRequestStatusSchema,
    db: Session = Depends(get_db),
    current_keeper: MedicineKeeper = Depends(get_current_medicine_keeper),
):
    try:
        target_status = normalize_medicine_request_status(payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if current_keeper.id != payload.keeper_id:
        raise HTTPException(status_code=403, detail="You can only submit your own inventory actions")

    keeper = current_keeper
    request = db.query(MedicineRequest).filter(MedicineRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Medicine request not found")

    medicine = db.query(Medicine).filter(Medicine.id == request.medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    current_status = normalize_medicine_request_status(request.status)
    if target_status != current_status and target_status not in MEDICINE_REQUEST_ALLOWED_TRANSITIONS.get(current_status, set()):
        raise HTTPException(status_code=400, detail="Invalid medicine request status transition")

    if target_status == "released":
        if medicine.stock_quantity < request.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for {medicine.name}. "
                    f"Available: {medicine.stock_quantity}, Required: {request.quantity}"
                ),
            )
        medicine.stock_quantity -= request.quantity

    request.status = target_status
    request.processed_by = keeper.id
    request.processed_at = datetime.now()
    log_inventory_activity(
        db,
        keeper_id=keeper.id,
        action_type=f"Medicine Request: {target_status}",
        reference_type="Medicine Request",
        medicine_id=medicine.id,
        medicine_request_id=request.id,
        details=(
            f"Updated patient request {request.request_code} for {medicine.name} "
            f"to {target_status}."
        ),
    )
    db.commit()

    return {
        "message": "Medicine request updated successfully",
        "request_id": request.id,
        "status": request.status,
    }


@protected_router.get("/alerts")
def get_inventory_alerts(db: Session = Depends(get_db)):
    today = date.today()
    expiring_cutoff = today + timedelta(days=EXPIRING_DAYS)

    low_stock = (
        db.query(Medicine)
        .filter(Medicine.is_active == True, Medicine.stock_quantity <= LOW_STOCK_THRESHOLD)
        .order_by(Medicine.stock_quantity.asc(), Medicine.name.asc())
        .all()
    )
    expiring = (
        db.query(Medicine)
        .filter(
            Medicine.is_active == True,
            Medicine.expiration_date != None,
            Medicine.expiration_date <= expiring_cutoff,
        )
        .order_by(Medicine.expiration_date.asc(), Medicine.name.asc())
        .all()
    )

    return {
        "low_stock": [
            {
                "medicine_id": medicine.id,
                "medicine_code": medicine.medicine_code,
                "name": medicine.name,
                "stock_quantity": medicine.stock_quantity,
                "unit": medicine.unit,
            }
            for medicine in low_stock
        ],
        "expiring": [
            {
                "medicine_id": medicine.id,
                "medicine_code": medicine.medicine_code,
                "name": medicine.name,
                "expiration_date": str(medicine.expiration_date),
                "stock_quantity": medicine.stock_quantity,
                "unit": medicine.unit,
            }
            for medicine in expiring
        ],
    }


@protected_router.get("/reports/summary")
def get_inventory_reports_summary(db: Session = Depends(get_db)):
    total_dispensed = (
        db.query(func.sum(InventoryTransaction.quantity_released)).scalar() or 0
    )
    transaction_count = db.query(func.count(InventoryTransaction.id)).scalar() or 0
    released_prescriptions = (
        db.query(func.count(Prescription.id))
        .filter(Prescription.status == "released")
        .scalar()
        or 0
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
        "total_medicines_dispensed": int(total_dispensed),
        "total_transactions": int(transaction_count),
        "released_prescriptions": int(released_prescriptions),
        "top_medicine": {
            "medicine_name": top_medicine.name if top_medicine else None,
            "total_released": int(top_medicine.total_released) if top_medicine and top_medicine.total_released is not None else 0,
        },
    }


@protected_router.get("/reports/medicine-usage")
def get_inventory_medicine_usage_report(db: Session = Depends(get_db)):
    usage = (
        db.query(
            Medicine.name,
            func.sum(InventoryTransaction.quantity_released).label("total_released"),
        )
        .join(InventoryTransaction, InventoryTransaction.medicine_id == Medicine.id)
        .group_by(Medicine.name)
        .order_by(func.sum(InventoryTransaction.quantity_released).desc())
        .all()
    )

    return [
        {
            "medicine_name": row.name,
            "total_released": int(row.total_released) if row.total_released is not None else 0,
        }
        for row in usage
    ]


@protected_router.get("/reports/daily-dispensing")
def get_inventory_daily_dispensing_report(limit: int = 14, db: Session = Depends(get_db)):
    transactions = (
        db.query(InventoryTransaction)
        .order_by(InventoryTransaction.released_at.asc(), InventoryTransaction.id.asc())
        .all()
    )

    grouped = defaultdict(int)
    for transaction in transactions:
        if transaction.released_at:
            grouped[transaction.released_at.date()] += int(transaction.quantity_released)

    items = [
        {
            "label": day.isoformat(),
            "date": day.isoformat(),
            "total_released": total,
        }
        for day, total in sorted(grouped.items())
    ]

    return items[-limit:]


router.include_router(protected_router)
