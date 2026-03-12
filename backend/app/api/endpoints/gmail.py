from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.database import get_db
from app.services.gmail_service import GmailService
from app.schemas.gmail import GmailSendRequest
from app.api import deps
from app.models.user import User

router = APIRouter(prefix="/gmail", tags=["gmail"])

@router.post("/scan")
def scan_gmail(
    current_user: User = Depends(deps.get_current_user),
    days_back: int = Query(7, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    """
    Scan Gmail for job application status updates.
    """
    try:
        gmail_service = GmailService(db)
        updates = gmail_service.scan_for_updates(current_user.id, days_back)
        
        return {
            "status": "success",
            "updates_found": len(updates),
            "updates": updates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send", status_code=status.HTTP_200_OK)
def send_gmail(
    request: GmailSendRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send an email via the user's Gmail account.
    """
    try:
        gmail_service = GmailService(db)
        success = gmail_service.send_email(
            user_id=current_user.id,
            recipient_email=request.recipient_email,
            subject=request.subject,
            body=request.body
        )
        
        if success:
            return {"status": "success", "message": "Email sent successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send email via Gmail. Check your credentials and permissions."
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
