from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)

    company = Column(String, nullable=False)
    contact_name = Column(String, nullable=False)
    contact_email_or_profile = Column(String, nullable=True)
    relationship = Column(String, nullable=True) # e.g., 'Ex-colleague', 'Friend'
    status = Column(String, default="Identified") # e.g., 'Identified', 'Contacted', 'Requested', 'Referred'
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="referrals")
    job = relationship("Job", backref="referrals")
