import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.automation import AutoApplyRequest
from app.services.browser_automation import BrowserAutomationService
from app.api import deps
from app.models.user import User

from app.models.application import Application
from app.models.resume import Resume
import os

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
    user_prefs = current_user.preferences if current_user.preferences else {}
    profile = user_prefs.get("profile", {})
    
    user_data = {
        "first_name": request.first_name or profile.get("first_name", ""),
        "last_name": request.last_name or profile.get("last_name", ""),
        "email": request.email or current_user.email,
        "phone": request.phone or profile.get("phone", ""),
        "linkedin": request.linkedin or profile.get("linkedin", "")
    }
    
    # 3. Resume Path Resolution
    resume_path = request.resume_path
    
    # If job_id provided, try to find a tailored resume
    if not resume_path and request.job_id:
        app = db.query(Application).filter(
            Application.job_id == request.job_id,
            Application.user_id == current_user.id
        ).order_by(Application.created_at.desc()).first()
        
        if app and app.tailored_resume_path:
            resume_path = app.tailored_resume_path
            # Ensure path is absolute if it's relative to project root
            if not os.path.isabs(resume_path):
                # Check if it starts with 'output/'
                if not resume_path.startswith('output/'):
                    # It might be just the filename or pdfs/filename.pdf
                    # We'll try to find it in the output dir
                    pass
    
    # If still no resume path, find latest resume
    if not resume_path:
        latest_resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).first()
        if latest_resume and latest_resume.file_path:
             # This is tricky because we don't save the original PDF yet.
             # We only have raw_text.
             # For now, if no tailored resume, we can't easily auto-apply with a PDF.
             pass
    
    # 4. Trigger Automation
    service = BrowserAutomationService()
    
    try:
        result = await service.apply_to_job(request.job_url, user_data, resume_path)
        return result
    except Exception as e:
        logger.error(f"Automation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
