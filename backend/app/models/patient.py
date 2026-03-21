from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean
from sqlalchemy.sql import func
from app.db import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, nullable=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    birthday = Column(Date, nullable=False)
    sex = Column(String(20), nullable=False)
    email = Column(String(150), unique=True, nullable=True)
    mobile_number = Column(String(20), unique=True, nullable=True)
    contact_number = Column(String(20), nullable=True)
    password = Column(String(255), nullable=True)
    patient_source = Column(String(30), nullable=False, default="mobile_app")
    address = Column(String(255), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    profile_picture = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
