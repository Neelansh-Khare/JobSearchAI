from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import csv
import io
from app.db.database import get_db
from app.models.referral import Referral
from app.schemas.referral import ReferralSchema, ReferralCreate, ReferralUpdate
from app.api import deps
from app.models.user import User
from app.services.email_generator import EmailGeneratorService

router = APIRouter(prefix="/referrals", tags=["referrals"])
logger = logging.getLogger(__name__)

@router.post("/", response_model=ReferralSchema)
async def create_referral(
    referral: ReferralCreate, 
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new referral contact for current user."""
    db_referral = Referral(**referral.dict())
    db_referral.user_id = current_user.id
    db.add(db_referral)
    db.commit()
    db.refresh(db_referral)
    return db_referral

@router.get("/", response_model=List[ReferralSchema])
async def get_referrals(
    current_user: User = Depends(deps.get_current_user),
    company: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all referral contacts for current user."""
    query = db.query(Referral).filter(Referral.user_id == current_user.id)
    if company:
        query = query.filter(Referral.company.ilike(f"%{company}%"))
    if status:
        query = query.filter(Referral.status == status)
    
    return query.all()

@router.post("/upload-csv")
async def upload_referrals_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a CSV file of LinkedIn connections.
    Expected format: First Name, Last Name, Email Address, Company, Position, Connected On
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    referrals_added = 0
    for row in reader:
        # Map LinkedIn CSV headers to our Referral model
        first_name = row.get('First Name', '')
        last_name = row.get('Last Name', '')
        contact_name = f"{first_name} {last_name}".strip()
        
        company = row.get('Company', '')
        position = row.get('Position', '')
        email = row.get('Email Address', '')
        
        if not contact_name or not company:
            continue
            
        # Check if already exists for this user
        existing = db.query(Referral).filter(
            Referral.user_id == current_user.id,
            Referral.contact_name == contact_name,
            Referral.company == company
        ).first()
        
        if not existing:
            db_referral = Referral(
                user_id=current_user.id,
                contact_name=contact_name,
                company=company,
                contact_email_or_profile=email,
                relationship=f"LinkedIn Connection - {position}",
                status="Identified"
            )
            db.add(db_referral)
            referrals_added += 1
            
    db.commit()
    return {"message": f"Successfully imported {referrals_added} referrals", "count": referrals_added}

@router.post("/{referral_id}/generate-message")
async def generate_referral_message(
    referral_id: int,
    tone: str = Query("Professional", description="Tone of the message"),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a personalized referral request message using AI."""
    referral = db.query(Referral).filter(
        Referral.id == referral_id,
        Referral.user_id == current_user.id
    ).first()
    
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    email_service = EmailGeneratorService(db)
    
    # Custom purpose for referral
    purpose = f"Requesting a referral for a position at {referral.company}. We are connected on LinkedIn where they are/were a {referral.relationship}."
    
    try:
        message = email_service.generate_email(
            user_id=current_user.id,
            purpose=purpose,
            tone=tone,
            recipient_name=referral.contact_name,
            recipient_company=referral.company,
            additional_context=referral.notes
        )
        return {"message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate message: {str(e)}")

from app.api.endpoints.search import search_jobs_jsearch

@router.get("/jobs/discover")
async def discover_network_jobs(
    query: str = Query("Software Engineer", description="Job title to search for"),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Search for jobs at companies where you have referral contacts."""
    # Get unique companies from referrals
    referrals = db.query(Referral).filter(Referral.user_id == current_user.id).all()
    companies = list(set([r.company for r in referrals]))
    
    if not companies:
        return {"success": True, "jobs": [], "message": "No referral companies found"}
    
    # JSearch doesn't easily support "at (Company A OR Company B)" in one go effectively for many companies
    # So we'll search for the query and then filter/rank based on our network, 
    # OR we can try to search for the query with companies included.
    
    # Let's try to construct a query with the first few companies to keep it within JSearch limits
    # or just search generally and let the existing matching logic (which we should reuse) handle it.
    
    # Actually, the best way is to search for "at COMPANY" for each company, but that's many API calls.
    # Let's search for "query at (Company1 OR Company2...)" for up to 5 companies at a time.
    
    all_jobs = []
    # Limit to top 10 companies to avoid too many API calls or too long query
    for i in range(0, min(len(companies), 10), 5):
        chunk = companies[i:i+5]
        chunk_query = f"{query} at ({' OR '.join(chunk)})"
        
        try:
            results = search_jobs_jsearch(query=chunk_query)
            if "data" in results:
                for job_data in results["data"]:
                    # Reuse matching logic or just add to list
                    # For simplicity, we'll just return these as "Network Opportunities"
                    all_jobs.append({
                        "job_id": job_data.get("job_id"),
                        "title": job_data.get("job_title", ""),
                        "company": job_data.get("employer_name", ""),
                        "location": job_data.get("job_city") or job_data.get("job_country", ""),
                        "url": job_data.get("job_apply_link", ""),
                        "source": "jsearch",
                        "network_match": True
                    })
        except Exception as e:
            logger.error(f"Error searching jobs for chunk {chunk}: {e}")
            
    return {"success": True, "jobs": all_jobs, "count": len(all_jobs)}

@router.get("/{referral_id}", response_model=ReferralSchema)
async def get_referral(
    referral_id: int, 
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a specific referral contact for current user."""
    referral = db.query(Referral).filter(
        Referral.id == referral_id,
        Referral.user_id == current_user.id
    ).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral

@router.patch("/{referral_id}", response_model=ReferralSchema)
async def update_referral(
    referral_id: int, 
    referral_update: ReferralUpdate, 
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a referral contact for current user."""
    db_referral = db.query(Referral).filter(
        Referral.id == referral_id,
        Referral.user_id == current_user.id
    ).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    update_data = referral_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_referral, key, value)
    
    db.commit()
    db.refresh(db_referral)
    return db_referral

@router.delete("/{referral_id}")
async def delete_referral(
    referral_id: int, 
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a referral contact for current user."""
    db_referral = db.query(Referral).filter(
        Referral.id == referral_id,
        Referral.user_id == current_user.id
    ).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    db.delete(db_referral)
    db.commit()
    return {"message": "Referral deleted successfully"}
