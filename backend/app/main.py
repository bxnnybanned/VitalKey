from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles 
from fastapi.middleware.cors import CORSMiddleware
from app.db import Base, engine
from app.routes.auth import router as auth_router
from app.routes.appointment import router as appointment_router
from app.routes.kiosk import router as kiosk_router
from app.routes.doctor_portal import router as doctor_portal_router
from app.routes.prescription import router as prescription_router
from app.routes.admin import router as admin_router
from app.models import patient, otp_code, doctor, appointment, health_record, consultation, medicine, prescription, prescription_item, inventory_transaction, admin, clinic_setting
from app.routes.admin_auth import router as admin_auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="VitalKey Kiosk API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(auth_router)
app.include_router(appointment_router)
app.include_router(kiosk_router)
app.include_router(doctor_portal_router)
app.include_router(prescription_router)
app.include_router(admin_router)
app.include_router(admin_auth_router)

@app.get("/")
def root():
    return {"message": "VitalKey Kiosk backend is running"}
