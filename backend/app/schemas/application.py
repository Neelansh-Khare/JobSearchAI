"""
Pydantic schemas for Application model.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ApplicationCreate(BaseModel):
    job_id: int = Field(..., description="ID of the job")
    resume_id: int = Field(..., description="ID of the resume")
    cover_letter_text: Optional[str] = Field(None, description="Cover letter text")
    applied_at: Optional[datetime] = Field(None, description="Application submission date")


class ApplicationUpdate(BaseModel):
    cover_letter_text: Optional[str] = None
    applied_at: Optional[datetime] = None
    current_stage: Optional[str] = None
    interview_date: Optional[datetime] = None
    interview_notes: Optional[str] = None
    interviewer_names: Optional[str] = None
    generated_interview_prep: Optional[dict] = None
    follow_up_date: Optional[datetime] = None
    follow_up_status: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    resume_id: int
    tailored_resume_path: Optional[str]
    tailored_resume_s3_url: Optional[str]
    cover_letter_text: Optional[str]
    cover_letter_s3_url: Optional[str]
    applied_at: Optional[datetime]
    last_status_update: Optional[datetime]
    current_stage: Optional[str]
    interview_date: Optional[datetime]
    interview_notes: Optional[str]
    interviewer_names: Optional[str]
    generated_interview_prep: Optional[dict]
    follow_up_date: Optional[datetime]
    follow_up_status: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
