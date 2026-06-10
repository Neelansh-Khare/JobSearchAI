"""
Database configuration and session management.
"""
import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./jobsearchai.db")
_echo = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=_echo
    )
else:
    engine = create_engine(DATABASE_URL, echo=_echo)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _run_migrations():
    """Add any new columns that don't yet exist in the live schema."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    if "applications" in tables:
        existing = {c["name"] for c in inspector.get_columns("applications")}
        with engine.connect() as conn:
            if "follow_up_date" not in existing:
                conn.execute(text("ALTER TABLE applications ADD COLUMN follow_up_date DATETIME"))
                conn.commit()
            if "follow_up_status" not in existing:
                conn.execute(text(
                    "ALTER TABLE applications ADD COLUMN follow_up_status VARCHAR DEFAULT 'pending'"
                ))
                conn.commit()


def init_db():
    from app.models import user, job, resume, application, outreach, referral
    Base.metadata.create_all(bind=engine)
    _run_migrations()
