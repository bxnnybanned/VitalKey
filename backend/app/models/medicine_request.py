from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db import Base

class MedicineRequest(Base):
    __tablename__ = "medicine_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(50), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=True)
    status = Column(String(50), default="Pending")
    requested_at = Column(DateTime(timezone=True), server_default=func.now())