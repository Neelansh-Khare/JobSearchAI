from pydantic import BaseModel
from typing import Optional

class AutoApplyRequest(BaseModel):
    job_url: str
    user_id: Optional[int] = None # Filled from auth
    resume_path: Optional[str] = None # Or use a resume_id to fetch from DB
    
    # Optional overrides
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
