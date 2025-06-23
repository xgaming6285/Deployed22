import asyncio
import json
import sys
import time
import random
import requests
import io
import traceback
import os
import string
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse

# Fix for Windows encoding issues - ensure everything uses utf-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Constants
MAX_RETRIES = 3
RETRY_DELAY = 2

class ManualLeadInjector:
    """Manual lead injector that opens browser and auto-fills form fields."""
    
    def __init__(self, proxy_config=None):
        self.proxy_config = proxy_config
        self.target_url = None
        self.session_data = {}

    def _take_screenshot(self, page, name):
        """Take a screenshot for debugging purposes."""
        try:
            screenshots_dir = Path("screenshots")
            screenshots_dir.mkdir(exist_ok=True)
            screenshot_path = screenshots_dir / f"{name}_{int(time.time())}.png"
            page.screenshot(path=str(screenshot_path))
            print(f"INFO: Screenshot saved: {screenshot_path}")
        except Exception as e:
            print(f"WARNING: Could not take screenshot '{name}': {str(e)}")

    def _setup_browser_config(self):
        """Setup browser configuration."""
        # Detect if we're in a deployment environment (no display available)
        is_deployment = (
            os.getenv('NODE_ENV') == 'production' or
            os.getenv('RENDER') == 'true' or
            os.getenv('VERCEL') == '1' or
            os.getenv('DOCKER') == 'true' or
            not os.getenv('DISPLAY', '').strip()  # No display environment variable
        )
        
        config = {
            'headless': is_deployment,  # Headless in deployment, visible for manual interaction in development
            'args': [
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--no-first-run',
                '--disable-default-apps',
                '--disable-infobars',
                '--disable-dev-shm-usage',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-field-trial-config',
                '--disable-back-forward-cache',
                '--disable-ipc-flooding-protection',
                '--window-size=428,926',  # iPhone 14 Pro Max size
            ]
        }

        # Add additional args for headless environments
        if is_deployment:
            config["args"].extend([
                "--disable-features=TranslateUI",
                "--disable-extensions",
                "--disable-plugins"
            ])
            print("INFO: Running in headless mode (deployment environment detected)")
        else:
            print("INFO: Running with visible browser for manual interaction (development environment)")

        # Add proxy configuration if available
        if self.proxy_config:
            config['proxy'] = {
                'server': self.proxy_config['server'],
                'username': self.proxy_config['username'],
                'password': self.proxy_config['password']
            }
            print(f"INFO: Using proxy server: {self.proxy_config['server']}")

        return config

    def _capture_session_data(self, page):
        """Capture browser session data including cookies, localStorage, etc."""
        try:
            print("INFO: Capturing session data...")
            
            # Get cookies
            cookies = page.context.cookies()
            
            # Get localStorage data
            local_storage = page.evaluate("() => { return {...localStorage}; }")
            
            # Get sessionStorage data
            session_storage = page.evaluate("() => { return {...sessionStorage}; }")
            
            # Get user agent
            user_agent = page.evaluate("() => navigator.userAgent")
            
            # Get viewport size
            viewport = page.evaluate("() => { return { width: window.innerWidth, height: window.innerHeight }; }")
            
            # Get current URL (final domain)
            current_url = page.url
            final_domain = urlparse(current_url).netloc
            
            self.session_data = {
                'cookies': cookies,
                'localStorage': local_storage,
                'sessionStorage': session_storage,
                'userAgent': user_agent,
                'viewport': viewport,
                'finalDomain': final_domain,
                'capturedAt': time.time()
            }
            
            print(f"INFO: Session data captured successfully")
            print(f"INFO: Cookies: {len(cookies)} items")
            print(f"INFO: LocalStorage: {len(local_storage)} items")
            print(f"INFO: SessionStorage: {len(session_storage)} items")
            print(f"INFO: Final domain: {final_domain}")
            
            return True
            
        except Exception as e:
            print(f"ERROR: Failed to capture session data: {str(e)}")
            traceback.print_exc()
            return False

    def _save_session_to_backend(self, lead_data):
        """Save captured session data to backend."""
        try:
            if not self.session_data:
                print("WARNING: No session data to save")
                return False
                
            # Prepare data for backend
            backend_data = {
                'leadId': lead_data.get('leadId'),
                'sessionData': self.session_data
            }
            
            # Send to backend API (this would be the actual API call)
            print("INFO: Session data prepared for backend storage")
            print(f"SESSION_DATA:{json.dumps(backend_data, default=str)}")
            
            return True
            
        except Exception as e:
            print(f"ERROR: Failed to save session data to backend: {str(e)}")
            return False

    def _human_like_typing(self, element, text):
        """Type text in a human-like manner with random delays."""
        if not text:
            return
        
        # Clear the field first
        element.click()
        element.fill('')  # Clear any existing content
        
        # Type character by character with random delays
        for char in str(text):
            element.type(char)
            time.sleep(random.uniform(0.05, 0.15))  # Random delay between keystrokes

    def _select_country_code(self, page, country_code):
        """Select country code from the prefix dropdown."""
        try:
            # Ensure country code has + prefix
            if not country_code.startswith('+'):
                country_code = f"+{country_code}"
            
            print(f"INFO: Selecting country code: {country_code}")
            
            # Click on the select dropdown to open it
            prefix_select = page.wait_for_selector('#prefix', timeout=10000)
            prefix_select.click()
            
            # Wait a moment for dropdown to open
            time.sleep(0.5)
            
            # Try to find and click the option with the specific country code
            # The dropdown options have data-testid attributes like "prefix-option-1", "prefix-option-44", etc.
            code_without_plus = country_code.replace('+', '')
            option_selector = f'[data-testid="prefix-option-{code_without_plus}"]'
            
            try:
                option = page.wait_for_selector(option_selector, timeout=5000)
                option.click()
                print(f"INFO: Successfully selected country code: {country_code}")
                return True
            except Exception as e:
                print(f"WARNING: Could not find exact option for {country_code}, trying alternative method")
                
                # Alternative: Look for any option containing the country code
                options = page.query_selector_all('[role="option"]')
                for option in options:
                    option_text = option.inner_text()
                    if country_code in option_text:
                        option.click()
                        print(f"INFO: Selected country code using alternative method: {country_code}")
                        return True
                
                print(f"ERROR: Could not select country code: {country_code}")
                return False
                
        except Exception as e:
            print(f"ERROR: Failed to select country code {country_code}: {str(e)}")
            return False

    def _auto_fill_form(self, page, lead_data):
        """Auto-fill the form fields with lead data."""
        try:
            print("\n" + "="*50)
            print("AUTO-FILLING FORM WITH FTD LEAD DATA:")
            print("="*50)
            
            # Wait for the form to be fully loaded
            page.wait_for_selector('#landingForm', timeout=15000)
            time.sleep(1)  # Additional wait for form to stabilize
            
            # Fill First Name
            print(f"INFO: Filling First Name: {lead_data.get('firstName', 'N/A')}")
            first_name_field = page.wait_for_selector('#firstName', timeout=10000)
            self._human_like_typing(first_name_field, lead_data.get('firstName', ''))
            
            # Fill Last Name
            print(f"INFO: Filling Last Name: {lead_data.get('lastName', 'N/A')}")
            last_name_field = page.wait_for_selector('#lastName', timeout=10000)
            self._human_like_typing(last_name_field, lead_data.get('lastName', ''))
            
            # Fill Email
            print(f"INFO: Filling Email: {lead_data.get('email', 'N/A')}")
            email_field = page.wait_for_selector('#email', timeout=10000)
            self._human_like_typing(email_field, lead_data.get('email', ''))
            
            # Select Country Code (Prefix)
            country_code = lead_data.get('country_code', '1')
            print(f"INFO: Selecting Country Code: +{country_code}")
            self._select_country_code(page, country_code)
            
            # Fill Phone Number
            print(f"INFO: Filling Phone: {lead_data.get('phone', 'N/A')}")
            phone_field = page.wait_for_selector('#phone', timeout=10000)
            self._human_like_typing(phone_field, lead_data.get('phone', ''))
            
            print("="*50)
            print("FORM AUTO-FILL COMPLETED!")
            print("="*50)
            print("INSTRUCTIONS:")
            print("1. Review the auto-filled information above")
            print("2. Make any necessary corrections manually")
            print("3. Click the submit button to submit the form")
            print("4. Wait for any redirects to complete")
            print("5. The session will be automatically captured")
            print("6. Close this browser window when done")
            print("="*50)
            
            return True
            
        except Exception as e:
            print(f"ERROR: Failed to auto-fill form: {str(e)}")
            traceback.print_exc()
            return False

    def _wait_for_submission_and_capture(self, page, lead_data):
        """Wait for form submission and capture session data."""
        try:
            print("\nINFO: Monitoring for form submission...")
            
            # Monitor for URL changes that indicate form submission
            initial_url = page.url
            last_url = initial_url
            
            while True:
                try:
                    current_url = page.url
                    
                    # Check if URL has changed (indicating form submission/redirect)
                    if current_url != last_url:
                        print(f"INFO: URL changed from {last_url} to {current_url}")
                        last_url = current_url
                        
                        # Wait a bit for the page to fully load
                        time.sleep(2)
                        
                        # Check if we're on a different domain (successful submission)
                        initial_domain = urlparse(initial_url).netloc
                        current_domain = urlparse(current_url).netloc
                        
                        if current_domain != initial_domain:
                            print(f"INFO: Form submission detected! Redirected to: {current_domain}")
                            
                            # Capture session data after successful submission
                            if self._capture_session_data(page):
                                # Save session data to backend
                                self._save_session_to_backend(lead_data)
                                
                                print("SUCCESS: Session data captured and saved!")
                                print("INFO: You can now close the browser window.")
                                break
                            else:
                                print("WARNING: Failed to capture session data")
                    
                    # Small delay before checking again
                    time.sleep(1)
                    
                except Exception as e:
                    # Browser might have been closed
                    if "Target page, context or browser has been closed" in str(e):
                        print("INFO: Browser was closed manually.")
                        break
                    else:
                        print(f"WARNING: Error monitoring page: {str(e)}")
                        time.sleep(1)
                        
        except Exception as e:
            print(f"ERROR: Error in submission monitoring: {str(e)}")
            traceback.print_exc()

    def open_manual_injection_browser(self, lead_data, target_url):
        """Open browser for manual lead injection with auto-filled form."""
        browser = None
        try:
            # Store target URL for proxy configuration
            self.target_url = target_url
            
            # Get proxy configuration
            if not self.proxy_config:
                print("WARNING: No proxy configuration available. Proceeding without proxy for testing.")
            
            with sync_playwright() as p:
                # Launch browser with configuration
                print("INFO: Launching browser for manual injection...")
                browser = p.chromium.launch(**self._setup_browser_config())
                
                # Get fingerprint configuration
                fingerprint = lead_data.get('fingerprint')
                if fingerprint:
                    print(f"INFO: Using device fingerprint: {fingerprint.get('deviceId', 'unknown')} ({fingerprint.get('deviceType', 'unknown')})")
                    device_config = self._create_device_config_from_fingerprint(fingerprint)
                else:
                    print("WARNING: No fingerprint configuration provided, using default iPhone 14 Pro Max settings")
                    # Use default iPhone 14 Pro Max settings as fallback
                    device_config = {
                        'screen': {
                            'width': 428,
                            'height': 926
                        },
                        'viewport': {
                            'width': 428,
                            'height': 926
                        },
                        'device_scale_factor': 3,
                        'is_mobile': True,
                        'has_touch': True,
                        'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/605.1 NAVER(inapp; search; 2000; 12.12.50; 14PROMAX)',
                    }
                
                # Create context with device configuration
                context = browser.new_context(
                    **device_config,
                    locale="en-US"
                )
                
                # Create a new page
                page = context.new_page()
                
                # Apply fingerprint properties if available
                if fingerprint:
                    self._apply_fingerprint_to_page(page, fingerprint)
                
                # Set content size to ensure proper rendering
                page.evaluate("""() => {
                    const meta = document.createElement('meta');
                    meta.name = 'viewport';
                    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                    document.head.appendChild(meta);
                }""")

                # Navigate to target URL with retries
                print(f"INFO: Navigating to target URL: {target_url}")
                success = False
                for attempt in range(MAX_RETRIES):
                    try:
                        page.goto(target_url, wait_until="domcontentloaded", timeout=30000)
                        success = True
                        break
                    except Exception as e:
                        print(f"WARNING: Failed to navigate on attempt {attempt+1}/{MAX_RETRIES}: {str(e)}")
                        if attempt < MAX_RETRIES - 1:
                            print(f"Retrying in {RETRY_DELAY} seconds...")
                            time.sleep(RETRY_DELAY)

                if not success:
                    print("ERROR: Failed to navigate to target URL after multiple attempts")
                    return False

                # Take a screenshot after page load
                self._take_screenshot(page, "manual_injection_page_loaded")

                # Set injection mode flag
                page.evaluate("window.localStorage.setItem('isInjectionMode', 'true')")
                print("INFO: Set injection mode flag for the landing page")

                # Auto-fill the form with FTD lead data
                auto_fill_success = self._auto_fill_form(page, lead_data)
                
                if auto_fill_success:
                    # Take a screenshot after auto-fill
                    self._take_screenshot(page, "manual_injection_auto_filled")
                    
                    # Start monitoring for form submission and session capture
                    self._wait_for_submission_and_capture(page, lead_data)
                else:
                    print("WARNING: Auto-fill failed, but continuing with manual mode")
                    # Display lead information for manual reference as fallback
                    print("\n" + "="*50)
                    print("LEAD INFORMATION FOR MANUAL ENTRY (FALLBACK):")
                    print("="*50)
                    print(f"First Name: {lead_data.get('firstName', 'N/A')}")
                    print(f"Last Name: {lead_data.get('lastName', 'N/A')}")
                    print(f"Email: {lead_data.get('email', 'N/A')}")
                    print(f"Phone: {lead_data.get('phone', 'N/A')}")
                    print(f"Country: {lead_data.get('country', 'N/A')}")
                    print(f"Country Code: +{lead_data.get('country_code', 'N/A')}")
                    print("="*50)
                    
                    # Wait for manual browser close
                    try:
                        while True:
                            try:
                                current_url = page.url
                                time.sleep(2)
                            except Exception:
                                break
                    except KeyboardInterrupt:
                        print("\nINFO: Manual injection interrupted by user.")

                print("INFO: Manual injection session completed.")
                return True
                
        except Exception as e:
            print(f"ERROR: Browser initialization failed - {str(e)}")
            traceback.print_exc()
            return False
        finally:
            if browser:
                try:
                    browser.close()
                except:
                    pass

    def _create_device_config_from_fingerprint(self, fingerprint):
        """Create Playwright device configuration from fingerprint data."""
        screen = fingerprint.get('screen', {})
        navigator = fingerprint.get('navigator', {})
        mobile = fingerprint.get('mobile', {})
        
        return {
            'screen': {
                'width': screen.get('width', 428),
                'height': screen.get('height', 926)
            },
            'viewport': {
                'width': screen.get('availWidth', screen.get('width', 428)),
                'height': screen.get('availHeight', screen.get('height', 926))
            },
            'device_scale_factor': screen.get('devicePixelRatio', 1),
            'is_mobile': mobile.get('isMobile', False),
            'has_touch': navigator.get('maxTouchPoints', 0) > 0,
            'user_agent': navigator.get('userAgent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        }

    def _apply_fingerprint_to_page(self, page, fingerprint):
        """Apply fingerprint properties to the page context."""
        try:
            # Set injection mode flag first (most important)
            page.evaluate("() => { localStorage.setItem('isInjectionMode', 'true'); }")
            print("INFO: Set injection mode flag for the landing page")
            
            # Try to apply fingerprint properties (non-critical if it fails)
            navigator = fingerprint.get('navigator', {})
            screen = fingerprint.get('screen', {})
            
            # Simple approach - just set the essential properties
            platform = json.dumps(navigator.get('platform', 'Win32'))
            user_agent = json.dumps(navigator.get('userAgent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'))
            
            page.evaluate(f"""() => {{
                try {{
                    // Set basic navigator properties
                    Object.defineProperty(navigator, 'platform', {{
                        get: () => {platform}
                    }});
                    
                    // Set injection mode flag (redundant but important)
                    localStorage.setItem('isInjectionMode', 'true');
                    
                    console.log('Fingerprint properties applied successfully');
                }} catch (error) {{
                    console.error('Error applying fingerprint:', error);
                    // Ensure injection mode is still set
                    localStorage.setItem('isInjectionMode', 'true');
                }}
            }};""")
            
            print(f"INFO: Applied fingerprint properties for device: {fingerprint.get('deviceId', 'unknown')}")
            
        except Exception as e:
            print(f"WARNING: Failed to apply fingerprint properties: {str(e)}")
            # Always ensure injection mode is set
            try:
                page.evaluate("() => { localStorage.setItem('isInjectionMode', 'true'); }")
                print("INFO: Set injection mode flag despite fingerprint error")
            except Exception as e2:
                print(f"WARNING: Could not set injection mode flag: {str(e2)}")

def main():
    """Main execution function."""
    if len(sys.argv) < 2:
        print("FATAL: No input JSON provided.")
        sys.exit(1)

    try:
        injection_data_str = sys.argv[1]
        injection_data = json.loads(injection_data_str)
        print(f"INFO: Processing manual injection data for lead {injection_data.get('leadId', 'unknown')}")
        
        # Extract proxy configuration from injection data
        proxy_config = injection_data.get('proxy')
        if not proxy_config:
            print("WARNING: No proxy configuration provided. Proceeding without proxy for testing.")
            proxy_config = None

        # Get target URL
        target_url = injection_data.get('targetUrl', "https://ftd-copy.vercel.app/landing")
        print(f"INFO: Target URL: {target_url}")

        # Initialize and run manual injector
        injector = ManualLeadInjector(proxy_config)
        success = injector.open_manual_injection_browser(injection_data, target_url)

        if success:
            print("INFO: Manual injection session completed successfully")
            return True
        else:
            print("ERROR: Manual injection session failed")
            return False

    except json.JSONDecodeError:
        print(f"FATAL: Invalid JSON provided")
        sys.exit(1)
    except Exception as e:
        try:
            error_msg = str(e)
            print(f"FATAL: An error occurred during execution: {error_msg}")
            traceback.print_exc()
        except UnicodeEncodeError:
            print(f"FATAL: An error occurred during execution (encoding error when displaying message)")
        return False

if __name__ == "__main__":
    main() 