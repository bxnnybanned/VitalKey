from pydantic import BaseModel, Field

class CreateMedicineRequestSchema(BaseModel):
    mobile_number: str
    medicine_id: int
    quantity: int = Field(..., gt=0)
    reason: str | None = None