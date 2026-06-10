"""
Job CRUD API endpoints.
"""
import os
import logging
import json as _json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.job import Job, JobStatus
from app.models.referral import Referral
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.schemas.referral import ReferralSchema
from app.api import deps
from app.models.user import User
from app.models.application import Application
from sqlalchemy import func
from datetime import datetime, timedelta
import google.generativeai as genai

logger = logging.getLogger(__name__)

_gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if _gemini_key:
    genai.configure(api_key=_gemini_key)

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/stats")
def get_job_stats(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get job search statistics for the current user.
    """
    # 1. Counts by status
    status_counts = db.query(Job.status, func.count(Job.id)).filter(
        Job.user_id == current_user.id
    ).group_by(Job.status).all()
    
    stats_dict = {status.value: count for status, count in status_counts}
    
    # 2. Velocity: Applications in the last 7 and 30 days
    thirty_days_ago = datetime.now() - timedelta(days=30)
    seven_days_ago = datetime.now() - timedelta(days=7)

    apps_last_30_days = db.query(func.count(Job.id)).filter(
        Job.user_id == current_user.id,
        Job.created_at >= thirty_days_ago,
        Job.status != JobStatus.NEW
    ).scalar()

    apps_last_7_days = db.query(func.count(Job.id)).filter(
        Job.user_id == current_user.id,
        Job.created_at >= seven_days_ago,
        Job.status != JobStatus.NEW
    ).scalar()

    # 3. Funnel: Applied -> Interview -> Offer
    total_applied = stats_dict.get(JobStatus.APPLIED.value, 0) + \
                    stats_dict.get(JobStatus.INTERVIEW.value, 0) + \
                    stats_dict.get(JobStatus.OFFER.value, 0) + \
                    stats_dict.get(JobStatus.REJECTED.value, 0)

    total_interviews = stats_dict.get(JobStatus.INTERVIEW.value, 0) + \
                       stats_dict.get(JobStatus.OFFER.value, 0)

    total_offers = stats_dict.get(JobStatus.OFFER.value, 0)

    return {
        "status_distribution": stats_dict,
        "velocity_30d": apps_last_30_days,
        "velocity_7d": apps_last_7_days,
        "funnel": {
            "applied": total_applied,
            "interviews": total_interviews,
            "offers": total_offers
        }
    }

@router.get("/{job_id}/match")
def get_job_match_score(
    job_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate a match score between a job and the user's latest resume.
    """
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get latest resume
    from app.models.resume import Resume
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).first()
    
    if not resume:
        return {"match_score": 0, "message": "No resume found to match against"}
    
    # Simple keyword-based matching for now (MVP)
    # In a real scenario, this would use LLM or vector search
    job_text = (job.title + " " + job.description).lower()
    resume_text = resume.raw_text.lower()
    
    # Basic skill extraction (mock list)
    skills = ["python", "react", "fastapi", "next.js", "typescript", "aws", "docker", "sql", "machine learning", "ai"]
    matched_skills = [skill for skill in skills if skill in job_text and skill in resume_text]
    
    # Calculate score
    # This is a very basic heuristic: base 50% + 5% per matched skill up to 100%
    score = 50 + (len(matched_skills) * 5)
    score = min(score, 100)
    
    return {
        "match_score": score,
        "matched_skills": matched_skills,
        "missing_skills": [skill for skill in skills if skill in job_text and skill not in resume_text]
    }

@router.get("/insights/next-actions")
def get_next_actions(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Return AI-generated actionable insights based on the user's job search data."""
    thirty_days_ago = datetime.now() - timedelta(days=30)
    seven_days_ago = datetime.now() - timedelta(days=7)

    status_counts = db.query(Job.status, func.count(Job.id)).filter(
        Job.user_id == current_user.id
    ).group_by(Job.status).all()
    counts = {str(s): c for s, c in status_counts}

    apps_7d = db.query(func.count(Job.id)).filter(
        Job.user_id == current_user.id,
        Job.created_at >= seven_days_ago,
        Job.status != JobStatus.NEW
    ).scalar() or 0

    stale_count = db.query(func.count(Job.id)).filter(
        Job.user_id == current_user.id,
        Job.status == JobStatus.APPLIED,
        Job.created_at <= datetime.now() - timedelta(days=14)
    ).scalar() or 0

    upcoming_interviews = db.query(func.count(Application.id)).filter(
        Application.user_id == current_user.id,
        Application.interview_date >= datetime.now()
    ).scalar() or 0

    prompt = f"""You are a career coach analyzing someone's job search. Based on the data below, give 3-4 short, specific, actionable next-step recommendations.

JOB SEARCH DATA:
- Applications this week: {apps_7d}
- Total by status: {counts}
- Applications applied 14+ days ago with no response: {stale_count}
- Upcoming interviews scheduled: {upcoming_interviews}

Return a JSON array of insight objects. Each object must have:
- "title": short action title (5-7 words)
- "description": one sentence explaining why
- "action_url": one of "/jobs", "/hunter", "/outreach", "/analytics", "/"
- "priority": "high", "medium", or "low"

Return ONLY the JSON array, no markdown."""

    try:
        model = genai.GenerativeModel("gemini-2.0-flash-lite")
        response = model.generate_content(prompt)
        insights = _json.loads(response.text)
        return {"insights": insights}
    except Exception as e:
        logger.warning(f"Gemini insights generation failed, using fallback: {e}")
        # Deterministic fallback
        fallback = []
        if apps_7d == 0:
            fallback.append({
                "title": "Apply to new jobs this week",
                "description": "You have no applications in the past 7 days.",
                "action_url": "/hunter",
                "priority": "high"
            })
        if stale_count > 0:
            fallback.append({
                "title": f"Follow up on {stale_count} stale application(s)",
                "description": "These were applied 2+ weeks ago with no status update.",
                "action_url": "/jobs",
                "priority": "high"
            })
        if upcoming_interviews > 0:
            fallback.append({
                "title": "Prepare for upcoming interviews",
                "description": f"You have {upcoming_interviews} interview(s) scheduled.",
                "action_url": "/jobs",
                "priority": "high"
            })
        if not fallback:
            fallback.append({
                "title": "Tailor your resume for more jobs",
                "description": "Customized resumes increase interview rates significantly.",
                "action_url": "/",
                "priority": "medium"
            })
        return {"insights": fallback}


@router.post("/", response_model=JobResponse, status_code=201)
def create_job(
    job: JobCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new job listing for the current user.
    """
    db_job = Job(
        user_id=current_user.id,
        title=job.title,
        company=job.company,
        description=job.description,
        url=job.url,
        source=job.source,
        status=job.status or JobStatus.NEW,
        salary_range=job.salary_range,
        remote_policy=job.remote_policy,
        location=job.location,
        notes=job.notes
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.get("/", response_model=List[JobResponse])
def list_jobs(
    current_user: User = Depends(deps.get_current_user),
    status: Optional[JobStatus] = Query(None, description="Filter by status"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    List all jobs for the current user with optional filtering.
    """
    query = db.query(Job).filter(Job.user_id == current_user.id)
    
    if status:
        query = query.filter(Job.status == status)
    
    if company:
        query = query.filter(Job.company.icontains(company, autoescape=True))
    
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    
    # Network Intelligence: Match jobs with referral contacts by company name
    all_referrals = db.query(Referral).filter(Referral.user_id == current_user.id).all()
    
    # Map referrals by company name (case-insensitive)
    referral_map = {}
    for ref in all_referrals:
        company_key = ref.company.lower()
        if company_key not in referral_map:
            referral_map[company_key] = []
        referral_map[company_key].append(ref)
    
    # Attach matched referrals to jobs
    for job in jobs:
        company_key = job.company.lower()
        job.network_contacts = referral_map.get(company_key, [])
        
    return jobs


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int, 
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific job by ID for the current user.
    """
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Network Intelligence: Match job with referral contacts by company name
    referrals = db.query(Referral).filter(
        Referral.user_id == current_user.id,
        Referral.company.icontains(job.company, autoescape=True)
    ).all()
    job.network_contacts = referrals
    
    return job


@router.patch("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_update: JobUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a job for the current user.
    """
    db_job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Update only provided fields
    update_data = job_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_job, field, value)
    
    db.commit()
    db.refresh(db_job)
    return db_job


@router.delete("/{job_id}", status_code=204)
def delete_job(
    job_id: int, 
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a job for the current user.
    """
    db_job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(db_job)
    db.commit()
    return None
