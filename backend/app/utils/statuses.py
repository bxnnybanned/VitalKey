APPOINTMENT_STATUS_ALIASES = {
    "pending": "pending",
    "confirmed": "confirmed",
    "cancelled": "cancelled",
    "canceled": "cancelled",
    "done": "done",
    "consulted": "done",
}

PRESCRIPTION_STATUS_ALIASES = {
    "pending": "pending",
    "prepared": "prepared",
    "ready": "ready",
    "ready for pickup": "ready",
    "released": "released",
}

MEDICINE_REQUEST_STATUS_ALIASES = {
    "pending": "pending",
    "ready": "ready",
    "ready for pickup": "ready",
    "released": "released",
    "rejected": "rejected",
}

KIOSK_SESSION_STATUS_ALIASES = {
    "in_progress": "in_progress",
    "in progress": "in_progress",
    "completed": "completed",
    "done": "done",
}

APPOINTMENT_ALLOWED_TRANSITIONS = {
    "pending": {"confirmed", "cancelled", "done"},
    "confirmed": {"cancelled", "done"},
    "cancelled": set(),
    "done": set(),
}

PRESCRIPTION_ALLOWED_TRANSITIONS = {
    "pending": {"prepared"},
    "prepared": {"ready"},
    "ready": {"released"},
    "released": set(),
}

MEDICINE_REQUEST_ALLOWED_TRANSITIONS = {
    "pending": {"ready", "rejected"},
    "ready": {"released", "rejected"},
    "released": set(),
    "rejected": set(),
}


def _normalize_status(value: str | None, aliases: dict[str, str], field_name: str) -> str:
    normalized = (value or "").strip().lower()
    if normalized not in aliases:
        raise ValueError(f"Invalid {field_name}")
    return aliases[normalized]


def normalize_appointment_status(value: str | None) -> str:
    return _normalize_status(value, APPOINTMENT_STATUS_ALIASES, "appointment status")


def normalize_prescription_status(value: str | None) -> str:
    return _normalize_status(value, PRESCRIPTION_STATUS_ALIASES, "prescription status")


def normalize_medicine_request_status(value: str | None) -> str:
    return _normalize_status(value, MEDICINE_REQUEST_STATUS_ALIASES, "medicine request status")


def normalize_kiosk_session_status(value: str | None) -> str:
    return _normalize_status(value, KIOSK_SESSION_STATUS_ALIASES, "kiosk session status")
