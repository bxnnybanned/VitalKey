from pydantic import BaseModel, Field, EmailStr
from datetime import date

class RegisterBasicSchema(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    birthday: date
    sex: str = Field(..., min_length=1, max_length=20)
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