from datetime import date

from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class DoctorCreateSchema(BaseModel):
    doctor_code: str = Field(..., min_length=1, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    specialization: str | None = Field(default=None, max_length=100)
    username: str | None = Field(default=None, max_length=100)
    password: str | None = Field(default=None, min_length=1, max_length=100)
    is_active: bool = True


class DoctorUpdateSchema(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    specialization: str | None = Field(default=None, max_length=100)
    username: str | None = Field(default=None, max_length=100)
    password: str | None = Field(default=None, min_length=1, max_length=100)
    is_active: bool | None = None


class MedicineCreateSchema(BaseModel):
    medicine_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=255)
    stock_quantity: int = Field(..., ge=0)
    expiration_date: date | None = None
    unit: str | None = Field(default=None, max_length=50)
    is_active: bool = True


class MedicineUpdateSchema(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=255)
    stock_quantity: int | None = Field(default=None, ge=0)
    expiration_date: date | None = None
    unit: str | None = Field(default=None, max_length=50)
    is_active: bool | None = None


class AppointmentStatusUpdateSchema(BaseModel):
    status: str = Field(..., min_length=1, max_length=30)


class AdminCreateSchema(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    is_active: bool = True
    requester_admin_id: int | None = None


class AdminStatusUpdateSchema(BaseModel):
    is_active: bool
    requester_admin_id: int | None = None


class MedicineKeeperCreateSchema(BaseModel):
    keeper_code: str = Field(..., min_length=1, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=100)
    is_active: bool = True


class MedicineKeeperUpdateSchema(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    username: str | None = Field(default=None, max_length=100)
    password: str | None = Field(default=None, min_length=1, max_length=100)
    is_active: bool | None = None


class ClinicSettingUpdateSchema(BaseModel):
    is_open: bool | None = None
    open_time: str | None = None
    close_time: str | None = None
    slot_interval_minutes: int | None = Field(default=None, ge=1, le=240)
