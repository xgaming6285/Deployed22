#!/usr/bin/env python3

import json
import subprocess
import sys

# Test lead data
lead_data = {
    "firstName": "Somjai",
    "lastName": "Irvine", 
    "email": "somjaiirvine@gmail.com",
    "phone": "487785528",
    "country": "Australia",
    "country_code": "61",
    "landingPage": "https://ftd-copy.vercel.app/landing",
    "password": "TPvBwkO8"
}

# Convert to JSON string
lead_json = json.dumps(lead_data)

print(f"Testing injection with lead data: {lead_json}")

# Run the injector script
try:
    result = subprocess.run([
        sys.executable, 
        "injector_playwright.py", 
        lead_json
    ], capture_output=True, text=True, timeout=300)
    
    print(f"Exit code: {result.returncode}")
    print(f"STDOUT:\n{result.stdout}")
    print(f"STDERR:\n{result.stderr}")
    
except subprocess.TimeoutExpired:
    print("Script timed out after 5 minutes")
except Exception as e:
    print(f"Error running script: {e}") 