"""
Pydantic schemas for Resume model.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ResumeCreate(BaseModel):
    raw_text: Optional[str] = Field(None, description="Original resume text")
    file_path: Optional[str] = Field(None, description="Path to resume file")
    s3_url: Optional[str] = Field(None, description="S3 URL for resume")
    tags: Optional[List[str]] = Field(None, description="Resume tags")


class ResumeResponse(BaseModel):
    id: int
    user_id: int
    raw_text: Optional[str]
    file_path: Optional[str]
    s3_url: Optional[str]
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
