"""
Job CRUD API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.job import Job, JobStatus
from app.schemas.job import JobCreate, JobUpdate, JobResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/", response_model=JobResponse, status_code=201)
def create_job(
    job: JobCreate,
    user_id: int = Query(1, description="User ID (temporary - will be from auth in future)"),
    db: Session = Depends(get_db)
):
    """
    Create a new job listing.
    
    For now, we use a default user_id=1. In the future, this will come from authenticated user.
    """
    db_job = Job(
        user_id=user_id,
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
    user_id: int = Query(1, description="User ID (temporary - will be from auth in future)"),
    status: Optional[JobStatus] = Query(None, description="Filter by status"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    List all jobs for a user with optional filtering.
    """
    query = db.query(Job).filter(Job.user_id == user_id)
    
    if status:
        query = query.filter(Job.status == status)
    
    if company:
        query = query.filter(Job.company.ilike(f"%{company}%"))
    
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return jobs


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """
    Get a specific job by ID.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.patch("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_update: JobUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a job (used for Kanban drag-and-drop status changes).
    """
    db_job = db.query(Job).filter(Job.id == job_id).first()
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
def delete_job(job_id: int, db: Session = Depends(get_db)):
    """
    Delete a job.
    """
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(db_job)
    db.commit()
    return None
