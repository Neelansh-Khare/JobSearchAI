from pydantic import BaseModel, Field
from typing import List, Optional

class EmailGenerateRequest(BaseModel):
    purpose: str = Field(..., description="The purpose of the email (e.g., 'cold outreach', 'follow-up', 'referral request').")
    tone: str = Field("professional", description="The desired tone of the email (e.g., 'professional', 'friendly', 'assertive').")
    recipient_name: str = Field(..., description="The name of the email recipient.")
    recipient_company: str = Field(..., description="The company of the email recipient.")
    additional_context: Optional[str] = Field(None, description="Any additional context or details for generating the email.")

class ContactFindRequest(BaseModel):
    company_type: str = Field(..., description="The type of company to search for (e.g., 'big tech', 'startups', 'finance').")
    role_types: List[str] = Field(..., description="A list of job titles/roles to search for (e.g., ['Hiring Manager', 'Staff Engineer']).")
    location: str = Field(..., description="The geographical location for the search (e.g., 'San Francisco').")
    use_linkedin: bool = Field(False, description="Whether to attempt to use LinkedIn (via Apify) for contact search.")
    max_results: int = Field(5, gt=0, description="Maximum number of contacts to return.")

class ContactResponse(BaseModel):
    name: str = Field(..., description="The name of the contact.")
    title: str = Field(..., description="The job title of the contact.")
    company: str = Field(..., description="The company of the contact.")
    location: str = Field(..., description="The location of the contact.")
    linkedin_url: Optional[str] = Field(None, description="The LinkedIn profile URL of the contact.")
    source: str = Field(..., description="The source of the contact information (e.g., 'linkedin', 'fictional').")
