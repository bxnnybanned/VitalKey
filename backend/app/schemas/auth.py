from typing import Literal

from pydantic import BaseModel, Field, EmailStr
from datetime import date

class RegisterBasicSchema(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    birthday: date
    sex: Literal["Male", "Female"]
    email: EmailStr
    mobile_number: str = Field(..., min_length=11, max_length=15)
    password: str = Field(..., min_length=8, max_length=16)
    confirm_password: str = Field(..., min_length=8, max_length=16)

class VerifyOTPSchema(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)

class ResendOTPSchema(BaseModel):
    email: EmailStr

class CompleteProfileSchema(BaseModel):
    email: EmailStr
    address: str = Field(..., min_length=1, max_length=255)
    emergency_contact: str = Field(..., min_length=1, max_length=100)

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class ResetPasswordSchema(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=16)
    confirm_password: str = Field(..., min_length=8, max_length=16)


class AdminRegisterSchema(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class AdminLoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=100)


class DoctorLoginSchema(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=100)


class ProfileUpdateSchema(BaseModel):
    new_mobile_number: str | None = Field(default=None, min_length=11, max_length=15)
    address: str | None = Field(default=None, min_length=1, max_length=255)
    emergency_contact: str | None = Field(default=None, min_length=1, max_length=100)
    profile_picture: str | None = Field(default=None, max_length=255)
