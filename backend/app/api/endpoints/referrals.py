from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.referral import Referral
from app.schemas.referral import ReferralSchema, ReferralCreate, ReferralUpdate
import logging

router = APIRouter(prefix="/referrals", tags=["referrals"])
logger = logging.getLogger(__name__)

@router.post("/", response_model=ReferralSchema)
async def create_referral(referral: ReferralCreate, db: Session = Depends(get_db)):
    """Create a new referral contact."""
    db_referral = Referral(**referral.dict())
    db.add(db_referral)
    db.commit()
    db.refresh(db_referral)
    return db_referral

@router.get("/", response_model=List[ReferralSchema])
async def get_referrals(
    user_id: int = Query(..., description="The ID of the user"),
    company: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all referral contacts for a user."""
    query = db.query(Referral).filter(Referral.user_id == user_id)
    if company:
        query = query.filter(Referral.company.ilike(f"%{company}%"))
    if status:
        query = query.filter(Referral.status == status)
    
    return query.all()

@router.get("/{referral_id}", response_model=ReferralSchema)
async def get_referral(referral_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific referral contact."""
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral

@router.patch("/{referral_id}", response_model=ReferralSchema)
async def update_referral(referral_id: int, referral_update: ReferralUpdate, db: Session = Depends(get_db)):
    """Update a referral contact."""
    db_referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    update_data = referral_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_referral, key, value)
    
    db.commit()
    db.refresh(db_referral)
    return db_referral

@router.delete("/{referral_id}")
async def delete_referral(referral_id: int, db: Session = Depends(get_db)):
    """Delete a referral contact."""
    db_referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not db_referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    db.delete(db_referral)
    db.commit()
    return {"message": "Referral deleted successfully"}
