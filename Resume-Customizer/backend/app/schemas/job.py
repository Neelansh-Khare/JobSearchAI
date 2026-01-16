"""
Pydantic schemas for Job model.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.job import JobStatus


class JobCreate(BaseModel):
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    description: str = Field(..., description="Job description text")
    url: Optional[str] = Field(None, description="Job posting URL")
    source: Optional[str] = Field(None, description="Job source (e.g., LinkedIn, Indeed)")
    status: Optional[JobStatus] = Field(JobStatus.NEW, description="Application status")
    salary_range: Optional[str] = Field(None, description="Salary range")
    remote_policy: Optional[str] = Field(None, description="Remote policy (Remote, Hybrid, On-site)")
    location: Optional[str] = Field(None, description="Job location")


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None
    status: Optional[JobStatus] = None
    salary_range: Optional[str] = None
    remote_policy: Optional[str] = None
    location: Optional[str] = None


class JobResponse(BaseModel):
    id: int
    user_id: int
    title: str
    company: str
    description: str
    url: Optional[str]
    source: Optional[str]
    status: JobStatus
    salary_range: Optional[str]
    remote_policy: Optional[str]
    location: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
