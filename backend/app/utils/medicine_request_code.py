from datetime import datetime
import random

def generate_medicine_request_code():
    year = datetime.now().year
    rand_part = random.randint(10000, 99999)
    return f"MRQ-{year}-{rand_part}"