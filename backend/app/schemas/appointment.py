from datetime import time
from pydantic import BaseModel, Field

class BookAppointmentSchema(BaseModel):
    mobile_number: str
    doctor_id: int
    appointment_time: time
    reason: str = Field(..., min_length=3, max_length=255)