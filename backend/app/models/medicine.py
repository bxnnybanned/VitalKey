from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime
from sqlalchemy.sql import func
from app.db import Base

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    medicine_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(String(255), nullable=True)
    stock_quantity = Column(Integer, nullable=False, default=0)
    expiration_date = Column(Date, nullable=True)
    unit = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())