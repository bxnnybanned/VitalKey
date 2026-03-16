from datetime import datetime
import random

def generate_patient_id():
    year = datetime.now().year
    rand_part = random.randint(10000, 99999)
    return f"VK-{year}-{rand_part}"