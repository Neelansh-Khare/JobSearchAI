from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class GmailSendRequest(BaseModel):
    recipient_email: EmailStr = Field(..., description="The email address of the recipient.")
    subject: str = Field(..., description="The subject of the email.")
    body: str = Field(..., description="The body content of the email.")
