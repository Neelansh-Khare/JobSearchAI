# Phase 1: Tracker Database - Setup Instructions

## Overview
Phase 1 implements the foundation database layer for JobSearchAI, allowing users to save and track jobs, and integrate resume customization with job tracking.

## What's Been Implemented

### Backend
1. **Database Models** (`app/models/`):
   - `User` - User accounts (basic structure, ready for auth later)
   - `Job` - Job listings with status tracking
   - `Resume` - Resume documents
   - `Application` - Links jobs to resumes (tracks applications)

2. **Database Configuration** (`app/db/`):
   - SQLAlchemy setup with SQLite (dev) / PostgreSQL (production)
   - Session management with FastAPI dependencies

3. **API Endpoints** (`app/api/endpoints/`):
   - **Jobs**: `POST /jobs`, `GET /jobs`, `GET /jobs/{id}`, `PATCH /jobs/{id}`, `DELETE /jobs/{id}`
   - **Resumes**: `POST /resumes/upload`, `GET /resumes`, `GET /resumes/{id}`, `POST /resumes/tailor`
   - **Existing**: `/customize-resume/` endpoint still works (backward compatible)

4. **Schemas** (`app/schemas/`):
   - Pydantic schemas for request/response validation

### Frontend
1. **New Jobs Page** (`/jobs`):
   - List all saved jobs
   - Filter by status
   - Update job status (for Kanban-style tracking)
   - Delete jobs

2. **Enhanced Job Application Form**:
   - Option to save job to tracker before customizing resume
   - Auto-extracts job title and company from description
   - Links customized resume to job in database

## Setup Steps

### 1. Install Dependencies

```bash
cd Resume-Customizer/backend
pip install -r requirements.txt
```

This will install:
- SQLAlchemy >= 2.0.0
- Alembic >= 1.13.0
- All existing dependencies

### 2. Initialize Database

```bash
cd Resume-Customizer/backend
python init_db.py
```

This creates the SQLite database file `jobsearchai.db` in the backend directory and creates all tables.

Alternatively, the database is automatically initialized when you start the FastAPI server (see `main.py` startup event).

### 3. Start Backend Server

```bash
cd Resume-Customizer/backend
uvicorn main:app --reload --port 8000
```

The server will:
- Initialize the database on startup
- Make all endpoints available at `http://127.0.0.1:8000`
- API docs available at `http://127.0.0.1:8000/docs`

### 4. Start Frontend

```bash
cd Resume-Customizer/frontend
npm install  # if not already done
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### Saving a Job and Customizing Resume

1. Go to the home page (`/`)
2. Check "Save job to tracker before customizing resume"
3. Fill in:
   - Job Title (required if saving)
   - Company Name (required if saving)
   - Job Posting URL (optional)
   - Job Description
   - Upload Resume
4. Click "Save Job & Customize Resume"
5. The job is saved to the database, and the resume is customized and linked to that job

### Viewing Saved Jobs

1. Go to `/jobs` page
2. View all saved jobs
3. Filter by status
4. Update job status using the dropdown
5. Delete jobs as needed

### API Usage Examples

**Create a Job:**
```bash
curl -X POST "http://127.0.0.1:8000/jobs/?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Engineer",
    "company": "Google",
    "description": "Job description here...",
    "url": "https://careers.google.com/jobs/...",
    "status": "New"
  }'
```

**List Jobs:**
```bash
curl "http://127.0.0.1:8000/jobs/?user_id=1"
```

**Update Job Status (for Kanban):**
```bash
curl -X PATCH "http://127.0.0.1:8000/jobs/1" \
  -H "Content-Type: application/json" \
  -d '{"status": "Applied"}'
```

**Tailor Resume for Job:**
```bash
curl -X POST "http://127.0.0.1:8000/resumes/tailor?user_id=1" \
  -F "job_id=1" \
  -F "resume=@resume.pdf"
```

## Database Schema

```
users
├── id (PK)
├── email
├── password_hash (nullable, for future auth)
├── preferences (JSON)
├── linkedin_token (nullable)
└── gmail_token (nullable)

jobs
├── id (PK)
├── user_id (FK → users.id)
├── title
├── company
├── description
├── url
├── source
├── status (Enum: New, Saved, Applied, Interview, Offer, Rejected)
├── salary_range
├── remote_policy
└── location

resumes
├── id (PK)
├── user_id (FK → users.id)
├── raw_text
├── file_path
├── s3_url
└── tags (JSON)

applications
├── id (PK)
├── job_id (FK → jobs.id)
├── resume_id (FK → resumes.id)
├── tailored_resume_path
├── tailored_resume_s3_url
├── cover_letter_text
├── cover_letter_s3_url
├── applied_at
└── current_stage
```

## Next Steps (Future Phases)

- **Phase 2**: Job Discovery (Hunter) - Integrate job APIs/scraping
- **Phase 3**: Automation (Bot) - Cover letters, autofill
- **Phase 4**: Referrals - Network-powered job discovery

## Notes

- Currently uses `user_id=1` as a temporary default. In the future, this will come from authentication.
- Database uses SQLite by default. For production, set `DATABASE_URL` environment variable to a PostgreSQL connection string.
- The existing `/customize-resume/` endpoint still works for backward compatibility.
