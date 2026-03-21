from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.consultation import Consultation
from app.models.medicine import Medicine
from app.models.prescription import Prescription
from app.models.prescription_item import PrescriptionItem
from app.models.inventory_transaction import InventoryTransaction
from app.models.patient import Patient
from app.utils.prescription_code import generate_prescription_code
from app.models.medicine_request import MedicineRequest
from app.utils.medicine_request_code import generate_medicine_request_code
from app.schemas.medicine_request import CreateMedicineRequestSchema
from app.schemas.prescription import CreatePrescriptionSchema, ReleasePrescriptionSchema
from app.utils.statuses import normalize_medicine_request_status, normalize_prescription_status

router = APIRouter(tags=["Prescription and Inventory"])

@router.get("/medicines")
def get_medicines(db: Session = Depends(get_db)):
    medicines = db.query(Medicine).filter(Medicine.is_active == True).all()

    return [
        {
            "medicine_id": med.id,
            "medicine_code": med.medicine_code,
            "name": med.name,
            "description": med.description,
            "stock_quantity": med.stock_quantity,
            "expiration_date": str(med.expiration_date) if med.expiration_date else None,
            "unit": med.unit
        }
        for med in medicines
    ]


@router.post("/doctor/create-prescription")
def create_prescription(payload: CreatePrescriptionSchema, db: Session = Depends(get_db)):
    consultation = db.query(Consultation).filter(Consultation.id == payload.consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="At least one medicine is required")

    validated_items = []
    for item in payload.items:
        medicine = db.query(Medicine).filter(Medicine.id == item.medicine_id, Medicine.is_active == True).first()
        if not medicine:
            raise HTTPException(status_code=404, detail=f"Medicine with id {item.medicine_id} not found")

        validated_items.append((item, medicine))

    new_prescription = Prescription(
        prescription_code=generate_prescription_code(),
        consultation_id=consultation.id,
        patient_id=consultation.patient_id,
        doctor_id=consultation.doctor_id,
        status=normalize_prescription_status("pending")
    )

    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    created_items = []

    for item, medicine in validated_items:
        new_item = PrescriptionItem(
            prescription_id=new_prescription.id,
            medicine_id=item.medicine_id,
            dosage_instructions=item.dosage_instructions,
            quantity=item.quantity
        )
        db.add(new_item)

        created_items.append({
            "medicine_id": medicine.id,
            "medicine_name": medicine.name,
            "dosage_instructions": item.dosage_instructions,
            "quantity": item.quantity
        })

    db.commit()

    return {
        "message": "Prescription created successfully",
        "prescription_id": new_prescription.id,
        "prescription_code": new_prescription.prescription_code,
        "status": new_prescription.status,
        "items": created_items
    }


@router.get("/inventory/pending-prescriptions")
def get_pending_prescriptions(db: Session = Depends(get_db)):
    prescriptions = db.query(Prescription).filter(Prescription.status == "pending").all()

    results = []
    for prescription in prescriptions:
        items = (
            db.query(PrescriptionItem, Medicine)
            .join(Medicine, PrescriptionItem.medicine_id == Medicine.id)
            .filter(PrescriptionItem.prescription_id == prescription.id)
            .all()
        )

        results.append({
            "prescription_id": prescription.id,
            "prescription_code": prescription.prescription_code,
            "consultation_id": prescription.consultation_id,
            "patient_id": prescription.patient_id,
            "doctor_id": prescription.doctor_id,
            "status": prescription.status,
            "items": [
                {
                    "medicine_id": medicine.id,
                    "medicine_name": medicine.name,
                    "stock_quantity": medicine.stock_quantity,
                    "dosage_instructions": item.dosage_instructions,
                    "quantity": item.quantity
                }
                for item, medicine in items
            ]
        })

    return results


@router.post("/inventory/release-prescription")
def release_prescription(payload: ReleasePrescriptionSchema, db: Session = Depends(get_db)):
    prescription = db.query(Prescription).filter(Prescription.id == payload.prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if prescription.status == "released":
        raise HTTPException(status_code=400, detail="Prescription already released")

    items = db.query(PrescriptionItem).filter(PrescriptionItem.prescription_id == prescription.id).all()

    if not items:
        raise HTTPException(status_code=400, detail="Prescription has no items")

    for item in items:
        medicine = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
        if not medicine:
            raise HTTPException(status_code=404, detail=f"Medicine with id {item.medicine_id} not found")

        if medicine.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {medicine.name}. Available: {medicine.stock_quantity}, Required: {item.quantity}"
            )

    for item in items:
        medicine = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
        medicine.stock_quantity -= item.quantity

        tx = InventoryTransaction(
            prescription_id=prescription.id,
            medicine_id=medicine.id,
            quantity_released=item.quantity,
            transaction_type="Release"
        )
        db.add(tx)

    prescription.status = normalize_prescription_status("released")
    db.commit()

    return {
        "message": "Prescription released successfully",
        "prescription_id": prescription.id,
        "prescription_code": prescription.prescription_code,
        "status": prescription.status
    }


@router.get("/inventory/transactions")
def get_inventory_transactions(db: Session = Depends(get_db)):
    txs = (
        db.query(InventoryTransaction, Medicine, Prescription)
        .join(Medicine, InventoryTransaction.medicine_id == Medicine.id)
        .join(Prescription, InventoryTransaction.prescription_id == Prescription.id)
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
            "released_at": str(tx.released_at)
        }
        for tx, medicine, prescription in txs
    ]

@router.get("/patient/prescriptions/{mobile_number}")
def get_patient_prescriptions(mobile_number: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.mobile_number == mobile_number).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    prescriptions = db.query(Prescription).filter(Prescription.patient_id == patient.id).all()

    results = []
    for prescription in prescriptions:
        items = (
            db.query(PrescriptionItem, Medicine)
            .join(Medicine, PrescriptionItem.medicine_id == Medicine.id)
            .filter(PrescriptionItem.prescription_id == prescription.id)
            .all()
        )

        results.append({
            "prescription_id": prescription.id,
            "prescription_code": prescription.prescription_code,
            "status": prescription.status,
            "created_at": str(prescription.created_at),
            "items": [
                {
                    "medicine_name": medicine.name,
                    "dosage_instructions": item.dosage_instructions,
                    "quantity": item.quantity
                }
                for item, medicine in items
            ]
        })

    return results

@router.post("/patient/request-medicine")
def create_medicine_request(payload: CreateMedicineRequestSchema, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.mobile_number == payload.mobile_number).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    medicine = db.query(Medicine).filter(Medicine.id == payload.medicine_id, Medicine.is_active == True).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    new_request = MedicineRequest(
        request_code=generate_medicine_request_code(),
        patient_id=patient.id,
        medicine_id=medicine.id,
        quantity=payload.quantity,
        reason=payload.reason,
        status=normalize_medicine_request_status("pending")
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "message": "Medicine request submitted successfully",
        "request_id": new_request.id,
        "request_code": new_request.request_code,
        "status": new_request.status
    }


@router.get("/patient/medicine-requests/{mobile_number}")
def get_patient_medicine_requests(mobile_number: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.mobile_number == mobile_number).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    requests = (
        db.query(MedicineRequest, Medicine)
        .join(Medicine, MedicineRequest.medicine_id == Medicine.id)
        .filter(MedicineRequest.patient_id == patient.id)
        .order_by(MedicineRequest.requested_at.desc(), MedicineRequest.id.desc())
        .all()
    )

    return [
        {
            "request_id": request.id,
            "request_code": request.request_code,
            "medicine_name": medicine.name,
            "quantity": request.quantity,
            "reason": request.reason,
            "status": request.status,
            "requested_at": str(request.requested_at)
        }
        for request, medicine in requests
    ]
