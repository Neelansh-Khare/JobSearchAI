import os
import json
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from google import genai
from google.genai import types
from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from apify_client import ApifyClient

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

load_dotenv()

# IMPORTANT: KEEP THIS COMMENT
# Follow these instructions when using this blueprint:
# - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
#   - do not change this unless explicitly requested by the user
# This API key is from Gemini Developer API Key, not vertex AI API Key
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Gmail API Configuration
SCOPES = ['https://www.googleapis.com/auth/gmail.send']
CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:5000/oauth2callback')

# LinkedIn/Apify Configuration
APIFY_API_TOKEN = os.environ.get('APIFY_API_TOKEN')

# User profiles storage (in production, use a database)
USER_PROFILES_FILE = 'user_profiles.json'

def load_user_profiles():
    """Load user profiles from file"""
    if os.path.exists(USER_PROFILES_FILE):
        with open(USER_PROFILES_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_user_profiles(profiles):
    """Save user profiles to file"""
    with open(USER_PROFILES_FILE, 'w') as f:
        json.dump(profiles, f, indent=2)

def get_user_id():
    """Get or create user ID from session"""
    if 'user_id' not in session:
        import uuid
        session['user_id'] = str(uuid.uuid4())
    return session['user_id']


def find_linkedin_contacts(company_type, role_types, location, max_results=5):
    """
    Find real LinkedIn contacts using Apify LinkedIn Profile Scraper
    
    Args:
        company_type: Type of company (e.g., 'big tech', 'startups')
        role_types: List of job titles to search for
        location: Location to search in
        max_results: Maximum number of contacts to return
    
    Returns:
        List of contact dictionaries with name, title, company, location, linkedin_url
    """
    if not APIFY_API_TOKEN:
        return None
    
    try:
        client = ApifyClient(APIFY_API_TOKEN)
        
        # Build search query - combine role types and location
        # For example: "Staff Engineer OR HR Leader San Francisco"
        role_query = " OR ".join(role_types)
        search_query = f"{role_query} {location}"
        
        # Map company types to LinkedIn company searches
        # This is a simplified approach - you might want to expand this
        company_keywords = []
        if 'big tech' in company_type.lower() or 'faang' in company_type.lower():
            company_keywords = ['Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Netflix']
        elif 'startup' in company_type.lower():
            company_keywords = ['startup', 'tech startup']
        else:
            company_keywords = [company_type]
        
        contacts = []
        
        # Search for profiles using Apify's LinkedIn Profile Scraper
        # Note: This uses Apify's actor which requires proper setup
        # Alternative: Use LinkedIn People Search actor
        
        # Try using LinkedIn People Search actor
        # Note: You may need to use a different actor ID based on what's available in Apify
        # Common actors: "keheliya/linkedin-people-search", "apify/linkedin-scraper"
        # Check Apify store for available LinkedIn actors: https://apify.com/store
        
        # Using a generic LinkedIn profile scraper approach
        # You may need to adjust the actor ID based on your Apify account
        actor_id = "keheliya/linkedin-people-search"  # Update this if needed
        
        run_input = {
            "searchKeywords": search_query,
            "maxResults": max_results,
            "location": location,
        }
        
        # Run the actor
        run = client.actor(actor_id).call(run_input=run_input)
        
        # Fetch results
        results = []
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            results.append(item)
        
        # Transform results to our contact format
        for profile in results[:max_results]:
            # Extract relevant information
            full_name = profile.get('fullName', '')
            headline = profile.get('headline', '')
            company = profile.get('company', '') or headline.split(' at ')[-1] if ' at ' in headline else ''
            profile_url = profile.get('profileUrl', '')
            location_str = profile.get('location', location)
            
            # Try to extract title from headline
            title = headline
            if ' at ' in headline:
                title = headline.split(' at ')[0]
            
            # Check if title matches any of our role types
            title_matches = any(role.lower() in title.lower() for role in role_types)
            
            if full_name and (title_matches or not role_types):
                contact = {
                    'name': full_name,
                    'title': title,
                    'company': company or 'Unknown',
                    'location': location_str,
                    'linkedin_url': profile_url,
                    'source': 'linkedin'
                }
                contacts.append(contact)
        
        return contacts if contacts else None
        
    except Exception as e:
        print(f"LinkedIn search error: {str(e)}")
        return None


def find_contacts_gemini(company_type, role_types, location):
    """
    Fallback: Generate fictional contacts using Gemini
    """
    prompt = f"""Generate a list of 5 potential hiring manager contacts at {company_type} companies in {location}.

For each contact, provide:
- Name (realistic but fictional to demonstrate the concept)
- Title (should be one of: {', '.join(role_types)})
- Company (real {company_type} company names)
- Location

Format as a JSON array with objects containing: name, title, company, location

Example format:
[
  {{"name": "John Doe", "title": "Staff Engineer", "company": "Google", "location": "San Francisco, CA"}},
  ...
]

IMPORTANT: Return ONLY the JSON array, no other text."""

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    
    contacts_text = response.text if response.text else "[]"
    contacts = json.loads(contacts_text)
    
    # Add source marker
    for contact in contacts:
        contact['source'] = 'fictional'
        if 'linkedin_url' not in contact:
            contact['linkedin_url'] = ''
    
    return contacts


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/find-contacts', methods=['POST'])
def find_contacts():
    try:
        data = request.get_json()
        company_type = data.get('company_type', 'big tech')
        role_types = data.get('role_types', ['Staff Engineer', 'HR Leader'])
        location = data.get('location', 'San Francisco')
        use_linkedin = data.get('use_linkedin', False)  # New parameter to toggle LinkedIn
        
        contacts = []
        source = 'fictional'
        
        # Try LinkedIn first if requested and configured
        if use_linkedin and APIFY_API_TOKEN:
            linkedin_contacts = find_linkedin_contacts(company_type, role_types, location)
            if linkedin_contacts:
                contacts = linkedin_contacts
                source = 'linkedin'
        
        # Fallback to Gemini if LinkedIn failed or not requested
        if not contacts:
            contacts = find_contacts_gemini(company_type, role_types, location)
            source = 'fictional'
        
        return jsonify({
            'contacts': contacts,
            'source': source,
            'linkedin_available': bool(APIFY_API_TOKEN)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/profile', methods=['GET', 'POST'])
def profile():
    """Get or save user profile"""
    user_id = get_user_id()
    profiles = load_user_profiles()
    
    if request.method == 'GET':
        profile_data = profiles.get(user_id, {})
        return jsonify(profile_data)
    
    elif request.method == 'POST':
        data = request.get_json()
        profiles[user_id] = {
            'name': data.get('name', ''),
            'email': data.get('email', ''),
            'linkedin': data.get('linkedin', ''),
            'phone': data.get('phone', ''),
            'job_preference': data.get('job_preference', ''),
            'location_preference': data.get('location_preference', ''),
            'job_role': data.get('job_role', '')
        }
        save_user_profiles(profiles)
        return jsonify({'success': True, 'profile': profiles[user_id]})

@app.route('/auth/google')
def google_auth():
    """Initiate Google OAuth flow"""
    if not CLIENT_ID or not CLIENT_SECRET:
        return jsonify({'error': 'Google OAuth not configured'}), 500
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI]
            }
        },
        scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    
    session['state'] = state
    return redirect(authorization_url)

@app.route('/oauth2callback')
def oauth2callback():
    """Handle OAuth callback"""
    if not CLIENT_ID or not CLIENT_SECRET:
        return jsonify({'error': 'Google OAuth not configured'}), 500
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI]
            }
        },
        scopes=SCOPES,
        state=session.get('state')
    )
    flow.redirect_uri = REDIRECT_URI
    
    authorization_response = request.url
    flow.fetch_token(authorization_response=authorization_response)
    
    credentials = flow.credentials
    user_id = get_user_id()
    profiles = load_user_profiles()
    
    if user_id not in profiles:
        profiles[user_id] = {}
    
    profiles[user_id]['gmail_credentials'] = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    save_user_profiles(profiles)
    
    return redirect(url_for('index'))

@app.route('/api/gmail/status', methods=['GET'])
def gmail_status():
    """Check if user is connected to Gmail"""
    user_id = get_user_id()
    profiles = load_user_profiles()
    profile = profiles.get(user_id, {})
    has_credentials = 'gmail_credentials' in profile
    
    return jsonify({'connected': has_credentials})

@app.route('/api/gmail/send', methods=['POST'])
def send_email():
    """Send email via Gmail API"""
    try:
        user_id = get_user_id()
        profiles = load_user_profiles()
        profile = profiles.get(user_id, {})
        
        if 'gmail_credentials' not in profile:
            return jsonify({'error': 'Gmail not connected. Please connect your Gmail account first.'}), 400
        
        creds_data = profile['gmail_credentials']
        credentials = Credentials(
            token=creds_data['token'],
            refresh_token=creds_data.get('refresh_token'),
            token_uri=creds_data['token_uri'],
            client_id=creds_data['client_id'],
            client_secret=creds_data['client_secret'],
            scopes=creds_data['scopes']
        )
        
        # Refresh token if needed
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            # Update stored credentials
            profiles[user_id]['gmail_credentials'] = {
                'token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': credentials.scopes
            }
            save_user_profiles(profiles)
        
        data = request.get_json()
        to_email = data.get('to_email')
        subject = data.get('subject')
        body = data.get('body')
        
        if not all([to_email, subject, body]):
            return jsonify({'error': 'Missing required fields: to_email, subject, body'}), 400
        
        # Create message
        message = MIMEText(body)
        message['to'] = to_email
        message['subject'] = subject
        message['from'] = profile.get('email', credentials.id_token.get('email') if hasattr(credentials, 'id_token') else '')
        
        # Encode message
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        
        # Send email
        service = build('gmail', 'v1', credentials=credentials)
        send_message = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()
        
        return jsonify({'success': True, 'message_id': send_message.get('id')})
        
    except HttpError as error:
        return jsonify({'error': f'Gmail API error: {error}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-email', methods=['POST'])
def generate_email():
    try:
        data = request.get_json()
        user_id = get_user_id()
        profiles = load_user_profiles()
        user_profile = profiles.get(user_id, {})
        
        # Get user profile data or use provided data
        job_role = data.get('job_role', '') or user_profile.get('job_role', '')
        purpose = data.get('purpose', '')
        tone = data.get('tone', 'professional')
        recipient_name = data.get('recipient_name', '')
        recipient_company = data.get('recipient_company', '')
        additional_context = data.get('additional_context', '')
        
        if not purpose:
            return jsonify({'error': 'Email purpose is required'}), 400
        
        # Build comprehensive prompt with user profile
        user_name = user_profile.get('name', '')
        user_email = user_profile.get('email', '')
        user_linkedin = user_profile.get('linkedin', '')
        user_phone = user_profile.get('phone', '')
        user_job_pref = user_profile.get('job_preference', '')
        user_location_pref = user_profile.get('location_preference', '')
        
        system_instruction = "You are an expert email writer who crafts compelling, effective cold emails and professional correspondence. Always include complete contact information in the signature."
        
        prompt = f"""Generate a {tone} cold email based on the following details:

SENDER INFORMATION (include in signature):
- Name: {user_name if user_name else '[Not provided]'}
- Email: {user_email if user_email else '[Not provided]'}
- LinkedIn: {user_linkedin if user_linkedin else '[Not provided]'}
- Phone: {user_phone if user_phone else '[Not provided]'}
- Current/Desired Role: {job_role if job_role else '[Not specified]'}
- Job Preference: {user_job_pref if user_job_pref else '[Not specified]'}
- Location Preference: {user_location_pref if user_location_pref else '[Not specified]'}

RECIPIENT INFORMATION:
- Name: {recipient_name if recipient_name else 'Not specified'}
- Company: {recipient_company if recipient_company else 'Not specified'}

EMAIL DETAILS:
- Purpose: {purpose}
- Additional Context: {additional_context if additional_context else 'None'}

Write a compelling, well-structured email that:
- Has an engaging subject line
- Opens with a strong hook personalized to the recipient
- Clearly communicates the purpose
- Is appropriate for the {tone} tone
- Ends with a clear call-to-action
- Is concise and professional (3-4 paragraphs max)
- Includes a complete professional signature with all available contact information (name, email, LinkedIn, phone, job role)
- Does NOT include any placeholders like [Your Name] or [Your Email] - use the actual information provided above

Format the response as:
Subject: [subject line]

[email body with complete signature]
"""
        
        # Using gemini-2.5-flash as specified in the blueprint
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )
        
        generated_email = response.text if response.text else "Failed to generate email"
        
        return jsonify({'email': generated_email})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
