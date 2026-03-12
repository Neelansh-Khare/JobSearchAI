import os
import json
import base64
import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import google.generativeai as genai
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.application import Application
from ..models.job import Job, JobStatus
from ..prompts import GMAIL_EMAIL_PARSING_PROMPT

logger = logging.getLogger(__name__)

class GmailService:
    def __init__(self, db: Session):
        self.db = db
        # Using the same model as in main.py
        self.model = genai.GenerativeModel("gemini-2.0-flash-lite")

    def _get_gmail_client(self, user_id: int):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.gmail_token:
            logger.warning(f"User {user_id} has no Gmail token")
            return None
        
        try:
            # The token is stored as a JSON object in the DB
            token_data = user.gmail_token
            if isinstance(token_data, str):
                token_data = json.loads(token_data)
            
            creds = Credentials.from_authorized_user_info(token_data)
            return build('gmail', 'v1', credentials=creds)
        except Exception as e:
            logger.error(f"Error building Gmail client for user {user_id}: {str(e)}")
            return None

    def scan_for_updates(self, user_id: int, days_back: int = 7) -> List[Dict[str, Any]]:
        """
        Scans recent emails for job application updates and updates the database.
        """
        service = self._get_gmail_client(user_id)
        if not service:
            return []

        try:
            # Query for recent emails likely to be job updates
            after_timestamp = int(datetime.now().timestamp() - days_back * 86400)
            query = f"after:{after_timestamp} (interview OR application OR offer OR rejection OR greenhouse OR lever)"
            
            results = service.users().messages().list(userId='me', q=query).execute()
            messages = results.get('messages', [])
            
            updates = []
            for msg in messages:
                msg_id = msg['id']
                msg_detail = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
                
                # Extract snippet and body
                payload = msg_detail.get('payload', {})
                body = self._extract_email_body(payload)
                
                if not body:
                    body = msg_detail.get('snippet', '')

                # Parse with Gemini
                update = self._parse_email_content(body)
                if update and update.get('is_job_related'):
                    update['message_id'] = msg_id
                    update['received_at'] = datetime.fromtimestamp(int(msg_detail['internalDate'])/1000).isoformat()
                    updates.append(update)
                    
                    # Try to update database
                    self._sync_update_to_db(user_id, update)
            
            return updates

        except HttpError as error:
            logger.error(f"An error occurred calling Gmail API: {error}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in scan_for_updates: {str(e)}")
            return []

    def send_email(self, user_id: int, recipient_email: str, subject: str, body: str) -> bool:
        """
        Sends an email using the user's Gmail account.
        """
        service = self._get_gmail_client(user_id)
        if not service:
            logger.error(f"Could not get Gmail client for user {user_id}")
            return False

        try:
            from email.mime.text import MIMEText
            import base64

            message = MIMEText(body)
            message['to'] = recipient_email
            message['subject'] = subject
            
            # Encode the message
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            # Send the message
            sent_message = service.users().messages().send(userId='me', body={'raw': raw}).execute()
            logger.info(f"Email sent successfully. Message ID: {sent_message['id']}")
            return True
        except Exception as e:
            logger.error(f"Error sending email via Gmail: {str(e)}")
            return False

    def _extract_email_body(self, payload: Dict[str, Any]) -> str:
        """Helper to extract text/plain body from Gmail payload."""
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain' and 'body' in part:
                    if 'data' in part['body']:
                        return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                elif 'parts' in part:
                    # Recursive call for nested parts
                    body = self._extract_email_body(part)
                    if body:
                        return body
        elif 'body' in payload and 'data' in payload['body']:
            return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        return ""

    def _parse_email_content(self, content: str) -> Optional[Dict[str, Any]]:
        """Uses Gemini to extract job status from email content."""
        try:
            prompt = GMAIL_EMAIL_PARSING_PROMPT.format(email_content=content[:4000])
            response = self.model.generate_content(prompt)
            
            # Extract JSON from response
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            
            # Clean up potential leading/trailing non-JSON characters
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                text = match.group(0)
                
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error parsing email with Gemini: {str(e)}")
            return None

    def _sync_update_to_db(self, user_id: int, update: Dict[str, Any]):
        """Updates the Job and Application records based on parsed email info."""
        company = update.get('company')
        if not company:
            return

        # Find the job application
        # Match by company name
        job = self.db.query(Job).filter(
            Job.user_id == user_id,
            Job.company.ilike(f"%{company}%")
        ).order_by(Job.updated_at.desc()).first()

        if job:
            # Update job status if it's a clear status change
            email_status = update.get('status')
            status_map = {
                "Applied": JobStatus.APPLIED,
                "Interview": JobStatus.INTERVIEW,
                "Offer": JobStatus.OFFER,
                "Rejected": JobStatus.REJECTED
            }
            
            new_status = status_map.get(email_status)
            if new_status:
                job.status = new_status

            # Update application details
            application = self.db.query(Application).filter(Application.job_id == job.id).first()
            if application:
                application.current_stage = update.get('stage') or email_status
                application.last_status_update = datetime.now()
            
            self.db.commit()
            logger.info(f"Sync: Updated job {job.id} ({company}) status to {job.status}")
