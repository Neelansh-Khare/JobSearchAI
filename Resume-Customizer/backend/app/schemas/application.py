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


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    resume_id: int
    tailored_resume_path: Optional[str]
    tailored_resume_s3_url: Optional[str]
    cover_letter_text: Optional[str]
    cover_letter_s3_url: Optional[str]
    applied_at: Optional[datetime]
    last_status_update: Optional[datetime]
    current_stage: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
