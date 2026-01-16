"""
Application model - represents a job application (links a job to a resume).
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False, index=True)
    tailored_resume_path = Column(String, nullable=True)  # Path to tailored PDF
    tailored_resume_s3_url = Column(String, nullable=True)  # S3 URL for tailored PDF
    cover_letter_text = Column(Text, nullable=True)
    cover_letter_s3_url = Column(String, nullable=True)  # S3 URL for cover letter PDF if generated
    applied_at = Column(DateTime(timezone=True), nullable=True)
    last_status_update = Column(DateTime(timezone=True), nullable=True)
    current_stage = Column(String, nullable=True)  # e.g., "Application Submitted", "Phone Screen", "On-site"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    job = relationship("Job", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
