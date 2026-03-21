from pydantic import BaseModel, Field
from typing import List

class PrescriptionItemInput(BaseModel):
    medicine_id: int
    dosage_instructions: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(..., gt=0)

class CreatePrescriptionSchema(BaseModel):
    consultation_id: int
    items: List[PrescriptionItemInput]

class CompleteConsultationPrescriptionSchema(BaseModel):
    appointment_id: int | None = None
    patient_code: str
    doctor_id: int
    kiosk_session_id: int | None = None
    consultation_notes: str = Field(..., min_length=3)
    diagnosis: str = Field(..., min_length=3)
    items: List[PrescriptionItemInput]

class ReleasePrescriptionSchema(BaseModel):
    prescription_id: int
