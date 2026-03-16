from datetime import datetime
import random

def generate_appointment_code():
    year = datetime.now().year
    rand_part = random.randint(10000, 99999)
    return f"APT-{year}-{rand_part}"