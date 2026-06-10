from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import json
import hmac
import hashlib
import secrets as _secrets
from google_auth_oauthlib.flow import Flow
from app.db.database import get_db
from app.services.gmail_service import GmailService
from app.schemas.gmail import GmailSendRequest
from app.api import deps
from app.models.user import User

router = APIRouter(prefix="/gmail", tags=["gmail"])

# Google OAuth Scopes
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
]

@router.get("/auth")
async def gmail_auth(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start the Google OAuth flow to connect Gmail.
    """
    client_id = os.getenv("GMAIL_CLIENT_ID")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=500, 
            detail="Gmail API credentials not configured in environment"
        )

    # In a real app, you'd want to store this state in a session or database
    # For simplicity, we'll use a fixed redirect URI
    client_config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [os.getenv("GMAIL_REDIRECT_URI", "http://localhost:8000/gmail/callback")]
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES
    )
    
    # The state is used to prevent CSRF, but for now we'll just encode the user_id in it
    # Note: In production, use a secure, encrypted state.
    flow.redirect_uri = client_config["web"]["redirect_uris"][0]
    
    nonce = _secrets.token_urlsafe(16)
    raw = f"{current_user.id}:{nonce}"
    signature = hmac.new(
        client_secret.encode(),
        raw.encode(),
        hashlib.sha256
    ).hexdigest()[:16]
    signed_state = f"{raw}:{signature}"

    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        state=signed_state
    )
    
    return {"url": authorization_url}

@router.get("/callback")
async def gmail_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Callback for Google OAuth flow.
    """
    # Verify HMAC-signed state to prevent CSRF
    client_secret = os.getenv("GMAIL_CLIENT_SECRET") or ""
    if not client_secret:
        return RedirectResponse(
            url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings?error=ConfigurationError"
        )
    try:
        parts = state.split(":")
        if len(parts) != 3:
            raise ValueError("Invalid state format")
        user_id = int(parts[0])
        nonce = parts[1]
        received_sig = parts[2]

        expected_sig = hmac.new(
            client_secret.encode(),
            f"{user_id}:{nonce}".encode(),
            hashlib.sha256
        ).hexdigest()[:16]

        if not hmac.compare_digest(received_sig, expected_sig):
            return RedirectResponse(
                url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings?error=InvalidState"
            )
    except (ValueError, AttributeError):
        return RedirectResponse(
            url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings?error=InvalidState"
        )
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        return RedirectResponse(url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings?error=UserNotFound")

    client_id = os.getenv("GMAIL_CLIENT_ID")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET")
    
    client_config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES
    )
    flow.redirect_uri = os.getenv("GMAIL_REDIRECT_URI", "http://localhost:8000/gmail/callback")
    
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Save token to user
        token_data = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        
        user.gmail_token = token_data
        db.commit()
        
        # Redirect back to frontend
        return RedirectResponse(url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings?success=GmailConnected")
    except Exception as e:
        return RedirectResponse(url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings?error={str(e)}")

@router.post("/scan")
def scan_gmail(
    current_user: User = Depends(deps.get_current_user),
    days_back: int = Query(7, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    """
    Scan Gmail for job application status updates.
    """
    try:
        gmail_service = GmailService(db)
        updates = gmail_service.scan_for_updates(current_user.id, days_back)
        
        return {
            "status": "success",
            "updates_found": len(updates),
            "updates": updates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send", status_code=status.HTTP_200_OK)
def send_gmail(
    request: GmailSendRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send an email via the user's Gmail account.
    """
    try:
        gmail_service = GmailService(db)
        success = gmail_service.send_email(
            user_id=current_user.id,
            recipient_email=request.recipient_email,
            subject=request.subject,
            body=request.body
        )
        
        if success:
            return {"status": "success", "message": "Email sent successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send email via Gmail. Check your credentials and permissions."
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
