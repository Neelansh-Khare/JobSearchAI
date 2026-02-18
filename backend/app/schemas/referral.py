from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ReferralBase(BaseModel):
    company: str
    contact_name: str
    contact_email_or_profile: Optional[str] = None
    relationship: Optional[str] = None
    status: Optional[str] = "Identified"
    notes: Optional[str] = None
    job_id: Optional[int] = None

class ReferralCreate(ReferralBase):
    user_id: int

class ReferralUpdate(BaseModel):
    company: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email_or_profile: Optional[str] = None
    relationship: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    job_id: Optional[int] = None

class ReferralSchema(ReferralBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
