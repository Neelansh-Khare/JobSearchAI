import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.automation import AutoApplyRequest
from app.services.browser_automation import BrowserAutomationService
from app.models.user import User

router = APIRouter(prefix="/automation", tags=["automation"])
logger = logging.getLogger(__name__)

@router.post("/apply")
async def auto_apply(
    request: AutoApplyRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger the browser automation to apply for a job.
    This is a long-running task, so for V1 we might run it in background 
    or await it (blocking). 
    Since Playwright is async, awaiting it is okay for a demo, but 
    for production it should be a background task.
    """
    
    # 1. Fetch User
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Prepare User Data
    # Merge explicit request data with user preferences/profile
    user_prefs = user.preferences if user.preferences else {}
    profile = user_prefs.get("profile", {})
    
    user_data = {
        "first_name": request.first_name or profile.get("first_name", ""),
        "last_name": request.last_name or profile.get("last_name", ""),
        "email": request.email or user.email,
        "phone": request.phone or profile.get("phone", ""),
        "linkedin": request.linkedin or profile.get("linkedin", "")
    }
    
    # 3. Resume Path
    # If not provided, try to find the latest resume for the user?
    # For now, require it or use a placeholder if testing.
    resume_path = request.resume_path
    
    # 4. Trigger Automation
    # using the service
    service = BrowserAutomationService()
    
    # We await it here to return the result immediately for the UI feedback.
    # In a real app, we'd return a task ID.
    try:
        result = await service.apply_to_job(request.job_url, user_data, resume_path)
        return result
    except Exception as e:
        logger.error(f"Automation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
