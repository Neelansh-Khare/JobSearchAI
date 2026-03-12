from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.db.database import get_db
from app.schemas.outreach import EmailGenerateRequest, ContactFindRequest, ContactResponse # Assuming these schemas will be created
from app.services.email_generator import EmailGeneratorService
from app.api import deps
from app.models.user import User

router = APIRouter()

@router.post("/email/generate", response_model=Dict[str, str], status_code=status.HTTP_200_OK)
def generate_outreach_email(
    request: EmailGenerateRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates an outreach email using AI.
    """
    email_generator = EmailGeneratorService(db)
    try:
        generated_email_content = email_generator.generate_email(
            user_id=current_user.id,
            purpose=request.purpose,
            tone=request.tone,
            recipient_name=request.recipient_name,
            recipient_company=request.recipient_company,
            additional_context=request.additional_context
        )
        return {"email_content": generated_email_content}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate email: {e}")


@router.post("/contacts/find", response_model=List[ContactResponse], status_code=status.HTTP_200_OK)
def find_outreach_contacts(
    request: ContactFindRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Finds potential outreach contacts using LinkedIn (Apify) or AI.
    """
    email_generator = EmailGeneratorService(db)
    try:
        contacts = email_generator.find_contacts(
            user_id=current_user.id,
            company_type=request.company_type,
            role_types=request.role_types,
            location=request.location,
            use_linkedin=request.use_linkedin,
            max_results=request.max_results
        )
        return contacts
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to find contacts: {e}")