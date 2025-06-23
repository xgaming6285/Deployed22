#!/usr/bin/env python3
"""
Test script for manual FTD injection auto-fill functionality
"""
import json
import sys
import os

# Add the current directory to Python path to import the manual injector
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from manual_injector_playwright import ManualLeadInjector

def test_manual_injection():
    """Test the manual injection auto-fill functionality"""
    
    # Test data similar to what would be sent from the backend
    test_data = {
        "leadId": "test_lead_123",
        "firstName": "John",
        "lastName": "Doe", 
        "email": "john.doe@example.com",
        "phone": "1234567890",
        "country": "United States",
        "country_code": "1",
        "targetUrl": "https://ftd-copy.vercel.app/landing",
        "proxy": None
    }
    
    print("Testing Manual FTD Injection Auto-Fill")
    print("=" * 50)
    print(f"Test Data: {json.dumps(test_data, indent=2)}")
    print("=" * 50)
    
    # Initialize the injector
    injector = ManualLeadInjector(proxy_config=None)
    
    # Test the auto-fill functionality
    try:
        success = injector.open_manual_injection_browser(test_data, test_data["targetUrl"])
        
        if success:
            print("✅ Manual injection test completed successfully!")
            return True
        else:
            print("❌ Manual injection test failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error during manual injection test: {str(e)}")
        return False

if __name__ == "__main__":
    test_manual_injection() 