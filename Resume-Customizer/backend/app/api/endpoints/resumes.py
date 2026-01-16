"""
Resume API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Query
from sqlalchemy.orm import Session
from typing import Optional
import PyPDF2
import io
from app.db.database import get_db
from app.models.resume import Resume
from app.models.job import Job
from app.models.application import Application
from app.schemas.resume import ResumeCreate, ResumeResponse
from app.schemas.application import ApplicationResponse
from app.services.resume_processor import (
    extract_text_from_pdf,
    extract_resume_data,
    extract_job_description_data,
    tailor_resume_for_job,
    calculate_ats_score,
    create_resume_filename,
    generate_resume_pdf,
    save_resume_json
)

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("/upload", response_model=ResumeResponse, status_code=201)
async def upload_resume(
    resume: UploadFile = File(...),
    user_id: int = Query(1, description="User ID (temporary - will be from auth in future)"),
    db: Session = Depends(get_db)
):
    """
    Upload and store a resume.
    """
    # Read and extract text from PDF
    resume_content = await resume.read()
    resume_text = extract_text_from_pdf(resume_content)
    
    # Parse resume data
    resume_data = extract_resume_data(resume_text)
    
    # Store resume in database
    db_resume = Resume(
        user_id=user_id,
        raw_text=resume_text,
        file_path=resume.filename,
        tags=None  # Can be extracted from resume_data later
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    
    return db_resume


@router.get("/", response_model=list[ResumeResponse])
def list_resumes(
    user_id: int = Query(1, description="User ID"),
    db: Session = Depends(get_db)
):
    """
    List all resumes for a user.
    """
    resumes = db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).all()
    return resumes


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: int, db: Session = Depends(get_db)):
    """
    Get a specific resume by ID.
    """
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.post("/tailor", response_model=ApplicationResponse, status_code=201)
async def tailor_resume_for_job_endpoint(
    job_id: int = Form(..., description="Job ID to tailor resume for"),
    resume_id: Optional[int] = Form(None, description="Resume ID (if not provided, uses most recent)"),
    resume_file: Optional[UploadFile] = File(None, description="New resume file (if not using resume_id)"),
    user_id: int = Query(1, description="User ID"),
    db: Session = Depends(get_db)
):
    """
    Tailor a resume for a specific job and create an application record.
    
    This integrates the existing resume customization logic with the database.
    """
    # Get job
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get or create resume
    if resume_id:
        db_resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
        if not db_resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        resume_text = db_resume.raw_text
        if not resume_text:
            raise HTTPException(status_code=400, detail="Resume has no raw text data")
    elif resume_file:
        # Upload new resume
        resume_content = await resume_file.read()
        resume_text = extract_text_from_pdf(resume_content)
        
        # Create resume record
        db_resume = Resume(
            user_id=user_id,
            raw_text=resume_text,
            file_path=resume_file.filename
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)
    else:
        # Use most recent resume
        db_resume = db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).first()
        if not db_resume:
            raise HTTPException(status_code=404, detail="No resume found. Please upload a resume first.")
        resume_text = db_resume.raw_text
        if not resume_text:
            raise HTTPException(status_code=400, detail="Resume has no raw text data")
    
    # Extract structured data
    resume_data = extract_resume_data(resume_text)
    job_description_data = extract_job_description_data(job.description)
    
    # Calculate initial ATS score
    initial_ats_analysis = calculate_ats_score(resume_data, job_description_data, is_optimized=False)
    initial_score = initial_ats_analysis.get("score", 35)
    
    # Customize the resume
    customized_resume = tailor_resume_for_job(resume_data, job_description_data)
    
    # Calculate final ATS score
    final_ats_analysis = calculate_ats_score(customized_resume, job_description_data, is_optimized=True)
    final_score = final_ats_analysis.get("score", initial_score + 40)
    
    # Generate filename
    filename = create_resume_filename(customized_resume, job_description_data)
    
    # Generate PDF
    pdf_result = generate_resume_pdf(customized_resume, filename)
    
    # Save JSON
    json_result = save_resume_json(customized_resume, filename)
    
    # Create or update application record
    application = db.query(Application).filter(
        Application.job_id == job_id,
        Application.resume_id == db_resume.id
    ).first()
    
    if application:
        # Update existing application
        application.tailored_resume_path = pdf_result.get("pdf_path") if pdf_result else None
        application.tailored_resume_s3_url = pdf_result.get("s3_url") if pdf_result else None
    else:
        # Create new application
        application = Application(
            job_id=job_id,
            resume_id=db_resume.id,
            tailored_resume_path=pdf_result.get("pdf_path") if pdf_result else None,
            tailored_resume_s3_url=pdf_result.get("s3_url") if pdf_result else None
        )
        db.add(application)
    
    db.commit()
    db.refresh(application)
    
    # Return application with additional metadata
    response_dict = {
        "id": application.id,
        "job_id": application.job_id,
        "resume_id": application.resume_id,
        "tailored_resume_path": application.tailored_resume_path,
        "tailored_resume_s3_url": application.tailored_resume_s3_url,
        "cover_letter_text": application.cover_letter_text,
        "cover_letter_s3_url": application.cover_letter_s3_url,
        "applied_at": application.applied_at,
        "last_status_update": application.last_status_update,
        "current_stage": application.current_stage,
        "created_at": application.created_at,
        "updated_at": application.updated_at,
        # Add customization metadata
        "initial_ats_score": initial_score,
        "final_ats_score": final_score,
        "score_improvement": final_score - initial_score,
        "customized_resume": customized_resume,
        "pdf_path": pdf_result.get("pdf_path") if pdf_result else None,
        "s3_url": pdf_result.get("s3_url") if pdf_result else None
    }
    
    return response_dict
