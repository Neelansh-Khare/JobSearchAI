# Database Setup Guide

This document explains how to set up and manage the database for the JobSearchAI application.

## Database Overview

- **Engine:** SQLAlchemy (ORM)
- **Local Database (Default):** SQLite (stored in `backend/jobsearchai.db`)
- **Production Support:** PostgreSQL (via `DATABASE_URL` environment variable)

## Initial Setup

Before running the application for the first time, you must initialize the database tables.

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2.  Run the initialization script:
    ```bash
    python init_db.py
    ```

This script will create all necessary tables defined in `app/models/`.

## Environment Configuration

The database connection is configured via environment variables in a `.env` file within the `backend` directory.

### SQLite (Default for Local Development)
```env
# No DATABASE_URL needed, or use:
DATABASE_URL=sqlite:///./jobsearchai.db
```

### PostgreSQL (For Production)
```env
DATABASE_URL=postgresql://user:password@localhost/dbname
```

## Database Schema (Models)

The schema is defined by the SQLAlchemy models in `backend/app/models/`:
- `User`: Account information and authentication.
- `Job`: Job listings saved by users.
- `Resume`: Uploaded resumes and tailored versions.
- `Application`: Tracks the status of specific job applications.
- `Outreach`: AI-generated emails and contact attempts.
- `Referral`: Networking contacts and referral tracking.

## Managing Migrations (Future Improvement)

Currently, the application uses `Base.metadata.create_all()` to create tables. For production environments where schema updates are needed without data loss, we recommend using **Alembic**.

### Adding a new column manually (SQLite example)
If you add a new field to a model (like `notes` in `Job`), you may need to manually update the database if it already exists:
```bash
# Using Python to add a column
python -c "import sqlite3; conn = sqlite3.connect('jobsearchai.db'); cursor = conn.cursor(); cursor.execute('ALTER TABLE jobs ADD COLUMN notes TEXT;'); conn.commit(); conn.close(); print('Added column successfully')"
```
