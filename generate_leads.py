import json
import random
from datetime import datetime, timedelta
from faker import Faker
import uuid
import argparse
from bson import ObjectId  # For generating MongoDB-compatible IDs

# Initialize Faker
fake = Faker()

# Common country calling codes
COUNTRY_CODES = {
    'United States': '1',
    'United Kingdom': '44',
    'Australia': '61',
    'Germany': '49',
    'France': '33',
    'Italy': '39',
    'Spain': '34',
    'Canada': '1',
    'China': '86',
    'Japan': '81',
    'South Korea': '82',
    'India': '91',
    'Brazil': '55',
    'Mexico': '52',
    'Russia': '7',
    'South Africa': '27',
    'Nigeria': '234',
    'Egypt': '20',
    'Saudi Arabia': '966',
    'UAE': '971',
    'Singapore': '65',
    'Malaysia': '60',
    'Indonesia': '62',
    'Thailand': '66',
    'Vietnam': '84',
    'Philippines': '63',
    'Turkey': '90',
    'Poland': '48',
    'Netherlands': '31',
    'Belgium': '32',
    'Sweden': '46',
    'Norway': '47',
    'Denmark': '45',
    'Finland': '358',
    'Switzerland': '41',
    'Austria': '43',
    'Greece': '30',
    'Portugal': '351',
    'Ireland': '353',
    'New Zealand': '64'
}

def get_country_code(country):
    """Get the calling code for a country, default to a random one if not found."""
    return COUNTRY_CODES.get(country, random.choice(list(COUNTRY_CODES.values())))

def generate_phone():
    """Generate a random phone number with country code."""
    # Generate the local part of the number (8 digits)
    local_number = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    return local_number

def generate_social_media():
    """Generate random social media handles."""
    return {
        "facebook": f"https://facebook.com/{fake.user_name()}" if random.random() > 0.3 else "",
        "twitter": f"https://twitter.com/{fake.user_name()}" if random.random() > 0.3 else "",
        "linkedin": f"https://linkedin.com/in/{fake.user_name()}" if random.random() > 0.3 else "",
        "instagram": f"https://instagram.com/{fake.user_name()}" if random.random() > 0.3 else "",
        "telegram": f"@{fake.user_name()}" if random.random() > 0.3 else "",
        "whatsapp": generate_phone() if random.random() > 0.3 else ""
    }

def generate_address():
    """Generate a random address string."""
    street = fake.street_address()
    city = fake.city()
    postal_code = fake.postcode()
    return f"{street}, {city} {postal_code}"

def generate_documents(lead_type):
    """Generate document URLs and status for FTD leads."""
    if lead_type == "ftd":
        status_choices = ["good", "ok", "pending"]  # Valid document statuses
        # Using encoded URL to ensure proper display in browser
        image_url = "https://d.newsweek.com/en/full/1888025/gary-lee-holding-id-face.jpg"
        return {
            "idFrontUrl": image_url,
            "idBackUrl": image_url,
            "selfieUrl": image_url,
            "residenceProofUrl": image_url,
            "status": random.choice(status_choices)
        }
    return []  # Return empty array for non-FTD leads as per model default

def generate_comments():
    """Generate random comments for a lead."""
    num_comments = random.randint(0, 3)
    comments = []
    
    comment_templates = [
        "Initial contact made, {interest} in trading",
        "Client shows {level} knowledge about {market}",
        "Followed up via {channel}, {response}",
        "Discussed {product} options, {outcome}",
        "Scheduled {meeting_type} for {timeframe}",
        "{language} barrier noted, {solution} required",
        "Client prefers {communication} for future contact",
        "Potential for {investment_type} investment identified",
        "Requires more information about {topic}",
        "Previous experience with {broker}, {experience}"
    ]
    
    variables = {
        "interest": ["very interested", "somewhat interested", "showing interest", "highly interested"],
        "level": ["basic", "intermediate", "advanced", "limited"],
        "market": ["forex", "stocks", "crypto", "commodities", "indices"],
        "channel": ["email", "phone", "WhatsApp", "Telegram", "LinkedIn"],
        "response": ["positive response", "will consider options", "requested more info", "needs time to decide"],
        "product": ["CFD", "forex pairs", "commodity futures", "stock options"],
        "outcome": ["showing promise", "needs follow-up", "very enthusiastic", "considering proposal"],
        "meeting_type": ["video call", "phone consultation", "online demo", "strategy session"],
        "timeframe": ["next week", "tomorrow", "next month", "this Friday"],
        "language": ["English", "Spanish", "Mandarin", "Arabic"],
        "solution": ["translator", "simplified materials", "native speaker", "visual aids"],
        "communication": ["email", "phone", "messaging apps", "video calls"],
        "investment_type": ["short-term", "long-term", "day trading", "swing trading"],
        "topic": ["trading platforms", "account types", "fee structure", "trading strategies"],
        "broker": ["previous broker", "local broker", "online platform", "traditional bank"],
        "experience": ["positive experience", "mixed results", "negative experience", "limited exposure"]
    }
    
    # Generate a fake user ID for comment authors
    author_id = str(ObjectId())
    
    for _ in range(num_comments):
        template = random.choice(comment_templates)
        # Replace each placeholder with a random choice from corresponding list
        comment = template
        for key, values in variables.items():
            if "{" + key + "}" in template:
                comment = comment.replace("{" + key + "}", random.choice(values))
        
        # Generate a random date within the last 30 days
        comment_date = datetime.now() - timedelta(days=random.randint(0, 30))
        
        comments.append({
            "text": comment,
            "author": author_id,  # Required as per model
            "createdAt": comment_date.isoformat()
        })
    
    return comments

def generate_lead():
    """Generate a single lead record according to the MongoDB schema."""
    lead_types = ["ftd", "filler", "cold", "live"]
    genders = ["male", "female", "not_defined"]
    priorities = ["low", "medium", "high"]
    statuses = ["active", "contacted", "converted", "inactive"]
    
    lead_type = random.choice(lead_types)
    country = fake.country()
    prefix = get_country_code(country)
    phone_number = generate_phone()
    
    # Generate base lead data
    lead = {
        "leadType": lead_type,
        "prefix": prefix,
        "firstName": fake.first_name(),
        "lastName": fake.last_name(),
        "newEmail": fake.email(),
        "oldEmail": fake.email() if random.random() > 0.7 else "",
        "newPhone": f"+{prefix}{phone_number}",
        "oldPhone": f"+{prefix}{generate_phone()}" if random.random() > 0.7 else "",
        "country": country,
        "isAssigned": False,
        "assignedTo": None,
        "assignedAt": None,
        "client": fake.company() if random.random() > 0.5 else "",
        "clientBroker": fake.company() if random.random() > 0.5 else "",
        "clientNetwork": fake.company() if random.random() > 0.5 else "",
        "gender": random.choice(genders),
        "socialMedia": generate_social_media(),
        "comments": generate_comments(),
        "source": random.choice(["website", "referral", "social_media", "direct"]),
        "priority": random.choice(priorities),
        "status": random.choice(statuses),
        "createdAt": (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    
    # Add FTD & Filler specific fields
    if lead_type in ["ftd", "filler"]:
        lead.update({
            "dob": (datetime.now() - timedelta(days=random.randint(7300, 25550))).strftime("%Y-%m-%d"),
            "address": generate_address()
        })
    
    # Add FTD specific fields
    if lead_type == "ftd":
        lead.update({
            "documents": generate_documents("ftd"),
            "sin": str(random.randint(100000000, 999999999))
        })
    
    return lead

def generate_leads_file(num_leads=50, output_file="sample_leads.json"):
    """Generate multiple leads and save to a JSON file."""
    leads = [generate_lead() for _ in range(num_leads)]
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)
    
    print(f"Generated {num_leads} leads and saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate sample leads data')
    parser.add_argument('num_leads', type=int, nargs='?', default=50,
                      help='Number of leads to generate (default: 50)')
    args = parser.parse_args()
    
    generate_leads_file(num_leads=args.num_leads) 