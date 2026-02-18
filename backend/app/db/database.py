"""
Database configuration and session management.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database URL - defaults to SQLite for local development
# For production, set DATABASE_URL environment variable (e.g., postgresql://user:pass@localhost/dbname)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./jobsearchai.db")

# Create engine
# For SQLite, we need to allow multiple threads
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=True  # Set to False in production
    )
else:
    engine = create_engine(DATABASE_URL, echo=True)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function for FastAPI to get database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database by creating all tables.
    This should be called once at application startup.
    """
    # Import all models so they're registered with Base
    from app.models import user, job, resume, application, outreach, referral
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
