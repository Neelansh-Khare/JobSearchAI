from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.database import get_db
from app.services.gmail_service import GmailService

router = APIRouter(prefix="/gmail", tags=["gmail"])

@router.post("/scan")
def scan_gmail(
    user_id: int = Query(1, description="User ID"),
    days_back: int = Query(7, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    """
    Scan Gmail for job application status updates.
    """
    try:
        gmail_service = GmailService(db)
        updates = gmail_service.scan_for_updates(user_id, days_back)
        
        return {
            "status": "success",
            "updates_found": len(updates),
            "updates": updates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
