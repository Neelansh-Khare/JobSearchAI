from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.referral import Referral
from app.schemas.referral import ReferralSchema, ReferralCreate, ReferralUpdate
from app.api import deps
from app.models.user import User
import logging

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
