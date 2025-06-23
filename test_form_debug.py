#!/usr/bin/env python3
import json
import os
from playwright.sync_api import sync_playwright
import time

def test_form_filling():
    """Test script to debug form filling on the landing page"""
    
    target_url = "https://ftd-copy.vercel.app/landing"
    
    test_data = {
        "firstName": "Burke",
        "lastName": "jeannetta", 
        "email": "ketones4you@gmail.com",
        "phone": "481323959",
        "country": "Australia",
        "country_code": "61"
    }
    
    print(f"Testing form filling on: {target_url}")
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    # Detect if we're in a deployment environment (no display available)
    is_deployment = (
        os.getenv('NODE_ENV') == 'production' or
        os.getenv('RENDER') == 'true' or
        os.getenv('VERCEL') == '1' or
        os.getenv('DOCKER') == 'true' or
        not os.getenv('DISPLAY', '').strip()  # No display environment variable
    )
    
    with sync_playwright() as p:
        # Launch browser with environment-appropriate settings
        browser = p.chromium.launch(
            headless=is_deployment, 
            slow_mo=0 if is_deployment else 1000  # No slow motion in deployment
        )
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()
        
        try:
            print("1. Navigating to landing page...")
            page.goto(target_url, wait_until='networkidle', timeout=60000)
            
            print("2. Taking screenshot after page load...")
            page.screenshot(path="debug_page_loaded.png")
            
            print("3. Waiting for form to be ready...")
            time.sleep(5)
            
            print("4. Analyzing page structure...")
            
            # Check if form exists
            forms = page.query_selector_all('form')
            print(f"Found {len(forms)} form elements")
            
            # List all input fields
            inputs = page.query_selector_all('input')
            print(f"Found {len(inputs)} input elements:")
            
            for i, input_elem in enumerate(inputs):
                try:
                    attrs = {
                        'id': input_elem.get_attribute('id') or '',
                        'name': input_elem.get_attribute('name') or '',
                        'data-testid': input_elem.get_attribute('data-testid') or '',
                        'placeholder': input_elem.get_attribute('placeholder') or '',
                        'type': input_elem.get_attribute('type') or '',
                        'visible': input_elem.is_visible(),
                        'enabled': input_elem.is_enabled()
                    }
                    print(f"  Input {i}: {attrs}")
                except Exception as e:
                    print(f"  Input {i}: Error - {str(e)}")
            
            print("5. Attempting to fill form fields...")
            
            # Try to find and fill firstName
            print("Looking for firstName field...")
            first_name_selectors = [
                '#firstName',
                'input[name="firstName"]',
                'input[data-testid="firstName"]'
            ]
            
            first_name_element = None
            for selector in first_name_selectors:
                try:
                    first_name_element = page.wait_for_selector(selector, timeout=5000)
                    if first_name_element and first_name_element.is_visible():
                        print(f"Found firstName using selector: {selector}")
                        break
                except:
                    continue
            
            if first_name_element:
                print("Filling firstName...")
                first_name_element.click()
                first_name_element.fill(test_data["firstName"])
                print("✓ firstName filled successfully")
                
                # Take screenshot after filling firstName
                page.screenshot(path="debug_firstname_filled.png")
                
                # Try lastName
                print("Looking for lastName field...")
                last_name_element = page.wait_for_selector('#lastName', timeout=5000)
                if last_name_element:
                    print("Filling lastName...")
                    last_name_element.click()
                    last_name_element.fill(test_data["lastName"])
                    print("✓ lastName filled successfully")
                
                # Try email
                print("Looking for email field...")
                email_element = page.wait_for_selector('#email', timeout=5000)
                if email_element:
                    print("Filling email...")
                    email_element.click()
                    email_element.fill(test_data["email"])
                    print("✓ email filled successfully")
                
                # Try phone
                print("Looking for phone field...")
                phone_element = page.wait_for_selector('#phone', timeout=5000)
                if phone_element:
                    print("Filling phone...")
                    phone_element.click()
                    phone_element.fill(test_data["phone"])
                    print("✓ phone filled successfully")
                
                # Take screenshot after filling all fields
                page.screenshot(path="debug_all_fields_filled.png")
                
                # Try to submit
                print("Looking for submit button...")
                submit_element = page.wait_for_selector('button[type="submit"]', timeout=5000)
                if submit_element:
                    print("Setting injection mode...")
                    page.evaluate("window.localStorage.setItem('isInjectionMode', 'true')")
                    
                    print("Clicking submit button...")
                    submit_element.click()
                    
                    # Wait for success message
                    try:
                        success_msg = page.wait_for_selector('text="Thank You!"', timeout=10000)
                        if success_msg:
                            print("✓ Form submitted successfully - Thank You message found")
                            page.screenshot(path="debug_success.png")
                            return True
                        else:
                            print("✗ No success message found")
                            page.screenshot(path="debug_no_success.png")
                            return False
                    except Exception as e:
                        print(f"✗ Error waiting for success message: {str(e)}")
                        page.screenshot(path="debug_submit_error.png")
                        return False
                else:
                    print("✗ Could not find submit button")
                    return False
            else:
                print("✗ Could not find firstName field")
                return False
                
        except Exception as e:
            print(f"Error during test: {str(e)}")
            page.screenshot(path="debug_error.png")
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    success = test_form_filling()
    if success:
        print("\n✅ Form filling test PASSED")
    else:
        print("\n❌ Form filling test FAILED") 