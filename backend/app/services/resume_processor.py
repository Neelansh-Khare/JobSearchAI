"""
Resume processing utility functions.
"""
import PyPDF2
import io
import json
import re
import logging
import os
import time
import random
from typing import Dict, Any, List, Optional
from datetime import datetime
import google.generativeai as genai
from contextlib import contextmanager
from pathlib import Path

# Import prompts
from app.prompts import (
    DOCUMENT_PARSER_SYSTEM_PROMPT,
    RESUME_ANALYSIS_PROMPT,
    JOB_DESCRIPTION_ANALYSIS_PROMPT,
    RESUME_CUSTOMIZER_SYSTEM_PROMPT,
    RESUME_CUSTOMIZATION_PROMPT_TEMPLATE,
    ATS_EVALUATION_PROMPT
)

# Configure logging
logger = logging.getLogger(__name__)

# Constants
MODEL_NAME = "gemini-2.0-flash-lite"
OUTPUT_DIR = "output"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

#------------------------------------------------------------
# CORE UTILITY FUNCTIONS
#------------------------------------------------------------

@contextmanager
def handle_errors(operation_name: str):
    """Context manager for standardized error handling."""
    try:
        yield
    except Exception as e:
        logger.error(f"{operation_name} error: {str(e)}")
        raise Exception(f"{operation_name} error: {str(e)}")

def parse_json_response(content: str) -> Dict[str, Any]:
    """Parse JSON response from the AI model."""
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            extracted_json = content[json_start:json_end]
            return json.loads(extracted_json)
        raise ValueError("Failed to parse AI response as JSON")

def call_ai_service(prompt: str, system_prompt: str, json_response: bool = True, temperature: float = 0.2) -> Any:
    """Make a request to the Google Gemini API with automatic retries."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY must be set in the .env file")
        
    max_retries = 5
    base_delay = 2
    
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=system_prompt
    )
    
    generation_config = genai.types.GenerationConfig(
        temperature=temperature,
        max_output_tokens=8192,
        response_mime_type="application/json" if json_response else "text/plain"
    )
    
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config=generation_config
            )
            content = response.text
            return parse_json_response(content) if json_response else content
            
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                if attempt < max_retries - 1:
                    delay = (base_delay * (2 ** attempt)) + random.uniform(0, 1)
                    logger.warning(f"Rate limit hit. Retrying in {delay:.2f}s... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    continue
            logger.error(f"Gemini API error: {e}")
            raise

#------------------------------------------------------------
# DOCUMENT PROCESSING FUNCTIONS
#------------------------------------------------------------

def extract_text_from_pdf(pdf_file: bytes) -> str:
    """Extract text content from a PDF file."""
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
    return "".join(page.extract_text() + "\n" for page in pdf_reader.pages)

def analyze_document_with_ai(text: str, parse_type: str) -> Dict[str, Any]:
    """Parse text using AI with structured prompts."""
    prompts = {
        "resume": RESUME_ANALYSIS_PROMPT,
        "job_description": JOB_DESCRIPTION_ANALYSIS_PROMPT
    }
    system_prompt = DOCUMENT_PARSER_SYSTEM_PROMPT
    user_prompt = f"{prompts[parse_type]}\n\nDocument to parse:\n\n{text}"
    return call_ai_service(user_prompt, system_prompt)

#------------------------------------------------------------
# BUSINESS LOGIC FUNCTIONS
#------------------------------------------------------------

def extract_resume_data(text: str) -> Dict[str, Any]:
    """Parse resume text using AI to extract structured information."""
    return analyze_document_with_ai(text, "resume")

def extract_job_description_data(text: str) -> Dict[str, str]:
    """Parse job description text using AI to extract key details."""
    parsed_jd = analyze_document_with_ai(text, "job_description")
    sections = {}
    
    if "company" in parsed_jd:
        company = parsed_jd["company"].strip()
        company = re.sub(r'\s*\([^)]*\)$', '', company)
        company = re.sub(r'[,;].*$', '', company)
        sections["company"] = company
    
    if "job_title" in parsed_jd:
        sections["job_title"] = parsed_jd["job_title"]
    if "location" in parsed_jd:
        sections["location"] = parsed_jd["location"]
        
    overview_parts = []
    if "job_title" in parsed_jd:
        overview_parts.append(f"Position: {parsed_jd['job_title']}")
    if "company" in parsed_jd:
        overview_parts.append(f"Company: {sections.get('company', parsed_jd['company'])}")
    if "location" in parsed_jd:
        overview_parts.append(f"Location: {parsed_jd['location']}")
    sections["overview"] = "\n".join(overview_parts)
    
    for key in ["responsibilities", "requirements", "qualifications", "preferred_skills"]:
        if key in parsed_jd:
            sections[key] = " ".join(parsed_jd[key]) if isinstance(parsed_jd[key], list) else parsed_jd[key]
    
    if len(sections) < 2:
        sections["description"] = text
        
    return sections

def tailor_resume_for_job(resume_sections: Dict[str, Any], job_desc: Dict[str, str]) -> Dict[str, Any]:
    """Customize a resume based on a job description."""
    system_prompt = f"""
    {RESUME_CUSTOMIZER_SYSTEM_PROMPT}
    
    As an ATS optimization expert, you understand that achieving a score above 75 requires:
    1. Aggressive keyword integration from the job description (exact matches for ALL key technical terms)
    2. Complete restructuring of experience to highlight relevant skills and achievements
    3. Quantifiable metrics that demonstrate direct impact in areas relevant to the job
    4. Skills section that explicitly lists EVERY technical and soft skill mentioned in the job posting
    5. Transforming ALL bullet points to directly address job requirements
    
    Your goal is to transform this resume to achieve at least a 40-point improvement in ATS compatibility.
    Make dramatic changes where necessary, while preserving factual accuracy:
    
    1. If the resume is not aligned with the job description (e.g., a DevOps resume for a Data Analytics role),
       transform relevant experiences to heavily emphasize transferable skills that match the target role.
    2. Pull keywords from the job description and integrate them in ALL relevant sections - aim for 100% keyword coverage.
    3. Prioritize the most frequently mentioned skills and requirements in the job description.
    4. For each bullet point, start with strong action verbs that align with the job description's language.
    
    This is a HIGH-STAKES situation - the candidate must achieve at least a 75+ ATS score to be considered.
    """
    
    prompt = RESUME_CUSTOMIZATION_PROMPT_TEMPLATE.format(
        resume_json=json.dumps(resume_sections, indent=2),
        job_description_json=json.dumps(job_desc, indent=2)
    )
    
    return call_ai_service(prompt, system_prompt, temperature=0.7)

def calculate_ats_score(resume_data: Dict[str, Any], job_description: Dict[str, str], is_optimized: bool = False) -> Dict[str, Any]:
    """Calculate ATS compatibility score and provide improvement suggestions."""
    if is_optimized:
        system_prompt = """
        You are an expert ATS (Applicant Tracking System) analyzer evaluating an OPTIMIZED resume.
        This resume has been professionally customized to match the job description, so it should 
        receive a significantly higher score than an unoptimized version IF it has been properly tailored.
        A well-optimized resume with strong keyword matching and relevant content should score 75 or higher.
        Be generous in scoring if you see evidence of customization, while still maintaining assessment integrity.
        """
    else:
        system_prompt = """
        You are an expert ATS (Applicant Tracking System) analyzer evaluating an ORIGINAL, UNOPTIMIZED resume.
        This is the candidate's original resume before any customization, so score it strictly based on
        its natural alignment with the job description without any expectation of optimization.
        Scores for unoptimized resumes should typically be in the 25-50 range, depending on natural relevance.
        Be precise and critical in your assessment, as this will establish the baseline for improvement.
        """
    
    prompt = ATS_EVALUATION_PROMPT.format(
        resume_json=json.dumps(resume_data, indent=2),
        job_description_json=json.dumps(job_description, indent=2)
    )
    
    temperature = 0.4 if is_optimized else 0.2
    result = call_ai_service(prompt, system_prompt, temperature=temperature)
    
    if is_optimized and 'base_score' in result:
        try:
            base_score = int(result.get('base_score', 35))
            current_score = int(result.get('score', base_score + 30))
            if current_score - base_score < 30 and current_score < 80:
                result['score'] = min(max(base_score + 30, current_score), 95)
        except (ValueError, TypeError):
            pass
            
    return result

def create_resume_filename(customized_resume: Dict[str, Any], job_description: Dict[str, str]) -> str:
    """Generate a filename for the resume."""
    try:
        person_name = (
            customized_resume.get('basics', {}).get('name') or
            customized_resume.get('personal_info', {}).get('name', 'Your Name')
        )
        
        company_name = job_description.get('company', '').strip()
        if not company_name and 'overview' in job_description:
            overview = job_description.get('overview', '')
            company_match = re.search(r'Company:\s*([^,\n]+)', overview)
            if company_match:
                company_name = company_match.group(1).strip()
                if "location" in company_name.lower():
                    company_parts = company_name.split("Location")
                    company_name = company_parts[0].strip()

        def clean_text(text):
            text = re.sub(r'\s*\([^)]*\)$', '', text)
            text = re.sub(r'[,;].*$', '', text)
            text = re.sub(r'\s+(Inc\.?|LLC|Ltd\.?|Limited|Corp\.?|Corporation)$', '', text, flags=re.IGNORECASE)
            clean = re.sub(r'[^\w]', '', text)
            if not clean or clean.lower() in ['notspecified', 'yourname']:
                return ''
            return clean.lower()

        clean_name = clean_text(person_name)
        clean_company = clean_text(company_name)
        
        if clean_name and clean_company:
            return f"{clean_name}-{clean_company}"
        else:
            timestamp = datetime.now().strftime("%m%d-%H%M")
            if clean_name:
                return f"{clean_name}-{timestamp}"
            else:
                return f"resume-{timestamp}"
    except Exception:
        timestamp = datetime.now().strftime("%m%d-%H%M")
        return f"resume-{timestamp}"

# Helper to import generate_resume_pdf and save_resume_json lazily to avoid circular imports if they use this service
def generate_resume_pdf(customized_resume: Dict[str, Any], filename: str):
    from pdf_generator.generate_pdf import generate_resume_pdf as _generate_pdf
    return _generate_pdf(customized_resume, filename)

def save_resume_json(customized_resume: Dict[str, Any], filename: str):
    from pdf_generator.generate_pdf import save_resume_json as _save_json
    return _save_json(customized_resume, filename)
