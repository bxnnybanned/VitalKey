from pydantic import BaseModel, Field
from typing import Optional


class KioskBasicPatientSchema(BaseModel):
    first_name: str
    last_name: str
    birthday: str
    sex: str
    mobile_number: str
    address: Optional[str] = None

class SaveHealthRecordSchema(BaseModel):
    patient_code: str
    height_cm: Optional[float] = Field(default=None, ge=0, le=300)
    weight_kg: Optional[float] = Field(default=None, ge=0, le=500)
    temperature_c: Optional[float] = Field(default=None, ge=20, le=50)
    systolic_bp: Optional[int] = Field(default=None, ge=50, le=250)
    diastolic_bp: Optional[int] = Field(default=None, ge=30, le=200)
    oxygen_saturation: Optional[float] = Field(default=None, ge=0, le=100)
    heart_rate: Optional[int] = Field(default=None, ge=0, le=250)
