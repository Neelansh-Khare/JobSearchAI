import os
import json
import logging
from typing import Dict, Any, List, Optional

import google.generativeai as genai
import google.generativeai.types as types
from apify_client import ApifyClient
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.outreach import Outreach

logger = logging.getLogger(__name__)

# Initialize Gemini client
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class EmailGeneratorService:
    def __init__(self, db: Session):
        self.db = db
        self.apify_api_token = os.environ.get('APIFY_API_TOKEN')

    def _load_apify_client(self) -> Optional[ApifyClient]:
        """Loads ApifyClient if API token is available."""
        if self.apify_api_token:
            return ApifyClient(self.apify_api_token)
        return None

    def _find_linkedin_contacts(self, company_type: str, role_types: List[str], location: str, max_results: int = 5) -> Optional[List[Dict[str, Any]]]:
        """
        Find real LinkedIn contacts using Apify LinkedIn People Search.
        """
        apify_client = self._load_apify_client()
        if not apify_client:
            logger.warning("APIFY_API_TOKEN not set, cannot use LinkedIn contact search.")
            return None

        try:
            role_query = " OR ".join(role_types) if role_types else ""
            search_query = f"{role_query} {location}".strip()

            if not search_query:
                logger.warning("Empty search query for LinkedIn contacts.")
                return None
            
            # Map company types to LinkedIn company searches (simplified)
            company_keywords = []
            if 'big tech' in company_type.lower() or 'faang' in company_type.lower():
                company_keywords = ['Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Netflix']
            elif 'startup' in company_type.lower():
                company_keywords = ['startup', 'tech startup']
            else:
                company_keywords = [company_type]
            
            contacts = []
            
            # Using a generic LinkedIn profile scraper approach
            # Actor ID might need adjustment based on Apify account or availability
            actor_id = "keheliya/linkedin-people-search" # or other suitable actor

            run_input = {
                "searchKeywords": search_query,
                "maxResults": max_results,
                "location": location,
            }
            
            # Run the actor
            logger.info(f"Running Apify actor '{actor_id}' with input: {run_input}")
            run = apify_client.actor(actor_id).call(run_input=run_input)
            
            # Fetch results
            results = []
            for item in apify_client.dataset(run["defaultDatasetId"]).iterate_items():
                results.append(item)
            
            # Transform results to our contact format
            for profile in results[:max_results]:
                full_name = profile.get('fullName', '')
                headline = profile.get('headline', '')
                company = profile.get('company', '') or (headline.split(' at ')[-1] if ' at ' in headline else '')
                profile_url = profile.get('profileUrl', '')
                location_str = profile.get('location', location)
                
                title = headline.split(' at ')[0] if ' at ' in headline else headline
                
                # Check if title matches any of our role types
                title_matches = any(role.lower() in title.lower() for role in role_types) if role_types else True
                
                if full_name and title_matches:
                    contact = {
                        'name': full_name,
                        'title': title,
                        'company': company if company else 'Unknown',
                        'location': location_str,
                        'linkedin_url': profile_url,
                        'source': 'linkedin'
                    }
                    contacts.append(contact)
            
            return contacts if contacts else None
            
        except Exception as e:
            logger.error(f"LinkedIn search error with Apify: {str(e)}")
            return None

    def _find_contacts_gemini(self, company_type: str, role_types: List[str], location: str) -> List[Dict[str, Any]]:
        """
        Fallback: Generate fictional contacts using Gemini.
        """
        role_types_str = ', '.join(role_types) if role_types else 'Hiring Manager, Recruiter, Software Engineer'
        prompt = f"""Generate a list of 5 potential hiring manager contacts at {company_type} companies in {location}.

For each contact, provide:
- Name (realistic but fictional to demonstrate the concept)
- Title (should be one of: {role_types_str})
- Company (real {company_type} company names)
- Location

Format as a JSON array with objects containing: name, title, company, location

Example format:
[
  {{"name": "John Doe", "title": "Staff Engineer", "company": "Google", "location": "San Francisco, CA"}},
  ...
]

IMPORTANT: Return ONLY the JSON array, no other text."""

        try:
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            contacts_text = response.text if response.text else "[]"
            contacts = json.loads(contacts_text)
            
            # Add source marker and ensure linkedin_url
            for contact in contacts:
                contact['source'] = 'fictional'
                if 'linkedin_url' not in contact:
                    contact['linkedin_url'] = ''
            
            return contacts
        except Exception as e:
            logger.error(f"Gemini fictional contact generation error: {str(e)}")
            return []

    def find_contacts(self, user_id: int, company_type: str, role_types: List[str], location: str, use_linkedin: bool = False, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Orchestrates contact finding, trying LinkedIn first if requested, then Gemini as fallback.
        """
        contacts = []
        if use_linkedin and self.apify_api_token:
            linkedin_contacts = self._find_linkedin_contacts(company_type, role_types, location, max_results)
            if linkedin_contacts:
                contacts = linkedin_contacts
        
        if not contacts: # Fallback to Gemini
            contacts = self._find_contacts_gemini(company_type, role_types, location)
        
        return contacts

    def generate_email(self, user_id: int, purpose: str, tone: str, recipient_name: str, recipient_company: str, additional_context: Optional[str] = None) -> str:
        """
        Generates an email using Gemini based on user profile and email details.
        """
        user = self.db.query(User).filter(User.id == user_id).first()

        if not user:
            raise ValueError(f"User with ID {user_id} not found.")

        # Construct user profile data from the User model
        preferences = user.preferences if user.preferences else {}
        user_profile_data = {
            'name': preferences.get('full_name', 'Applicant'),
            'email': user.email,
            'linkedin': preferences.get('linkedin_url', ''),
            'phone': preferences.get('phone_number', ''),
            'job_preference': preferences.get('job_preference', ''),
            'location_preference': preferences.get('location_preference', ''),
            'job_role': preferences.get('current_role', ''),
        }
        
        system_instruction = "You are an expert email writer who crafts compelling, effective cold emails and professional correspondence. Always include complete contact information in the signature."
        
        prompt = f"""Generate a {tone} cold email based on the following details:

SENDER INFORMATION (include in signature):
- Name: {user_profile_data['name'] if user_profile_data['name'] else '[Not provided]'}
- Email: {user_profile_data['email'] if user_profile_data['email'] else '[Not provided]'}
- LinkedIn: {user_profile_data['linkedin'] if user_profile_data['linkedin'] else '[Not provided]'}
- Phone: {user_profile_data['phone'] if user_profile_data['phone'] else '[Not provided]'}
- Current/Desired Role: {user_profile_data['job_role'] if user_profile_data['job_role'] else '[Not specified]'}
- Job Preference: {user_profile_data['job_preference'] if user_profile_data['job_preference'] else '[Not specified]'}
- Location Preference: {user_profile_data['location_preference'] if user_profile_data['location_preference'] else '[Not specified]'}

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
        try:
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction
                )
            )
            return response.text if response.text else "Failed to generate email"
        except Exception as e:
            logger.error(f"Gemini email generation error: {str(e)}")
            return f"Error generating email: {str(e)}"
