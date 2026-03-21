from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db import Base


class InventoryActivityLog(Base):
    __tablename__ = "inventory_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    keeper_id = Column(Integer, ForeignKey("medicine_keepers.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)
    medicine_request_id = Column(Integer, ForeignKey("medicine_requests.id"), nullable=True)
    action_type = Column(String(50), nullable=False)
    reference_type = Column(String(50), nullable=False)
    details = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
