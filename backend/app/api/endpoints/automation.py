import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.automation import AutoApplyRequest
from app.services.browser_automation import BrowserAutomationService
from app.api import deps
from app.models.user import User

router = APIRouter(prefix="/automation", tags=["automation"])
logger = logging.getLogger(__name__)

@router.post("/apply")
async def auto_apply(
    request: AutoApplyRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger the browser automation to apply for a job.
    """
    
    # 2. Prepare User Data
    # Merge explicit request data with user preferences/profile
    user_prefs = current_user.preferences if current_user.preferences else {}
    profile = user_prefs.get("profile", {})
    
    user_data = {
        "first_name": request.first_name or profile.get("first_name", ""),
        "last_name": request.last_name or profile.get("last_name", ""),
        "email": request.email or current_user.email,
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
