from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    prescription_code = Column(String(50), unique=True, nullable=False)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    status = Column(String(50), default="Pending")
    prepared_by = Column(Integer, ForeignKey("medicine_keepers.id"), nullable=True)
    prepared_at = Column(DateTime(timezone=True), nullable=True)
    ready_by = Column(Integer, ForeignKey("medicine_keepers.id"), nullable=True)
    ready_at = Column(DateTime(timezone=True), nullable=True)
    released_by = Column(Integer, ForeignKey("medicine_keepers.id"), nullable=True)
    released_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
