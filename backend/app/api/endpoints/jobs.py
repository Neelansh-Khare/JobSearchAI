"""
Job CRUD API endpoints.
"""
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

router = APIRouter(prefix="/jobs", tags=["jobs"])


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
        location=job.location
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
        query = query.filter(Job.company.ilike(f"%{company}%"))
    
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
        Referral.company.ilike(job.company)
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
