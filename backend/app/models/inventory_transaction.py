from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db import Base

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    quantity_released = Column(Integer, nullable=False)
    transaction_type = Column(String(50), nullable=False)
    processed_by = Column(Integer, ForeignKey("medicine_keepers.id"), nullable=True)
    released_at = Column(DateTime(timezone=True), server_default=func.now())
