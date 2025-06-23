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

# Mappings for country names to ISO codes and phone codes
COUNTRY_TO_PHONE_CODE = {
    # Major countries
    "United States": "1",
    "United Kingdom": "44",
    "Canada": "1",
    "Australia": "61",
    "Germany": "49",
    "France": "33",
    "Italy": "39",
    "Spain": "34",
    "Netherlands": "31",
    "Belgium": "32",
    "Switzerland": "41",
    "Austria": "43",
    "Sweden": "46",
    "Norway": "47",
    "Denmark": "45",
    "Finland": "358",
    "Poland": "48",
    "Czech Republic": "420",
    "Hungary": "36",
    "Romania": "40",
    "Bulgaria": "359",
    "Greece": "30",
    "Portugal": "351",
    "Ireland": "353",
    "Luxembourg": "352",
    "Malta": "356",
    "Cyprus": "357",
    "Estonia": "372",
    "Latvia": "371",
    "Lithuania": "370",
    "Slovakia": "421",
    "Slovenia": "386",
    "Croatia": "385",
    "Serbia": "381",
    "Montenegro": "382",
    "Bosnia and Herzegovina": "387",
    "North Macedonia": "389",
    "Albania": "355",
    "Moldova": "373",
    "Ukraine": "380",
    "Belarus": "375",
    "Russia": "7",
    
    # Asia-Pacific
    "China": "86",
    "Japan": "81",
    "South Korea": "82",
    "Korea": "82",
    "India": "91",
    "Indonesia": "62",
    "Thailand": "66",
    "Vietnam": "84",
    "Malaysia": "60",
    "Singapore": "65",
    "Philippines": "63",
    "Taiwan": "886",
    "Hong Kong": "852",
    "Macau": "853",
    "Mongolia": "976",
    "Kazakhstan": "7",
    "Uzbekistan": "998",
    "Turkmenistan": "993",
    "Kyrgyzstan": "996",
    "Tajikistan": "992",
    "Afghanistan": "93",
    "Pakistan": "92",
    "Bangladesh": "880",
    "Sri Lanka": "94",
    "Myanmar": "95",
    "Cambodia": "855",
    "Laos": "856",
    "Brunei": "673",
    "Nepal": "977",
    "Bhutan": "975",
    "Maldives": "960",
    "New Zealand": "64",
    
    # Middle East
    "Turkey": "90",
    "Israel": "972",
    "Palestine": "970",
    "Palestinian Territory": "970",
    "Lebanon": "961",
    "Syria": "963",
    "Jordan": "962",
    "Iraq": "964",
    "Iran": "98",
    "Saudi Arabia": "966",
    "Kuwait": "965",
    "Bahrain": "973",
    "Qatar": "974",
    "United Arab Emirates": "971",
    "UAE": "971",
    "Oman": "968",
    "Yemen": "967",
    "Georgia": "995",
    "Armenia": "374",
    "Azerbaijan": "994",
    
    # Africa
    "Egypt": "20",
    "Libya": "218",
    "Tunisia": "216",
    "Algeria": "213",
    "Morocco": "212",
    "Sudan": "249",
    "South Sudan": "211",
    "Ethiopia": "251",
    "Kenya": "254",
    "Uganda": "256",
    "Tanzania": "255",
    "Rwanda": "250",
    "Burundi": "257",
    "Nigeria": "234",
    "Ghana": "233",
    "South Africa": "27",
    "Namibia": "264",
    "Botswana": "267",
    "Zimbabwe": "263",
    "Zambia": "260",
    "Malawi": "265",
    "Mozambique": "258",
    "Madagascar": "261",
    "Mauritius": "230",
    "Seychelles": "248",
    
    # Americas
    "Mexico": "52",
    "Guatemala": "502",
    "Belize": "501",
    "El Salvador": "503",
    "Honduras": "504",
    "Nicaragua": "505",
    "Costa Rica": "506",
    "Panama": "507",
    "Colombia": "57",
    "Venezuela": "58",
    "Guyana": "592",
    "Suriname": "597",
    "French Guiana": "594",
    "Brazil": "55",
    "Ecuador": "593",
    "Peru": "51",
    "Bolivia": "591",
    "Paraguay": "595",
    "Uruguay": "598",
    "Argentina": "54",
    "Chile": "56",
}

COUNTRY_TO_ISO_CODE = {
    # Major countries
    "United States": "us",
    "United Kingdom": "gb",
    "Canada": "ca",
    "Australia": "au",
    "Germany": "de",
    "France": "fr",
    "Italy": "it",
    "Spain": "es",
    "Netherlands": "nl",
    "Belgium": "be",
    "Switzerland": "ch",
    "Austria": "at",
    "Sweden": "se",
    "Norway": "no",
    "Denmark": "dk",
    "Finland": "fi",
    "Poland": "pl",
    "Czech Republic": "cz",
    "Hungary": "hu",
    "Romania": "ro",
    "Bulgaria": "bg",
    "Greece": "gr",
    "Portugal": "pt",
    "Ireland": "ie",
    "Luxembourg": "lu",
    "Malta": "mt",
    "Cyprus": "cy",
    "Estonia": "ee",
    "Latvia": "lv",
    "Lithuania": "lt",
    "Slovakia": "sk",
    "Slovenia": "si",
    "Croatia": "hr",
    "Serbia": "rs",
    "Montenegro": "me",
    "Bosnia and Herzegovina": "ba",
    "North Macedonia": "mk",
    "Albania": "al",
    "Moldova": "md",
    "Ukraine": "ua",
    "Belarus": "by",
    "Russia": "ru",
    
    # Asia-Pacific
    "China": "cn",
    "Japan": "jp",
    "South Korea": "kr",
    "Korea": "kr",
    "India": "in",
    "Indonesia": "id",
    "Thailand": "th",
    "Vietnam": "vn",
    "Malaysia": "my",
    "Singapore": "sg",
    "Philippines": "ph",
    "Taiwan": "tw",
    "Hong Kong": "hk",
    "Macau": "mo",
    "Mongolia": "mn",
    "Kazakhstan": "kz",
    "Uzbekistan": "uz",
    "Turkmenistan": "tm",
    "Kyrgyzstan": "kg",
    "Tajikistan": "tj",
    "Afghanistan": "af",
    "Pakistan": "pk",
    "Bangladesh": "bd",
    "Sri Lanka": "lk",
    "Myanmar": "mm",
    "Cambodia": "kh",
    "Laos": "la",
    "Brunei": "bn",
    "Nepal": "np",
    "Bhutan": "bt",
    "Maldives": "mv",
    "New Zealand": "nz",
    "Papua New Guinea": "pg",
    "Fiji": "fj",
    "Solomon Islands": "sb",
    "Vanuatu": "vu",
    "Samoa": "ws",
    "Tonga": "to",
    "Tuvalu": "tv",
    "Kiribati": "ki",
    "Nauru": "nr",
    "Palau": "pw",
    "Marshall Islands": "mh",
    "Micronesia": "fm",
    "Guam": "gu",
    "American Samoa": "as",
    "Northern Mariana Islands": "mp",
    
    # Middle East
    "Turkey": "tr",
    "Israel": "il",
    "Palestine": "ps",
    "Palestinian Territory": "ps",
    "Lebanon": "lb",
    "Syria": "sy",
    "Jordan": "jo",
    "Iraq": "iq",
    "Iran": "ir",
    "Saudi Arabia": "sa",
    "Kuwait": "kw",
    "Bahrain": "bh",
    "Qatar": "qa",
    "United Arab Emirates": "ae",
    "UAE": "ae",
    "Oman": "om",
    "Yemen": "ye",
    "Georgia": "ge",
    "Armenia": "am",
    "Azerbaijan": "az",
    
    # Africa
    "Egypt": "eg",
    "Libya": "ly",
    "Tunisia": "tn",
    "Algeria": "dz",
    "Morocco": "ma",
    "Sudan": "sd",
    "South Sudan": "ss",
    "Ethiopia": "et",
    "Eritrea": "er",
    "Djibouti": "dj",
    "Somalia": "so",
    "Kenya": "ke",
    "Uganda": "ug",
    "Tanzania": "tz",
    "Rwanda": "rw",
    "Burundi": "bi",
    "Democratic Republic of the Congo": "cd",
    "Congo": "cg",
    "Central African Republic": "cf",
    "Chad": "td",
    "Cameroon": "cm",
    "Nigeria": "ng",
    "Niger": "ne",
    "Mali": "ml",
    "Burkina Faso": "bf",
    "Ivory Coast": "ci",
    "Cote d'Ivoire": "ci",
    "Ghana": "gh",
    "Togo": "tg",
    "Benin": "bj",
    "Senegal": "sn",
    "Gambia": "gm",
    "Guinea-Bissau": "gw",
    "Guinea": "gn",
    "Sierra Leone": "sl",
    "Liberia": "lr",
    "Cape Verde": "cv",
    "Mauritania": "mr",
    "Western Sahara": "eh",
    "South Africa": "za",
    "Namibia": "na",
    "Botswana": "bw",
    "Zimbabwe": "zw",
    "Zambia": "zm",
    "Malawi": "mw",
    "Mozambique": "mz",
    "Madagascar": "mg",
    "Mauritius": "mu",
    "Seychelles": "sc",
    "Comoros": "km",
    "Mayotte": "yt",
    "Reunion": "re",
    "Saint Helena": "sh",
    "Angola": "ao",
    "Gabon": "ga",
    "Equatorial Guinea": "gq",
    "Sao Tome and Principe": "st",
    "Lesotho": "ls",
    "Swaziland": "sz",
    "Eswatini": "sz",
    
    # Americas
    "Mexico": "mx",
    "Guatemala": "gt",
    "Belize": "bz",
    "El Salvador": "sv",
    "Honduras": "hn",
    "Nicaragua": "ni",
    "Costa Rica": "cr",
    "Panama": "pa",
    "Cuba": "cu",
    "Jamaica": "jm",
    "Haiti": "ht",
    "Dominican Republic": "do",
    "Bahamas": "bs",
    "Barbados": "bb",
    "Trinidad and Tobago": "tt",
    "Grenada": "gd",
    "Saint Vincent and the Grenadines": "vc",
    "Saint Lucia": "lc",
    "Dominica": "dm",
    "Antigua and Barbuda": "ag",
    "Saint Kitts and Nevis": "kn",
    "Puerto Rico": "pr",
    "United States Virgin Islands": "vi",
    "British Virgin Islands": "vg",
    "Anguilla": "ai",
    "Montserrat": "ms",
    "Guadeloupe": "gp",
    "Martinique": "mq",
    "Saint Barthelemy": "bl",
    "Saint Martin": "mf",
    "Sint Maarten": "sx",
    "Curacao": "cw",
    "Aruba": "aw",
    "Bonaire": "bq",
    "Netherlands Antilles": "an",
    "Turks and Caicos Islands": "tc",
    "Cayman Islands": "ky",
    "Bermuda": "bm",
    "Greenland": "gl",
    "Faroe Islands": "fo",
    "Iceland": "is",
    "Brazil": "br",
    "Argentina": "ar",
    "Chile": "cl",
    "Peru": "pe",
    "Bolivia": "bo",
    "Paraguay": "py",
    "Uruguay": "uy",
    "Colombia": "co",
    "Venezuela": "ve",
    "Guyana": "gy",
    "Suriname": "sr",
    "French Guiana": "gf",
    "Ecuador": "ec",
    "Falkland Islands": "fk",
    "Falkland Islands (Malvinas)": "fk",
    "South Georgia and the South Sandwich Islands": "gs",
    
    # Oceania territories
    "Cook Islands": "ck",
    "Niue": "nu",
    "Tokelau": "tk",
    "French Polynesia": "pf",
    "Wallis and Futuna": "wf",
    "New Caledonia": "nc",
    "Norfolk Island": "nf",
    "Christmas Island": "cx",
    "Cocos (Keeling) Islands": "cc",
    "Heard Island and McDonald Islands": "hm",
    "Australian Antarctic Territory": "aq",
    
    # Other territories
    "Antarctica": "aq",
    "Antarctica (the territory South of 60 deg S)": "aq",
    "British Indian Ocean Territory": "io",
    "British Indian Ocean Territory (Chagos Archipelago)": "io",
    "Gibraltar": "gi",
    "Isle of Man": "im",
    "Jersey": "je",
    "Guernsey": "gg",
    "Svalbard and Jan Mayen": "sj",
    "Bouvet Island": "bv",
    "Pitcairn Islands": "pn",
    "Saint Pierre and Miquelon": "pm",
    "Vatican City": "va",
    "San Marino": "sm",
    "Monaco": "mc",
    "Andorra": "ad",
    "Liechtenstein": "li",
    "Aland Islands": "ax",
}

COUNTRY_TO_PHONE_CODE = {
    # Major countries
    "United States": "1",
    "Canada": "1",
    "United Kingdom": "44",
    "Australia": "61",
    "Germany": "49",
    "France": "33",
    "Italy": "39",
    "Spain": "34",
    "Netherlands": "31",
    "Belgium": "32",
    "Switzerland": "41",
    "Austria": "43",
    "Sweden": "46",
    "Norway": "47",
    "Denmark": "45",
    "Finland": "358",
    "Poland": "48",
    "Czech Republic": "420",
    "Hungary": "36",
    "Romania": "40",
    "Bulgaria": "359",
    "Greece": "30",
    "Portugal": "351",
    "Ireland": "353",
    "Luxembourg": "352",
    "Malta": "356",
    "Cyprus": "357",
    "Estonia": "372",
    "Latvia": "371",
    "Lithuania": "370",
    "Slovakia": "421",
    "Slovenia": "386",
    "Croatia": "385",
    "Serbia": "381",
    "Montenegro": "382",
    "Bosnia and Herzegovina": "387",
    "North Macedonia": "389",
    "Albania": "355",
    "Moldova": "373",
    "Ukraine": "380",
    "Belarus": "375",
    "Russia": "7",
    
    # Asia-Pacific
    "China": "86",
    "Japan": "81",
    "South Korea": "82",
    "Korea": "82",
    "India": "91",
    "Indonesia": "62",
    "Thailand": "66",
    "Vietnam": "84",
    "Malaysia": "60",
    "Singapore": "65",
    "Philippines": "63",
    "Taiwan": "886",
    "Hong Kong": "852",
    "Macau": "853",
    "Mongolia": "976",
    "Kazakhstan": "7",
    "Uzbekistan": "998",
    "Turkmenistan": "993",
    "Kyrgyzstan": "996",
    "Tajikistan": "992",
    "Afghanistan": "93",
    "Pakistan": "92",
    "Bangladesh": "880",
    "Sri Lanka": "94",
    "Myanmar": "95",
    "Cambodia": "855",
    "Laos": "856",
    "Brunei": "673",
    "Nepal": "977",
    "Bhutan": "975",
    "Maldives": "960",
    "New Zealand": "64",
    "Papua New Guinea": "675",
    "Fiji": "679",
    "Solomon Islands": "677",
    "Vanuatu": "678",
    "Samoa": "685",
    "Tonga": "676",
    "Tuvalu": "688",
    "Kiribati": "686",
    "Nauru": "674",
    "Palau": "680",
    "Marshall Islands": "692",
    "Micronesia": "691",
    "Guam": "1",
    "American Samoa": "1",
    "Northern Mariana Islands": "1",
    
    # Middle East
    "Turkey": "90",
    "Israel": "972",
    "Palestine": "970",
    "Palestinian Territory": "970",
    "Lebanon": "961",
    "Syria": "963",
    "Jordan": "962",
    "Iraq": "964",
    "Iran": "98",
    "Saudi Arabia": "966",
    "Kuwait": "965",
    "Bahrain": "973",
    "Qatar": "974",
    "United Arab Emirates": "971",
    "UAE": "971",
    "Oman": "968",
    "Yemen": "967",
    "Georgia": "995",
    "Armenia": "374",
    "Azerbaijan": "994",
    
    # Africa
    "Egypt": "20",
    "Libya": "218",
    "Tunisia": "216",
    "Algeria": "213",
    "Morocco": "212",
    "Sudan": "249",
    "South Sudan": "211",
    "Ethiopia": "251",
    "Eritrea": "291",
    "Djibouti": "253",
    "Somalia": "252",
    "Kenya": "254",
    "Uganda": "256",
    "Tanzania": "255",
    "Rwanda": "250",
    "Burundi": "257",
    "Democratic Republic of the Congo": "243",
    "Congo": "242",
    "Central African Republic": "236",
    "Chad": "235",
    "Cameroon": "237",
    "Nigeria": "234",
    "Niger": "227",
    "Mali": "223",
    "Burkina Faso": "226",
    "Ivory Coast": "225",
    "Cote d'Ivoire": "225",
    "Ghana": "233",
    "Togo": "228",
    "Benin": "229",
    "Senegal": "221",
    "Gambia": "220",
    "Guinea-Bissau": "245",
    "Guinea": "224",
    "Sierra Leone": "232",
    "Liberia": "231",
    "Cape Verde": "238",
    "Mauritania": "222",
    "Western Sahara": "212",
    "South Africa": "27",
    "Namibia": "264",
    "Botswana": "267",
    "Zimbabwe": "263",
    "Zambia": "260",
    "Malawi": "265",
    "Mozambique": "258",
    "Madagascar": "261",
    "Mauritius": "230",
    "Seychelles": "248",
    "Comoros": "269",
    "Mayotte": "262",
    "Reunion": "262",
    "Saint Helena": "290",
    "Angola": "244",
    "Gabon": "241",
    "Equatorial Guinea": "240",
    "Sao Tome and Principe": "239",
    "Lesotho": "266",
    "Swaziland": "268",
    "Eswatini": "268",
    
    # Americas
    "Mexico": "52",
    "Guatemala": "502",
    "Belize": "501",
    "El Salvador": "503",
    "Honduras": "504",
    "Nicaragua": "505",
    "Costa Rica": "506",
    "Panama": "507",
    "Cuba": "53",
    "Jamaica": "1",
    "Haiti": "509",
    "Dominican Republic": "1",
    "Bahamas": "1",
    "Barbados": "1",
    "Trinidad and Tobago": "1",
    "Grenada": "1",
    "Saint Vincent and the Grenadines": "1",
    "Saint Lucia": "1",
    "Dominica": "1",
    "Antigua and Barbuda": "1",
    "Saint Kitts and Nevis": "1",
    "Puerto Rico": "1",
    "United States Virgin Islands": "1",
    "British Virgin Islands": "1",
    "Anguilla": "1",
    "Montserrat": "1",
    "Guadeloupe": "590",
    "Martinique": "596",
    "Saint Barthelemy": "590",
    "Saint Martin": "590",
    "Sint Maarten": "1",
    "Curacao": "599",
    "Aruba": "297",
    "Bonaire": "599",
    "Netherlands Antilles": "599",
    "Turks and Caicos Islands": "1",
    "Cayman Islands": "1",
    "Bermuda": "1",
    "Greenland": "299",
    "Faroe Islands": "298",
    "Iceland": "354",
    "Brazil": "55",
    "Argentina": "54",
    "Chile": "56",
    "Peru": "51",
    "Bolivia": "591",
    "Paraguay": "595",
    "Uruguay": "598",
    "Colombia": "57",
    "Venezuela": "58",
    "Guyana": "592",
    "Suriname": "597",
    "French Guiana": "594",
    "Ecuador": "593",
    "Falkland Islands": "500",
    "Falkland Islands (Malvinas)": "500",
    
    # Oceania territories
    "Cook Islands": "682",
    "Niue": "683",
    "Tokelau": "690",
    "French Polynesia": "689",
    "Wallis and Futuna": "681",
    "New Caledonia": "687",
    "Norfolk Island": "672",
    "Christmas Island": "61",
    "Cocos (Keeling) Islands": "61",
    
    # Other territories
    "Gibraltar": "350",
    "Isle of Man": "44",
    "Jersey": "44",
    "Guernsey": "44",
    "Vatican City": "39",
    "San Marino": "378",
    "Monaco": "377",
    "Andorra": "376",
    "Liechtenstein": "423",
}

# Retry settings for page loading
MAX_RETRIES = 3
RETRY_DELAY = 2

class LeadInjector:
    """Handles the lead injection process using Playwright."""
    
    def __init__(self, proxy_config=None):
        self.proxy_config = proxy_config
        self.screenshot_dir = Path("./screenshots")
        
        # Create screenshots directory if it doesn't exist
        if not self.screenshot_dir.exists():
            self.screenshot_dir.mkdir(parents=True, exist_ok=True)
        
    def _take_screenshot(self, page, name):
        """Take a screenshot for debugging purposes."""
        try:
            timestamp = time.strftime("%Y%m%d-%H%M%S")
            filename = self.screenshot_dir / f"{name}_{timestamp}.png"
            page.screenshot(path=str(filename))
            print(f"INFO: Screenshot saved to {filename}")
        except Exception as e:
            print(f"WARNING: Failed to take screenshot: {str(e)}")
            
    def _setup_browser_config(self):
        """Set up browser configuration with proxy and device settings."""
        # Detect if we're in a deployment environment (no display available)
        is_deployment = (
            os.getenv('NODE_ENV') == 'production' or
            os.getenv('RENDER') == 'true' or
            os.getenv('VERCEL') == '1' or
            os.getenv('DOCKER') == 'true' or
            not os.getenv('DISPLAY', '').strip()  # No display environment variable
        )
        
        browser_config = {
            "headless": is_deployment,  # Headless in deployment, visible in development
            "args": [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu",
                "--window-size=428,926"  # Match the viewport size
            ]
        }
        
        # Add additional args for headless environments
        if is_deployment:
            browser_config["args"].extend([
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--disable-features=TranslateUI",
                "--disable-ipc-flooding-protection",
                "--disable-extensions",
                "--no-first-run",
                "--disable-default-apps"
            ])
            print("INFO: Running in headless mode (deployment environment detected)")
        else:
            print("INFO: Running with visible browser (development environment)")
        
        # Add proxy configuration if provided
        if self.proxy_config:
            server = self.proxy_config.get("server", "")
            
            browser_config["proxy"] = {
                "server": server,
                "username": self.proxy_config.get("username"),
                "password": self.proxy_config.get("password")
            }
            print(f"INFO: Using proxy configuration: {server}")
            
        return browser_config

    def _human_like_typing(self, element, text):
        """Simulate human-like typing with random delays."""
        for char in text:
            element.type(char, delay=random.uniform(100, 300))
            
    def _verify_proxy_and_device(self, page):
        """Verify if proxy and device simulation are working correctly."""
        try:
            # First verify IP using ipify
            print("\nINFO: Verifying proxy and device simulation...")
            page.goto("https://api.ipify.org", wait_until="networkidle", timeout=30000)
            actual_ip = page.locator('pre').inner_text()
            
            # Double check with another IP service
            page.goto("https://ip.oxylabs.io/location", wait_until="networkidle", timeout=30000)
            try:
                location_data_text = page.locator('pre').inner_text()
                location_data = json.loads(location_data_text)
                print("\nProxy and Device Verification Results:")
                print(f"IP Address: {actual_ip}")
                print(f"Country: {location_data.get('country', 'Unknown')}")
                print(f"City: {location_data.get('city', 'Unknown')}")
            except (json.JSONDecodeError, Exception):
                print(f"IP Address: {actual_ip}")
                print("WARNING: Could not get detailed location data")
                print(f"DEBUG: page content from ip.oxylabs.io/location: {page.content()}")

            # Get detailed device information
            device_info = page.evaluate("""() => {
                return {
                    // From screen object
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height,
                    availWidth: window.screen.availWidth,
                    availHeight: window.screen.availHeight,
                    colorDepth: window.screen.colorDepth,
                    pixelDepth: window.screen.pixelDepth,
                    
                    // From navigator object
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                    languages: navigator.languages,
                    vendor: navigator.vendor,
                    product: navigator.product,
                    onLine: navigator.onLine,
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    deviceMemory: navigator.deviceMemory,
                    
                    // Derived
                    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                }
            }""")

            print(f"\nDevice Information:")
            print(f"User Agent: {device_info.get('userAgent', 'N/A')}")
            print(f"Platform: {device_info.get('platform', 'N/A')}")
            print(f"Language: {device_info.get('language', 'N/A')}")
            print(f"Vendor: {device_info.get('vendor', 'N/A')}")
            print(f"Screen Resolution: {device_info.get('screenWidth')}x{device_info.get('screenHeight')}")
            print(f"Available Screen: {device_info.get('availWidth')}x{device_info.get('availHeight')}")
            print(f"Color Depth: {device_info.get('colorDepth')}")
            print(f"Mobile Device: {'Yes' if device_info.get('isMobile') else 'No'}")
            
            if 'hardwareConcurrency' in device_info and device_info['hardwareConcurrency']:
                print(f"CPU Cores: {device_info.get('hardwareConcurrency')}")
            if 'deviceMemory' in device_info and device_info['deviceMemory']:
                print(f"Device Memory (GB): {device_info.get('deviceMemory')}")

            # Take a screenshot of verification
            self._take_screenshot(page, "proxy_verification")

            # Verify if we're using the expected proxy
            if self.proxy_config:
                if actual_ip:
                    print("INFO: Successfully verified proxy connection")
                else:
                    print("WARNING: Could not verify proxy IP address")
                    
            # Verify device simulation
            if "iPhone" in device_info.get('userAgent', '') and device_info.get('screenWidth') == 428:
                print("INFO: Successfully verified iPhone 14 Pro Max simulation")
            else:
                print("WARNING: Device simulation may not be working as expected")

            return True

        except Exception as e:
            print(f"WARNING: Proxy verification failed - {str(e)}")
            traceback.print_exc()
            return False

    def inject_lead(self, lead_data, target_url):
        """Inject a lead using Playwright."""
        browser = None
        try:
            # Store target URL for proxy configuration
            self.target_url = target_url
            
            # Get proxy configuration
            if not self.proxy_config:
                print("WARNING: No proxy configuration available. Proceeding without proxy for testing.")
            
            with sync_playwright() as p:
                # Launch browser with configuration
                print("INFO: Launching browser...")
                browser = p.chromium.launch(**self._setup_browser_config())
                
                # Create a new context with iPhone 14 Pro Max settings
                iphone_14_pro_max = {
                    'screen': {
                        'width': 428,  # Standard iPhone width
                        'height': 926  # Standard iPhone height
                    },
                    'viewport': {
                        'width': 428,  # Adjusted to standard iPhone viewport width
                        'height': 926  # Adjusted to show the form properly
                    },
                    'device_scale_factor': 3,
                    'is_mobile': True,
                    'has_touch': True,
                    'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/605.1 NAVER(inapp; search; 2000; 12.12.50; 14PROMAX)',
                }
                
                # Add additional context options to ensure proper rendering
                context = browser.new_context(
                    **iphone_14_pro_max,
                    locale="en-US"
                )
                
                # Create a new page
                page = context.new_page()
                
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
                self._take_screenshot(page, "initial_page_load")

                # Reduce break time for testing
                print("INFO: Taking a short break...")
                time.sleep(3)
                print("\nINFO: Break finished, continuing with form filling...")
                
                try:
                    # Check if the form is visible
                    form_visible = page.is_visible('form[id="landingForm"], form[data-testid="landingForm"]')
                    if not form_visible:
                        print("WARNING: Form not immediately visible, trying to find it...")
                        # Try to scroll to find the form
                        page.evaluate("window.scrollTo(0, 0);")
                        time.sleep(1)
                        # Try to find the form by scrolling down
                        for i in range(5):
                            page.evaluate(f"window.scrollTo(0, {i * 200});")
                            time.sleep(0.5)
                            if page.is_visible('form[id="landingForm"], form[data-testid="landingForm"], #firstName'):
                                print(f"INFO: Form found after scrolling {i * 200}px")
                                form_visible = True
                                break

                        # Take another screenshot after scrolling
                        self._take_screenshot(page, "after_scrolling")

                        # If still not visible, try to adjust zoom
                        if not form_visible:
                            print("WARNING: Form still not visible, trying to adjust zoom...")
                            page.evaluate("document.body.style.zoom = '80%'")
                            time.sleep(1)
                            self._take_screenshot(page, "after_zoom_adjustment")

                    # Fill form fields with human-like behavior
                    print("INFO: Filling form fields...")
                    try:
                        # Debug info about the form fields
                        for key, value in lead_data.items():
                            print(f"DEBUG: {key}: {value}")

                        # Wait for form fields and fill them - using proper selectors from LandingPage.jsx
                        first_name = page.wait_for_selector('#firstName', timeout=30000)
                        if not first_name:
                            print("ERROR: Could not find firstName field")
                            self._take_screenshot(page, "form_not_found")
                            return False
                        self._human_like_typing(first_name, lead_data["firstName"])

                        last_name = page.wait_for_selector('#lastName', timeout=30000)
                        self._human_like_typing(last_name, lead_data["lastName"])

                        email = page.wait_for_selector('#email', timeout=30000)
                        self._human_like_typing(email, lead_data["email"])

                        # Determine phone prefix to use
                        phone_code_from_lead = lead_data.get('country_code')
                        country_name_from_lead = lead_data.get('country')
                        phone_code_to_use = None

                        # Prioritize country name to get phone code
                        if country_name_from_lead and country_name_from_lead in COUNTRY_TO_PHONE_CODE:
                            phone_code_to_use = COUNTRY_TO_PHONE_CODE[country_name_from_lead]
                        elif phone_code_from_lead:
                            # Fallback to the one from lead data
                            phone_code_to_use = phone_code_from_lead
                            print(f"WARNING: Country '{country_name_from_lead}' not in phone code mapping. Using provided country_code: {phone_code_to_use}")

                        # Check if country_code exists and isn't empty
                        if phone_code_to_use:
                            # Format the country code with a plus sign if it doesn't have one
                            code = str(phone_code_to_use)
                            if not code.startswith('+'):
                                code = f"+{code}"
                            print(f"INFO: Selecting country code {code}")

                            # Click the dropdown to open it
                            page.click('#prefix')
                            # Wait for dropdown to open
                            time.sleep(1)

                            # Find the correct country code option
                            try:
                                clean_code = code.replace('+', '')
                                selector = f'[data-testid="prefix-option-{clean_code}"]'
                                print(f"INFO: Using selector {selector}")
                                page.click(selector)
                            except Exception as e:
                                print(f"WARNING: Could not select country code {code}: {str(e)}")
                                # Use first option as fallback
                                page.click('[data-testid="prefix-option-1"]')

                        phone_number = lead_data['phone']
                        phone = page.wait_for_selector('#phone', timeout=30000)
                        self._human_like_typing(phone, phone_number)
                    
                        # Take a screenshot before submission
                        self._take_screenshot(page, "before_submission")
                        
                        # Set injection mode flag
                        page.evaluate("window.localStorage.setItem('isInjectionMode', 'true')")
                        
                        # Random delay before submission
                        time.sleep(random.uniform(1, 2))
                        
                        # Submit form
                        submit_button = page.wait_for_selector('#submitBtn', timeout=30000)
                        submit_button.click()
                        
                        # Wait for success indication - the Thank You message appears when form is submitted
                        try:
                            # Wait for the success message to appear
                            success_message = page.wait_for_selector('text="Thank You!"', timeout=30000)
                            if success_message:
                                print("SUCCESS: Form submitted successfully")
                                self._take_screenshot(page, "success")
                                
                                # Wait 20 seconds for the final redirect to complete
                                print("INFO: Waiting 20 seconds for final redirect...")
                                
                                # Take periodic screenshots during the wait to monitor redirects
                                for i in range(4):  # 4 checks over 20 seconds (every 5 seconds)
                                    time.sleep(5)
                                    current_url = page.url
                                    print(f"INFO: URL after {(i+1)*5} seconds: {current_url}")
                                    self._take_screenshot(page, f"redirect_check_{i+1}")
                                
                                # Get the final domain after all redirects
                                final_url = page.url
                                print(f"INFO: Final URL after 20 seconds: {final_url}")
                                
                                # Extract domain from URL
                                parsed_url = urlparse(final_url)
                                final_domain = parsed_url.netloc
                                
                                # Validate domain
                                if not final_domain or final_domain == "ftd-copy.vercel.app":
                                    print(f"WARNING: Final domain appears to be the original form domain: {final_domain}")
                                    print("INFO: This might indicate no redirect occurred or redirect failed")
                                
                                print(f"SUCCESS: Final domain captured: {final_domain}")
                                self._take_screenshot(page, "final_redirect")
                                
                                # Store the final domain in a way the backend can access it
                                # We'll output it in a specific format the backend can parse
                                print(f"FINAL_DOMAIN:{final_domain}")
                                
                                # Verify proxy and device simulation
                                if self.proxy_config:
                                    verification_result = self._verify_proxy_and_device(page)
                                    if verification_result:
                                        print("INFO: Proxy and device verification completed")
                                    else:
                                        print("WARNING: Proxy and device verification failed")
                                
                                return True
                            else:
                                # Check for error message
                                error_message = page.query_selector('.MuiAlert-message')
                                if error_message:
                                    error_text = error_message.inner_text()
                                    print(f"WARNING: Submission error - {error_text}")
                                    self._take_screenshot(page, "error")
                                else:
                                    print("WARNING: Could not verify successful submission")
                                    self._take_screenshot(page, "unknown_state")
                                return False
                        except Exception as e:
                            print(f"WARNING: Could not verify successful submission - {str(e)}")
                            self._take_screenshot(page, "verification_error")
                            return False
                    
                    except Exception as e:
                        print(f"ERROR: Form filling failed - {str(e)}")
                        self._take_screenshot(page, "form_filling_error")
                        traceback.print_exc()
                        return False
                        
                except Exception as e:
                    print(f"ERROR: Form interaction failed - {str(e)}")
                    self._take_screenshot(page, "form_interaction_error")
                    traceback.print_exc()
                    return False
                
        except Exception as e:
            if "proxy" in str(e).lower():
                print(f"ERROR: Proxy-related error during injection: {str(e)}")
            else:
                print(f"ERROR: Browser initialization failed - {str(e)}")
            traceback.print_exc()
            return False
        finally:
            if browser:
                try:
                    browser.close()
                except:
                    pass

    def _get_default_fingerprint(self):
        """Get default fingerprint configuration for fallback."""
        return {
            'deviceType': 'android',
            'deviceId': 'default_android_device',
            'screen': {'width': 428, 'height': 926, 'devicePixelRatio': 3},
            'navigator': {
                'userAgent': 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'platform': 'Linux armv8l',
                'language': 'en-US',
                'languages': ['en-US', 'en'],
                'vendor': 'Google Inc.',
                'hardwareConcurrency': 8,
                'deviceMemory': 8,
                'maxTouchPoints': 10
            },
            'mobile': {'isMobile': True, 'isTablet': False}
        }

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
            
            print(f"INFO: Applied basic fingerprint properties for device: {fingerprint.get('deviceId', 'unknown')}")
            
        except Exception as e:
            print(f"WARNING: Failed to apply fingerprint properties: {str(e)}")
            # Always ensure injection mode is set
            try:
                page.evaluate("() => { localStorage.setItem('isInjectionMode', 'true'); }")
                print("INFO: Set injection mode flag despite fingerprint error")
            except Exception as e2:
                print(f"WARNING: Could not set injection mode flag: {str(e2)}")

    def _check_proxy_health(self):
        """Check if the current proxy is still healthy."""
        try:
            if not self.proxy_config:
                return False
            
            # Quick health check with a lightweight request
            import requests
            proxy_url = f"http://{self.proxy_config['username']}:{self.proxy_config['password']}@{self.proxy_config['host']}:{self.proxy_config['port']}"
            proxies = {'http': proxy_url, 'https': proxy_url}
            
            response = requests.get('https://api.ipify.org', proxies=proxies, timeout=10)
            return response.status_code == 200
            
        except Exception as e:
            print(f"WARNING: Proxy health check failed: {str(e)}")
            return False



def get_proxy_config(country_name):
    """Get proxy configuration from 922proxy API (fallback method)."""
    try:
        # Get 2-letter ISO code for the country
        iso_code = COUNTRY_TO_ISO_CODE.get(country_name)
        if not iso_code:
            print(f"WARNING: No ISO code found for '{country_name}'. Defaulting to 'us'.")
            iso_code = "us"

        print(f"INFO: Setting up fallback proxy for country: {country_name} ({iso_code})")

        # To get a new proxy for each lead, we generate a new random session ID.
        session_id = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        username = f"34998931-zone-custom-country-{iso_code}-sessid-{session_id}"
        print(f"INFO: Generated new session username: {username}")

        # Proxy configuration for 922proxy
        proxy_info = {
            'username': username,
            'password': 'TPvBwkO8',
            'host': 'us.922s5.net',
            'port': 6300
        }

        # Test the proxy
        proxy_url = f"http://{proxy_info['username']}:{proxy_info['password']}@{proxy_info['host']}:{proxy_info['port']}"
        proxies = {'http': proxy_url, 'https': proxy_url}
        
        try:
            response = requests.get('https://api.ipify.org', proxies=proxies, timeout=30)
            response.raise_for_status()
            print(f"INFO: Fallback proxy test successful: {response.text.strip()}")
        except Exception as e:
            print(f"WARNING: Fallback proxy test failed: {str(e)}")
            return None

        return {
            "server": f"http://{proxy_info['host']}:{proxy_info['port']}",
            "username": proxy_info['username'],
            "password": proxy_info['password']
        }

    except Exception as e:
        print(f"ERROR: An unexpected error occurred while setting up fallback proxy: {str(e)}")
        return None

def main():
    """Main execution function."""
    if len(sys.argv) < 2:
        print("FATAL: No input JSON provided.")
        sys.exit(1)

    try:
        injection_data_str = sys.argv[1]
        injection_data = json.loads(injection_data_str)
        print(f"INFO: Processing injection data for lead {injection_data.get('leadId', 'unknown')}")
        
        # Extract proxy configuration from injection data
        proxy_config = injection_data.get('proxy')
        if not proxy_config:
            # Check if this is a test run (no proxy intended)
            if injection_data.get('leadId', '').startswith('test_'):
                print("INFO: Test mode detected - proceeding without proxy.")
                proxy_config = None
            else:
                print("WARNING: No proxy configuration provided. Attempting to get fallback proxy.")
                country_name = injection_data.get("country", "United States")
                proxy_config = get_proxy_config(country_name)
                
                if not proxy_config:
                    print("WARNING: Could not obtain proxy configuration. Proceeding without proxy for testing.")
                    proxy_config = None

        # Get target URL
        target_url = injection_data.get('targetUrl', "https://ftd-copy.vercel.app/landing")
        print(f"INFO: Target URL: {target_url}")

        # Initialize and run injector with proxy configuration
        injector = LeadInjector(proxy_config)
        success = injector.inject_lead(injection_data, target_url)

        if success:
            print("INFO: Lead injection completed successfully")
            return True
        else:
            print("ERROR: Lead injection failed")
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