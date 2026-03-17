from sqlalchemy import Column, Integer, String, Boolean, Time, DateTime
from sqlalchemy.sql import func

from app.db import Base


class ClinicSetting(Base):
    __tablename__ = "clinic_settings"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(20), unique=True, nullable=False)
    is_open = Column(Boolean, nullable=False, default=True)
    open_time = Column(Time, nullable=True)
    close_time = Column(Time, nullable=True)
    slot_interval_minutes = Column(Integer, nullable=False, default=30)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
