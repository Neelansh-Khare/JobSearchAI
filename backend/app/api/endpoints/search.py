"""
Job Search API endpoints (Phase 2: Hunter).
Integrates with external job APIs for job discovery.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import requests
from app.db.database import get_db
from app.models.job import Job, JobStatus
from app.schemas.job import JobCreate, JobResponse
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/search", tags=["search"])

# JSearch API configuration
JSEARCH_API_KEY = os.getenv("JSEARCH_API_KEY")
JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com"


def search_jobs_jsearch(
    query: str,
    location: Optional[str] = None,
    remote_only: bool = False,
    employment_types: Optional[str] = None,
    job_requirements: Optional[str] = None,
    date_posted: Optional[str] = None,
    page: int = 1,
    num_pages: int = 1
) -> dict:
    """
    Search for jobs using JSearch API (RapidAPI).
    
    Args:
        query: Job search query (e.g., "software engineer", "data scientist")
        location: Location filter (e.g., "San Francisco, CA")
        remote_only: Whether to search for remote jobs only
        employment_types: Comma-separated employment types (FULLTIME, PARTTIME, CONTRACTOR, INTERN)
        job_requirements: Job requirements filter (under_3_years_experience, more_than_3_years_experience, no_experience, no_degree)
        date_posted: Date posted filter (today, 3days, week, month)
        page: Page number (default: 1)
        num_pages: Number of pages to fetch (default: 1)
    
    Returns:
        Dictionary containing job search results
    """
    if not JSEARCH_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="JSearch API key not configured. Please set JSEARCH_API_KEY in environment variables."
        )
    
    url = f"{JSEARCH_BASE_URL}/search"
    
    params = {
        "query": query,
        "page": str(page),
        "num_pages": str(num_pages)
    }
    
    if location:
        params["location"] = location
    
    if remote_only:
        params["remote_jobs_only"] = "true"
    
    if employment_types:
        params["employment_types"] = employment_types
    
    if job_requirements:
        params["job_requirements"] = job_requirements
    
    if date_posted:
        params["date_posted"] = date_posted
    
    headers = {
        "X-RapidAPI-Key": JSEARCH_API_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search jobs: {str(e)}"
        )


@router.get("/jobs")
def search_jobs(
    query: str = Query(..., description="Job search query (e.g., 'software engineer', 'data scientist')"),
    location: Optional[str] = Query(None, description="Location filter (e.g., 'San Francisco, CA')"),
    remote_only: bool = Query(False, description="Search for remote jobs only"),
    employment_types: Optional[str] = Query(None, description="Employment types: FULLTIME, PARTTIME, CONTRACTOR, INTERN"),
    job_requirements: Optional[str] = Query(None, description="Job requirements filter"),
    date_posted: Optional[str] = Query(None, description="Date posted filter: today, 3days, week, month"),
    page: int = Query(1, ge=1, description="Page number"),
    num_pages: int = Query(1, ge=1, le=5, description="Number of pages to fetch (max 5)")
):
    """
    Search for jobs using external job APIs (JSearch).
    
    Returns a list of job listings from external sources.
    """
    try:
        results = search_jobs_jsearch(
            query=query,
            location=location,
            remote_only=remote_only,
            employment_types=employment_types,
            job_requirements=job_requirements,
            date_posted=date_posted,
            page=page,
            num_pages=num_pages
        )
        
        # Transform JSearch results to our format
        jobs = []
        if "data" in results:
            for job_data in results["data"]:
                job = {
                    "job_id": job_data.get("job_id"),
                    "title": job_data.get("job_title", ""),
                    "company": job_data.get("employer_name", ""),
                    "description": job_data.get("job_description", ""),
                    "url": job_data.get("job_apply_link", ""),
                    "location": job_data.get("job_city") or job_data.get("job_country", ""),
                    "remote": job_data.get("job_is_remote", False),
                    "employment_type": job_data.get("job_employment_type", ""),
                    "salary_min": job_data.get("job_min_salary"),
                    "salary_max": job_data.get("job_max_salary"),
                    "salary_currency": job_data.get("job_salary_currency"),
                    "posted_at": job_data.get("job_posted_at_datetime_utc"),
                    "source": "jsearch",
                    "external_id": job_data.get("job_id")
                }
                jobs.append(job)
        
        return {
            "success": True,
            "jobs": jobs,
            "total": len(jobs),
            "page": page,
            "num_pages": num_pages
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Job search failed: {str(e)}"
        )


@router.post("/jobs/save")
def save_job_from_search(
    job_data: dict,
    user_id: int = Query(1, description="User ID (temporary - will be from auth in future)"),
    db: Session = Depends(get_db)
):
    """
    Save a job from search results to the tracker.
    
    This endpoint takes a job object from search results and saves it to the database.
    """
    try:
        # Extract job information
        title = job_data.get("title", "")
        company = job_data.get("company", "")
        description = job_data.get("description", "")
        url = job_data.get("url", "")
        location = job_data.get("location")
        remote_policy = "Remote" if job_data.get("remote", False) else None
        
        # Build salary range string if available
        salary_range = None
        if job_data.get("salary_min") or job_data.get("salary_max"):
            min_sal = job_data.get("salary_min")
            max_sal = job_data.get("salary_max")
            currency = job_data.get("salary_currency", "USD")
            if min_sal and max_sal:
                salary_range = f"{currency} {min_sal:,} - {max_sal:,}"
            elif min_sal:
                salary_range = f"{currency} {min_sal:,}+"
            elif max_sal:
                salary_range = f"{currency} up to {max_sal:,}"
        
        # Create job in database
        db_job = Job(
            user_id=user_id,
            title=title,
            company=company,
            description=description,
            url=url,
            source=job_data.get("source", "jsearch"),
            status=JobStatus.NEW,
            salary_range=salary_range,
            remote_policy=remote_policy,
            location=location
        )
        
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        
        return {
            "success": True,
            "job": db_job,
            "message": "Job saved to tracker successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save job: {str(e)}"
        )
