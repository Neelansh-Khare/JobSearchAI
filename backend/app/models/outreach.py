from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Outreach(Base):
    __tablename__ = "outreach"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True) # Outreach might not always be tied to a specific job

    to_name = Column(String, nullable=False)
    to_email_or_profile = Column(String, nullable=False)
    channel = Column(String, nullable=False) # e.g., 'Email', 'LinkedIn'
    generated_message = Column(Text, nullable=False)
    variant_index = Column(Integer, default=0)
    status = Column(String, default="Draft") # e.g., 'Draft', 'Sent', 'Replied'
    sent_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="outreach_items")
    job = relationship("Job", back_populates="outreach_items")
