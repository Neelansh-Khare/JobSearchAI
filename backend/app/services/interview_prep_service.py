import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models.application import Application
from .ollama_client import generate_text as _ollama_generate

logger = logging.getLogger(__name__)

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
            content = _ollama_generate(
                prompt=prompt,
                system_prompt=system_instruction,
                temperature=0.7,
                json_mode=True,
            )
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    return json.loads(content[json_start:json_end])
                raise ValueError("Failed to parse AI response as JSON")

        except Exception as e:
            logger.error(f"Error generating interview prep: {str(e)}")
            raise Exception(f"Failed to generate interview prep: {str(e)}")
