"""
Job model - represents a job listing.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base


class JobStatus(str, enum.Enum):
    """Job application status."""
    NEW = "New"
    SAVED = "Saved"
    APPLIED = "Applied"
    INTERVIEW = "Interview"
    OFFER = "Offer"
    REJECTED = "Rejected"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    url = Column(String, nullable=True)
    source = Column(String, nullable=True)  # e.g., "LinkedIn", "Indeed", "Company Website"
    status = Column(Enum(JobStatus), default=JobStatus.NEW, nullable=False)
    salary_range = Column(String, nullable=True)  # e.g., "$100k-$150k"
    remote_policy = Column(String, nullable=True)  # e.g., "Remote", "Hybrid", "On-site"
    location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
