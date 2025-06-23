# Selenium Automation Guide for Landing Page

## 🎯 **Overview**
This guide provides comprehensive information for automating the landing page form (`/landing`) using Selenium WebDriver.

## 🔍 **Form Element Selectors**

### **By ID**
```python
# Form container
form = driver.find_element(By.ID, "landingForm")

# Input fields
first_name = driver.find_element(By.ID, "firstName")
last_name = driver.find_element(By.ID, "lastName")
email = driver.find_element(By.ID, "email")
prefix = driver.find_element(By.ID, "prefix")
phone = driver.find_element(By.ID, "phone")
submit_btn = driver.find_element(By.ID, "submitBtn")
```

### **By Data-TestID** (Recommended for testing)
```python
# Input fields
first_name = driver.find_element(By.CSS_SELECTOR, "[data-testid='firstName']")
last_name = driver.find_element(By.CSS_SELECTOR, "[data-testid='lastName']")
email = driver.find_element(By.CSS_SELECTOR, "[data-testid='email']")
prefix = driver.find_element(By.CSS_SELECTOR, "[data-testid='prefix']")
phone = driver.find_element(By.CSS_SELECTOR, "[data-testid='phone']")
submit_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='submitBtn']")
```

### **By Name Attribute**
```python
first_name = driver.find_element(By.NAME, "firstName")
last_name = driver.find_element(By.NAME, "lastName")
email = driver.find_element(By.NAME, "email")
prefix = driver.find_element(By.NAME, "prefix")
phone = driver.find_element(By.NAME, "phone")
```

## 🚀 **Complete Python Selenium Script**

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import time

class LandingPageAutomation:
    def __init__(self, base_url="http://localhost:3000"):
        self.driver = webdriver.Chrome()  # or your preferred driver
        self.base_url = base_url
        self.wait = WebDriverWait(self.driver, 10)
    
    def navigate_to_landing_page(self):
        """Navigate to the landing page"""
        self.driver.get(f"{self.base_url}/landing")
        # Wait for form to load
        self.wait.until(EC.presence_of_element_located((By.ID, "landingForm")))
    
    def fill_form(self, first_name, last_name, email, country_code, phone):
        """Fill out the landing page form"""
        
        # Fill first name
        first_name_field = self.wait.until(
            EC.element_to_be_clickable((By.ID, "firstName"))
        )
        first_name_field.clear()
        first_name_field.send_keys(first_name)
        
        # Fill last name
        last_name_field = self.driver.find_element(By.ID, "lastName")
        last_name_field.clear()
        last_name_field.send_keys(last_name)
        
        # Fill email
        email_field = self.driver.find_element(By.ID, "email")
        email_field.clear()
        email_field.send_keys(email)
        
        # Select country code
        self.select_country_code(country_code)
        
        # Fill phone number
        phone_field = self.driver.find_element(By.ID, "phone")
        phone_field.clear()
        phone_field.send_keys(phone)
    
    def select_country_code(self, country_code):
        """Select country code from dropdown"""
        # Click on the select dropdown
        prefix_dropdown = self.driver.find_element(By.ID, "prefix")
        prefix_dropdown.click()
        
        # Wait for dropdown options to appear
        time.sleep(1)
        
        # Select the specific country code
        option_selector = f"[data-testid='prefix-option-{country_code.replace('+', '')}']"
        option = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, option_selector))
        )
        option.click()
    
    def submit_form(self):
        """Submit the form"""
        submit_btn = self.driver.find_element(By.ID, "submitBtn")
        submit_btn.click()
        
        # Wait for submission to complete (either success or error)
        try:
            # Check for success state (Thank You page)
            self.wait.until(lambda driver: "Thank You!" in driver.page_source)
            return "success"
        except:
            # Check for error message
            try:
                error_element = self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".MuiAlert-message"))
                )
                return f"error: {error_element.text}"
            except:
                return "unknown"
    
    def fill_and_submit(self, data):
        """Complete automation: navigate, fill, and submit"""
        try:
            self.navigate_to_landing_page()
            self.fill_form(
                first_name=data["firstName"],
                last_name=data["lastName"],
                email=data["email"],
                country_code=data["countryCode"],
                phone=data["phone"]
            )
            result = self.submit_form()
            return result
        except Exception as e:
            return f"error: {str(e)}"
    
    def close(self):
        """Close the browser"""
        self.driver.quit()

# Usage Example
if __name__ == "__main__":
    automation = LandingPageAutomation()
    
    # Sample data
    test_data = {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "countryCode": "+1",
        "phone": "1234567890"
    }
    
    result = automation.fill_and_submit(test_data)
    print(f"Result: {result}")
    
    automation.close()
```

## 🔧 **Alternative Selectors**

### **XPath Selectors**
```python
# Using XPath
first_name = driver.find_element(By.XPATH, "//input[@id='firstName']")
last_name = driver.find_element(By.XPATH, "//input[@id='lastName']")
email = driver.find_element(By.XPATH, "//input[@id='email']")
phone = driver.find_element(By.XPATH, "//input[@id='phone']")
submit_btn = driver.find_element(By.XPATH, "//button[@id='submitBtn']")
```

### **CSS Selectors**
```python
first_name = driver.find_element(By.CSS_SELECTOR, "input#firstName")
last_name = driver.find_element(By.CSS_SELECTOR, "input#lastName")
email = driver.find_element(By.CSS_SELECTOR, "input#email")
phone = driver.find_element(By.CSS_SELECTOR, "input#phone")
submit_btn = driver.find_element(By.CSS_SELECTOR, "button#submitBtn")
```

## 📋 **Available Country Codes**
The dropdown includes these country codes (use the code without + for data-testid):

- `+1` (US/Canada) → `data-testid="prefix-option-1"`
- `+44` (UK) → `data-testid="prefix-option-44"`
- `+49` (Germany) → `data-testid="prefix-option-49"`
- `+33` (France) → `data-testid="prefix-option-33"`
- `+39` (Italy) → `data-testid="prefix-option-39"`
- `+34` (Spain) → `data-testid="prefix-option-34"`
- `+31` (Netherlands) → `data-testid="prefix-option-31"`
- And many more...

## ⚠️ **Wait Strategies**

### **Explicit Waits (Recommended)**
```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

wait = WebDriverWait(driver, 10)

# Wait for element to be present
element = wait.until(EC.presence_of_element_located((By.ID, "firstName")))

# Wait for element to be clickable
element = wait.until(EC.element_to_be_clickable((By.ID, "submitBtn")))

# Wait for text to be present
wait.until(EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "Thank You!"))
```

## 🧪 **Testing Scenarios**

### **Successful Submission**
```python
valid_data = {
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john.doe@example.com",
    "countryCode": "+1",
    "phone": "1234567890"
}
```

### **Error Testing**
```python
# Invalid email
invalid_email_data = {
    "firstName": "John",
    "lastName": "Doe",
    "email": "invalid-email",
    "countryCode": "+1", 
    "phone": "1234567890"
}

# Duplicate email (if exists in database)
duplicate_data = {
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "existing@example.com",
    "countryCode": "+44",
    "phone": "9876543210"
}
```

## 📱 **Mobile Testing**
```python
# For mobile testing
mobile_emulation = {"deviceName": "iPhone X"}
chrome_options = webdriver.ChromeOptions()
chrome_options.add_experimental_option("mobileEmulation", mobile_emulation)
driver = webdriver.Chrome(options=chrome_options)
```

## 🔄 **Batch Processing**
```python
def process_multiple_leads(leads_data):
    """Process multiple leads in batch"""
    automation = LandingPageAutomation()
    results = []
    
    for lead_data in leads_data:
        result = automation.fill_and_submit(lead_data)
        results.append({
            "email": lead_data["email"],
            "result": result
        })
        
        # Small delay between submissions
        time.sleep(2)
    
    automation.close()
    return results
```

## 🛠️ **Debugging Tips**

1. **Take Screenshots**: `driver.save_screenshot("debug.png")`
2. **Get Page Source**: `print(driver.page_source)`
3. **Check Element Visibility**: `element.is_displayed()`
4. **Get Element Text**: `element.text`
5. **Wait for Animations**: Add `time.sleep(1)` after dropdown clicks

## 🚨 **Error Handling**
```python
try:
    automation.fill_and_submit(data)
except TimeoutException:
    print("Element not found within timeout")
except NoSuchElementException:
    print("Element not found")
except WebDriverException as e:
    print(f"WebDriver error: {e}")
```

## 📝 **Form Validation Messages**
The form includes client-side validation. Common error messages:
- "First name is required"
- "Valid email is required"
- "Country code is required" 
- "Phone number must contain only digits"
- "A lead with this email already exists" (server-side)

## 🎯 **Best Practices**
1. Use `data-testid` selectors for stability
2. Always use explicit waits
3. Handle both success and error states
4. Take screenshots for debugging
5. Use try-catch blocks for error handling
6. Clear fields before entering new data
7. Wait for dropdown animations to complete 