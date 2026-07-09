from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
from dotenv import load_dotenv

# Import database initialization
from app.db.database import init_db
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime as dt_now
from app.db.database import SessionLocal
from app.models.application import Application as ApplicationModel

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
# redirect_slashes=False: avoids 307 redirects whose Location header uses the
# internal Docker hostname (e.g. http://backend:8000/...), which the browser
# cannot resolve when requests are proxied through the Next.js /api rewrite.
app = FastAPI(
    title="JobSearchAI API",
    description="Unified API for Job Search Automation, Resume Tailoring, and Outreach",
    version="1.0.0",
    redirect_slashes=False,
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
from app.api.endpoints import jobs, resumes, search, outreach, automation, referrals, gmail, auth, applications

scheduler = AsyncIOScheduler()

async def _check_follow_up_reminders():
    """Hourly background task: logs overdue follow-ups. Extend with email notifications as needed."""
    db = SessionLocal()
    try:
        now = dt_now.utcnow()
        overdue = db.query(ApplicationModel).filter(
            ApplicationModel.follow_up_date <= now,
            ApplicationModel.follow_up_status == "pending"
        ).all()
        if overdue:
            logger.info(
                f"[FollowUp] {len(overdue)} overdue follow-up(s) for user(s): "
                f"{list({a.user_id for a in overdue})}"
            )
    except Exception as e:
        logger.error(f"[FollowUp] Scheduler error: {e}")
    finally:
        db.close()

# Initialize database tables on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    # Note: interval trigger fires after the first interval (1h), not immediately.
    # For immediate + hourly: add next_run_time=datetime.now() to the add_job call.
    scheduler.add_job(_check_follow_up_reminders, 'interval', hours=1, id='follow_up_check')
    scheduler.start()
    logger.info("Database initialized and scheduler started")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    logger.info("Scheduler stopped")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(jobs.router)
app.include_router(resumes.router)
app.include_router(search.router)
app.include_router(outreach.router, prefix="/outreach", tags=["Outreach"])
app.include_router(automation.router)
app.include_router(referrals.router)
app.include_router(gmail.router)
app.include_router(applications.router)

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
