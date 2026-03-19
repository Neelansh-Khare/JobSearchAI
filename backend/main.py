from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
from dotenv import load_dotenv

# Import database initialization
from app.db.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(".env")

# Initialize FastAPI app
app = FastAPI(
    title="JobSearchAI API",
    description="Unified API for Job Search Automation, Resume Tailoring, and Outreach",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from app.api.endpoints import jobs, resumes, search, outreach, automation, referrals, gmail, auth

# Initialize database tables on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("Database initialized")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(jobs.router)
app.include_router(resumes.router)
app.include_router(search.router)
app.include_router(outreach.router, prefix="/outreach", tags=["Outreach"])
app.include_router(automation.router)
app.include_router(referrals.router)
app.include_router(gmail.router)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Mount static files directories for output
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)
app.mount("/static-files", StaticFiles(directory=OUTPUT_DIR), name="static-files")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
