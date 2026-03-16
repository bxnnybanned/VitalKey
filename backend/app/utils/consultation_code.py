from datetime import datetime
import random

def generate_consultation_code():
    year = datetime.now().year
    rand_part = random.randint(10000, 99999)
    return f"CON-{year}-{rand_part}"