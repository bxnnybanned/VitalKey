from datetime import date

from pydantic import BaseModel, Field


class InventoryMedicineCreateSchema(BaseModel):
    medicine_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=255)
    stock_quantity: int = Field(..., ge=0)
    expiration_date: date | None = None
    unit: str | None = Field(default=None, max_length=50)
    is_active: bool = True
    keeper_id: int | None = None


class InventoryMedicineUpdateSchema(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=255)
    stock_quantity: int | None = Field(default=None, ge=0)
    expiration_date: date | None = None
    unit: str | None = Field(default=None, max_length=50)
    is_active: bool | None = None
    keeper_id: int | None = None
