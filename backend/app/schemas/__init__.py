from .auth import (
    RegisterBasicSchema,
    VerifyOTPSchema,
    ResendOTPSchema,
    CompleteProfileSchema,
    LoginSchema,
)
from .appointment import BookAppointmentSchema
from .health_record import SaveHealthRecordSchema
from .consultation import SaveConsultationSchema
from .prescription import CreatePrescriptionSchema, ReleasePrescriptionSchema
from .medicine_request import CreateMedicineRequestSchema