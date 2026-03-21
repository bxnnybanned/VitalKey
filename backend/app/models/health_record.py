from sqlalchemy import Column, Integer, DateTime, ForeignKey, DECIMAL
from sqlalchemy.sql import func
from app.db import Base

class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    kiosk_session_id = Column(Integer, ForeignKey("kiosk_sessions.id"), nullable=True)
    height_cm = Column(DECIMAL(5, 2), nullable=True)
    weight_kg = Column(DECIMAL(5, 2), nullable=True)
    temperature_c = Column(DECIMAL(4, 2), nullable=True)
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    oxygen_saturation = Column(DECIMAL(5, 2), nullable=True)
    heart_rate = Column(Integer, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
