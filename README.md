# JobSearchAI

A comprehensive job search automation platform that helps job seekers discover, track, and apply to jobs efficiently. Built with FastAPI (backend) and Next.js (frontend).

## 🎯 Overview

JobSearchAI transforms the job search process from reactive (customizing resumes for jobs you find) to proactive (discovering jobs, tracking applications, and automating the application process).

### Core Features

1. **🔍 Hunter (Job Discovery)** - Search and discover jobs from multiple sources
2. **📋 Tracker (Kanban Board)** - Track applications through stages with drag-and-drop
3. **🤖 Resume Customization** - AI-powered resume tailoring for specific job descriptions
4. **📧 Outreach** - Automated email generation and contact finding
5. **🤝 Referrals** (Coming in Phase 4) - Network-powered job discovery

## 🏗️ Architecture

### Unified Application Structure

- **Backend**: FastAPI with SQLAlchemy (PostgreSQL/SQLite)
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Database**: Single unified database for all features
- **Deployment**: Single deployment (one backend, one frontend, one database)

### Project Structure

```
JobSearchAI/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/endpoints/  # API routes (jobs, resumes, search, outreach)
│   │   ├── db/             # Database configuration
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic (e.g., email_generator)
│   ├── pdf_generator/       # LaTeX PDF generation
│   ├── main.py             # FastAPI app entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   │   ├── page.tsx    # Home (Resume Customization)
│   │   │   ├── jobs/       # Job Tracker (Kanban)
│   │   │   ├── hunter/     # Job Discovery
│   │   │   └── outreach/   # Email/Outreach
│   │   ├── components/     # React components
│   │   ├── services/       # API client functions
│   │   └── types/          # TypeScript types
│   ├── package.json        # Node.js dependencies
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── ...
└── nextSteps.md           # Detailed project roadmap and status

```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL (optional, SQLite used by default)
- LaTeX (for PDF generation)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `backend/` directory:
   ```bash
   # Required: Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional: JSearch API Key (for job discovery)
   JSEARCH_API_KEY=your_jsearch_api_key_here

   # Optional: Apify API Token (for LinkedIn contact search)
   APIFY_API_TOKEN=your_apify_api_token_here
   
   # Optional: Database (defaults to SQLite)
   DATABASE_URL=sqlite:///./jobsearchai.db
   # For PostgreSQL: DATABASE_URL=postgresql://user:password@localhost/jobsearchai
   
   # Optional: AWS S3 (for file storage)
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket-name
   ```

4. **Initialize database:**
   ```bash
   python init_db.py
   ```
   (Or database auto-initializes on server start)

5. **Start the backend server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   API docs available at: `http://127.0.0.1:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the `frontend/` directory:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend available at: `http://localhost:3000`

## 📖 Features & Usage

### 1. Resume Customization (`/`)

- Upload your resume (PDF)
- Paste job description
- Get AI-tailored resume with ATS score improvement
- Download customized PDF

### 2. Job Tracker (`/jobs`)

- **Kanban Board**: Drag and drop jobs between stages:
  - New → Saved → Applied → Interview → Offer → Rejected
- Filter jobs by status
- View job details and application history
- Delete jobs

### 3. Job Hunter (`/hunter`)

- Search for jobs using JSearch API
- Filter by:
  - Location
  - Remote only
  - Employment type (Full-time, Part-time, Contractor, Intern)
  - Date posted
- Save jobs directly to tracker
- View job details and apply

### 4. Outreach (`/outreach`)

- **Email Generation**: AI-powered generation of cold emails, follow-ups, or referral requests.
- **Contact Finding**: Discover potential hiring managers or recruiters using AI or LinkedIn (via Apify).

## 🔧 API Endpoints

### Jobs
- `POST /jobs/` - Create a job
- `GET /jobs/` - List jobs (with filters)
- `GET /jobs/{id}` - Get job details
- `PATCH /jobs/{id}` - Update job (for Kanban)
- `DELETE /jobs/{id}` - Delete job

### Resumes
- `POST /resumes/upload` - Upload resume
- `GET /resumes/` - List resumes
- `POST /resumes/tailor` - Tailor resume for a job

### Search
- `GET /search/jobs` - Search for jobs
- `POST /search/jobs/save` - Save job from search results

### Outreach
- `POST /outreach/email/generate` - Generate AI-powered email content
- `POST /outreach/contacts/find` - Find potential contacts

### Resume Customization
- `POST /customize-resume/` - Customize resume (legacy endpoint)

## 📊 Current Status

### ✅ Phase 1: Tracker Database (COMPLETE)
- Persistent database with SQLAlchemy
- Job CRUD operations
- Resume tracking and linking
- Application management

### ✅ Phase 2: Hunter (COMPLETE)
- Job search API integration (JSearch)
- Job discovery UI with filters
- Save to tracker functionality
- Kanban board with drag-and-drop

### ✅ Phase 3: Bot - Email Generation & Contact Finding (COMPLETE)
- AI-powered email generation integrated
- AI and LinkedIn (via Apify) contact finding implemented
- Dedicated frontend `/outreach` page

### ⏳ Phase 3 (Remaining): Bot - Browser Automation & Gmail Integration (PLANNED)
- Cover letter generation
- Browser automation for form filling
- Gmail integration for status tracking

### ⏳ Phase 4: Referrals (PLANNED)
- LinkedIn connections import
- Referral matching engine
- Network-powered job discovery
- Personalized outreach generation

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Google Gemini** - AI for resume customization, email generation, and contact finding
- **LaTeX** - PDF generation
- **JSearch API** - Job search aggregation
- **Apify Client** - For LinkedIn contact search

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS
- **dnd-kit** - Drag and drop for Kanban board
- **react-hot-toast** - Toast notifications

## 📝 Environment Variables

### Backend (.env)
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional - Job Search
JSEARCH_API_KEY=your_jsearch_api_key

# Optional - Database
DATABASE_URL=sqlite:///./jobsearchai.db

# Optional - AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## 🚢 Deployment

See `nextSteps.md` Section 11 for detailed deployment instructions.

**Quick Deploy Options:**
- **Backend**: Railway, Render, or Fly.io
- **Frontend**: Vercel or Netlify
- **Database**: Supabase, Neon, or Railway PostgreSQL

## 📚 Documentation

- **Project Roadmap**: See `nextSteps.md` for detailed phases and features
- **Database Setup**: See `docs/DATABASE_SETUP.md` for detailed database configuration and initialization
- **S3 Integration**: See `README_S3_INTEGRATION.md`

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📄 License

This project is for educational and demonstration purposes.

---

**Note**: This project uses a hardcoded `user_id=1` for now. Authentication and multi-tenancy will be added in a future update for public deployment.
