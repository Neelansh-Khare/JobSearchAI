from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.application import Application
from app.schemas.application import ApplicationUpdate, ApplicationResponse
from app.api import deps
from app.models.user import User

router = APIRouter(prefix="/applications", tags=["applications"])

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
