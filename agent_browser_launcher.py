#!/usr/bin/env python3
"""
Agent Browser Launcher
Launches a browser for agents using stored session data from manual FTD injections.
"""
import asyncio
import json
import sys
import time
import traceback
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse

class AgentBrowserLauncher:
    """Launches browser with stored session data for agents."""
    
    def __init__(self):
        self.session_data = None
        self.lead_info = None

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
            'headless': is_deployment,  # Headless in deployment, visible for agent interaction in development
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
            print("INFO: Running with visible browser for agent interaction (development environment)")

        # Set window size based on session data or use default
        if self.session_data and self.session_data.get('viewport'):
            viewport = self.session_data['viewport']
            config['args'].append(f'--window-size={viewport.get("width", 1280)},{viewport.get("height", 720)}')
        else:
            config['args'].append('--window-size=1280,720')

        return config

    def _apply_session_data(self, page, context):
        """Apply stored session data to the browser context."""
        try:
            if not self.session_data:
                print("WARNING: No session data to apply")
                return False

            print("INFO: Applying stored session data...")

            # Add cookies to the context
            if self.session_data.get('cookies'):
                try:
                    context.add_cookies(self.session_data['cookies'])
                    print(f"INFO: Applied {len(self.session_data['cookies'])} cookies")
                except Exception as e:
                    print(f"WARNING: Failed to apply cookies: {str(e)}")

            # Set localStorage data
            if self.session_data.get('localStorage'):
                try:
                    for key, value in self.session_data['localStorage'].items():
                        page.evaluate(f"localStorage.setItem('{key}', '{value}')")
                    print(f"INFO: Applied {len(self.session_data['localStorage'])} localStorage items")
                except Exception as e:
                    print(f"WARNING: Failed to apply localStorage: {str(e)}")

            # Set sessionStorage data
            if self.session_data.get('sessionStorage'):
                try:
                    for key, value in self.session_data['sessionStorage'].items():
                        page.evaluate(f"sessionStorage.setItem('{key}', '{value}')")
                    print(f"INFO: Applied {len(self.session_data['sessionStorage'])} sessionStorage items")
                except Exception as e:
                    print(f"WARNING: Failed to apply sessionStorage: {str(e)}")

            return True

        except Exception as e:
            print(f"ERROR: Failed to apply session data: {str(e)}")
            traceback.print_exc()
            return False

    def _test_session_validity(self, page):
        """Test if the session is still valid by navigating to the final domain."""
        try:
            if not self.session_data or not self.session_data.get('finalDomain'):
                print("INFO: No final domain to test, proceeding...")
                return True

            final_domain = self.session_data['finalDomain']
            test_url = f"https://{final_domain}"
            
            print(f"INFO: Testing session validity by navigating to: {test_url}")
            
            # Navigate to the final domain
            page.goto(test_url, wait_until="domcontentloaded", timeout=30000)
            
            # Wait a moment for the page to load
            time.sleep(3)
            
            current_url = page.url
            current_domain = urlparse(current_url).netloc
            
            print(f"INFO: Current URL after navigation: {current_url}")
            print(f"INFO: Current domain: {current_domain}")
            
            # Check if we're still on the expected domain (or a related one)
            if final_domain in current_domain or current_domain in final_domain:
                print("SUCCESS: Session appears to be valid!")
                return True
            else:
                print(f"WARNING: Redirected to different domain. Expected: {final_domain}, Got: {current_domain}")
                return False
                
        except Exception as e:
            print(f"WARNING: Failed to test session validity: {str(e)}")
            return False

    def launch_browser_with_session(self, browser_launch_data):
        """Launch browser with stored session data for agent use."""
        browser = None
        try:
            # Extract data
            self.session_data = browser_launch_data.get('sessionData', {})
            self.lead_info = browser_launch_data.get('leadInfo', {})
            
            print("="*60)
            print("AGENT BROWSER LAUNCHER")
            print("="*60)
            print(f"Lead: {self.lead_info.get('firstName', 'N/A')} {self.lead_info.get('lastName', 'N/A')}")
            print(f"Email: {self.lead_info.get('email', 'N/A')}")
            print(f"Phone: {self.lead_info.get('phone', 'N/A')}")
            print(f"Country: {self.lead_info.get('country', 'N/A')}")
            if self.session_data.get('finalDomain'):
                print(f"Target Domain: {self.session_data['finalDomain']}")
            print("="*60)

            with sync_playwright() as p:
                # Launch browser with configuration
                print("INFO: Launching browser for agent...")
                browser = p.chromium.launch(**self._setup_browser_config())
                
                # Create context with device configuration
                context_config = {
                    'locale': "en-US"
                }
                
                # Set viewport if available from session data
                if self.session_data.get('viewport'):
                    viewport = self.session_data['viewport']
                    context_config['viewport'] = {
                        'width': viewport.get('width', 1280),
                        'height': viewport.get('height', 720)
                    }

                # Set user agent if available from session data
                if self.session_data.get('userAgent'):
                    context_config['user_agent'] = self.session_data['userAgent']

                context = browser.new_context(**context_config)
                
                # Create a new page
                page = context.new_page()
                
                # Apply session data (cookies, localStorage, etc.)
                session_applied = self._apply_session_data(page, context)
                
                if session_applied:
                    print("INFO: Session data applied successfully")
                    
                    # Test session validity
                    if self._test_session_validity(page):
                        print("\n" + "="*60)
                        print("SESSION TEST SUCCESSFUL!")
                        print("="*60)
                        print("INSTRUCTIONS FOR AGENT:")
                        print("1. The browser has been opened with the stored session")
                        print("2. You should be automatically logged in to any sites")
                        print("3. You can navigate to Gmail, social media, etc. without passwords")
                        print("4. The session contains the same login state as the injection")
                        print("5. Close the browser when you're done")
                        print("="*60)
                    else:
                        print("\n" + "="*60)
                        print("SESSION TEST WARNING!")
                        print("="*60)
                        print("The session may have expired or be invalid.")
                        print("You can still use the browser, but may need to log in manually.")
                        print("="*60)
                else:
                    print("WARNING: Failed to apply session data, opening blank browser")
                    # Navigate to a default page
                    page.goto("https://google.com", wait_until="domcontentloaded", timeout=30000)

                print("\nINFO: Browser is ready for agent use.")
                print("INFO: Waiting for browser to be closed...")
                
                # Keep the script running until browser is closed
                try:
                    while True:
                        try:
                            # Try to get current URL - this will fail if browser is closed
                            current_url = page.url
                            time.sleep(2)
                        except Exception:
                            # Browser was closed
                            break
                    
                    print("INFO: Browser was closed by agent.")
                    return True
                    
                except KeyboardInterrupt:
                    print("\nINFO: Agent browser session interrupted by user.")
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

def main():
    """Main execution function."""
    if len(sys.argv) < 2:
        print("FATAL: No browser launch data provided.")
        sys.exit(1)

    try:
        browser_launch_data_str = sys.argv[1]
        browser_launch_data = json.loads(browser_launch_data_str)
        print(f"INFO: Processing agent browser launch for lead {browser_launch_data.get('leadId', 'unknown')}")
        
        # Initialize and run agent browser launcher
        launcher = AgentBrowserLauncher()
        success = launcher.launch_browser_with_session(browser_launch_data)

        if success:
            print("INFO: Agent browser session completed successfully")
            return True
        else:
            print("ERROR: Agent browser session failed")
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