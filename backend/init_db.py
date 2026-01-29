"""
Database initialization script.
Run this once to create all database tables.
"""
from app.db.database import init_db

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialized successfully!")
