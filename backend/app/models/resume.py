"""
Resume model - represents a resume document.
"""
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    raw_text = Column(Text, nullable=True)  # Original resume text
    file_path = Column(String, nullable=True)  # Path to original resume file
    s3_url = Column(String, nullable=True)  # S3 URL if stored in S3
    tags = Column(JSON, nullable=True)  # e.g., ["frontend", "backend", "fullstack"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="resumes")
    applications = relationship("Application", back_populates="resume")
