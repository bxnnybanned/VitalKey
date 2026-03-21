from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db import Base

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    consultation_code = Column(String(50), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    kiosk_session_id = Column(Integer, ForeignKey("kiosk_sessions.id"), nullable=True)
    consultation_notes = Column(Text, nullable=False)
    diagnosis = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
