from pydantic import BaseModel, Field


class InventoryLoginSchema(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)


class UpdatePrescriptionStatusSchema(BaseModel):
    status: str = Field(..., min_length=1, max_length=50)
    keeper_id: int


class UpdateMedicineRequestStatusSchema(BaseModel):
    status: str = Field(..., min_length=1, max_length=50)
    keeper_id: int
