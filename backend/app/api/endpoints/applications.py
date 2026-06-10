from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.application import Application
from app.schemas.application import ApplicationUpdate, ApplicationResponse
from app.api import deps
from app.models.user import User
from app.services.interview_prep_service import InterviewPrepService
from typing import Any, Dict, List
from datetime import datetime as dt

router = APIRouter(prefix="/applications", tags=["applications"])

@router.get("/follow-ups", response_model=List[ApplicationResponse])
def get_pending_follow_ups(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Return applications where follow_up_date has passed and status is pending."""
    now = dt.utcnow()
    pending = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.follow_up_date <= now,
        Application.follow_up_status == "pending"
    ).all()
    return pending

@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: int,
    application_update: ApplicationUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an application's details (e.g., interview info).
    """
    db_application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = application_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_application, field, value)
    
    db.commit()
    db.refresh(db_application)
    return db_application

@router.post("/{application_id}/interview-prep", response_model=Dict[str, Any])
def generate_interview_prep(
    application_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate tailored interview preparation material for an application.
    """
    db_application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")

    interview_service = InterviewPrepService(db)
    try:
        prep_data = interview_service.generate_prep(application_id, current_user.id)
        
        # Save to database
        db_application.generated_interview_prep = prep_data
        db.commit()
        
        return prep_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
