from pydantic import BaseModel, Field
from typing import Optional

class SaveConsultationSchema(BaseModel):
    appointment_id: Optional[int] = None
    patient_code: str
    doctor_id: int
    kiosk_session_id: Optional[int] = None
    consultation_notes: str = Field(..., min_length=3)
    diagnosis: str = Field(..., min_length=3)
