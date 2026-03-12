"""
User model - represents a user account.
"""
from sqlalchemy import Column, Integer, String, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    preferences = Column(JSON, nullable=True)  # e.g., {"remote": True, "salary": 100000, "roles": ["Software Engineer"]}
    linkedin_token = Column(String, nullable=True)
    gmail_token = Column(JSON, nullable=True) # Full credentials object
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    outreach_items = relationship("Outreach", back_populates="user")
    jobs = relationship("Job", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    referrals = relationship("Referral", back_populates="user", cascade="all, delete-orphan")

