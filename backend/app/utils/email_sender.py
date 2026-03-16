import os
import requests
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "VitalKey")


def send_email_otp(to_email: str, otp_code: str):
    if not BREVO_API_KEY:
        raise Exception("BREVO_API_KEY is missing in .env")

    if not BREVO_SENDER_EMAIL:
        raise Exception("BREVO_SENDER_EMAIL is missing in .env")

    url = "https://api.brevo.com/v3/smtp/email"

    html_content = f"""
    <html>
      <body>
        <h2>VitalKey OTP Verification</h2>
        <p>Your OTP code is:</p>
        <h1>{otp_code}</h1>
        <p>This code is valid for 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </body>
    </html>
    """

    payload = {
        "sender": {
            "name": BREVO_SENDER_NAME,
            "email": BREVO_SENDER_EMAIL
        },
        "to": [
            {
                "email": to_email
            }
        ],
        "subject": "VitalKey OTP Verification",
        "htmlContent": html_content
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    response = requests.post(url, json=payload, headers=headers, timeout=15)

    print("BREVO STATUS:", response.status_code)
    print("BREVO BODY:", response.text)

    response.raise_for_status()
    return response.json()