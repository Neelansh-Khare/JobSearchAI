import os
import json
import logging
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from sqlalchemy.orm import Session
from ..models.application import Application

logger = logging.getLogger(__name__)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.0-flash"

class InterviewPrepService:
    def __init__(self, db: Session):
        self.db = db

    def generate_prep(self, application_id: int, user_id: int) -> Dict[str, Any]:
        """
        Generate tailored interview preparation material.
        """
        application = self.db.query(Application).filter(
            Application.id == application_id,
            Application.user_id == user_id
        ).first()

        if not application:
            raise ValueError("Application not found")

        job = application.job
        resume = application.resume

        if not job or not resume:
            raise ValueError("Job or Resume details missing from application")

        system_instruction = "You are an expert interview coach and career counselor. You specialize in helping candidates prepare for technical and behavioral interviews at top companies."

        prompt = f"""Generate a comprehensive interview preparation guide for the following job and applicant:

JOB TITLE: {job.title}
COMPANY: {job.company}
JOB DESCRIPTION:
{job.description}

APPLICANT RESUME:
{resume.raw_text}

Generate a structured guide including:
1.  **Top 5 Behavioral Questions** tailored to this job and the applicant's background. For each, provide a "Why they ask" and "Suggested talking points" based on the applicant's resume.
2.  **Top 5 Technical/Role-Specific Questions** based on the job description.
3.  **Company Research Points**: 3-5 key things the applicant should know about {job.company} or its industry.
4.  **Questions to Ask**: 3-5 thoughtful questions the applicant should ask the interviewer.

Format the response as a JSON object with the following structure:
{{
  "behavioral_questions": [
    {{
      "question": "...",
      "why_ask": "...",
      "talking_points": "..."
    }},
    ...
  ],
  "technical_questions": [
    {{
      "question": "...",
      "expected_topics": "..."
    }},
    ...
  ],
  "company_research": ["...", "..."],
  "questions_to_ask": ["...", "..."]
}}

IMPORTANT: Return ONLY the JSON object, no other text."""

        try:
            model = genai.GenerativeModel(
                model_name=MODEL_NAME,
                system_instruction=system_instruction
            )
            
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    response_mime_type="application/json"
                )
            )
            
            content = response.text
            try:
                prep_data = json.loads(content)
                return prep_data
            except json.JSONDecodeError:
                # Attempt to extract JSON if it's wrapped in markdown
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    return json.loads(content[json_start:json_end])
                raise ValueError("Failed to parse AI response as JSON")
                
        except Exception as e:
            logger.error(f"Error generating interview prep: {str(e)}")
            raise Exception(f"Failed to generate interview prep: {str(e)}")
