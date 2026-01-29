"""
Resume processing utility functions.
Extracted from main.py to avoid circular imports.
"""
import PyPDF2
import io
import json
import re
import logging
from typing import Dict, Any
from datetime import datetime
from main import (
    extract_text_from_pdf as _extract_text_from_pdf,
    extract_resume_data as _extract_resume_data,
    extract_job_description_data as _extract_job_description_data,
    tailor_resume_for_job as _tailor_resume_for_job,
    calculate_ats_score as _calculate_ats_score,
    create_resume_filename as _create_resume_filename,
    generate_resume_pdf as _generate_resume_pdf,
    save_resume_json as _save_resume_json
)

logger = logging.getLogger(__name__)


# Re-export functions for easier access
def extract_text_from_pdf(pdf_file: bytes) -> str:
    return _extract_text_from_pdf(pdf_file)


def extract_resume_data(text: str) -> Dict[str, Any]:
    return _extract_resume_data(text)


def extract_job_description_data(text: str) -> Dict[str, str]:
    return _extract_job_description_data(text)


def tailor_resume_for_job(resume_sections: Dict[str, Any], job_desc: Dict[str, str]) -> Dict[str, Any]:
    return _tailor_resume_for_job(resume_sections, job_desc)


def calculate_ats_score(resume_data: Dict[str, Any], job_description: Dict[str, str], is_optimized: bool = False) -> Dict[str, Any]:
    return _calculate_ats_score(resume_data, job_description, is_optimized)


def create_resume_filename(customized_resume: Dict[str, Any], job_description: Dict[str, str]) -> str:
    return _create_resume_filename(customized_resume, job_description)


def generate_resume_pdf(customized_resume: Dict[str, Any], filename: str):
    return _generate_resume_pdf(customized_resume, filename)


def save_resume_json(customized_resume: Dict[str, Any], filename: str):
    return _save_resume_json(customized_resume, filename)
