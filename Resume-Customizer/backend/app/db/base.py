"""
Base database model class.
This file re-exports Base from database.py for convenience.
"""
from app.db.database import Base

__all__ = ["Base"]
