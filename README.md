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
- **Authentication**: JWT-based secure accounts and multi-tenancy

### Project Structure

```
JobSearchAI/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/endpoints/  # API routes (jobs, resumes, search, outreach, auth, etc.)
│   │   ├── core/           # Security and config
│   │   ├── db/             # Database configuration
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── pdf_generator/       # LaTeX PDF generation
│   ├── main.py             # FastAPI app entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # React components
│   │   ├── services/       # API client functions
│   │   └── types/          # TypeScript types
│   ├── package.json        # Node.js dependencies
│   └── ...
└── docs/                   # Documentation and roadmap
```

## 🚀 Quick Start

### Docker Deployment (Recommended)

The easiest way to run JobSearchAI is using Docker Compose.

1. **Prerequisites:**
   - Docker and Docker Compose installed.

2. **Build and Run:**
   ```bash
   docker-compose up --build
   ```
   This will start:
   - **PostgreSQL**: Database for all data
   - **Backend**: FastAPI server (Port 8000)
   - **Frontend**: Next.js app (Port 3000)

3. **Access the Application:**
   - Frontend: `http://localhost:3000`
   - Backend API Docs: `http://localhost:8000/docs`

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create a `.env` file based on `.env.example`.

4. **Start the backend server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 📊 Current Status

### ✅ Phase 1-4: Core Features (COMPLETE)
- Tracker (Kanban), Hunter (Discovery), Bot (Automation), Referrals foundation.

### ✅ Phase 5: Platform & Security (COMPLETE)
- **Authentication**: JWT-based login/registration.
- **Multi-tenancy**: Data isolated by user at the database level.
- **Protected Routes**: Frontend AuthGuard implemented.

### ⏳ Phase 6: Integration & Polish (IN PROGRESS)
- ✅ Gmail Integration (Status tracking).
- ✅ Production Readiness (Docker + PostgreSQL).
- ⏳ LinkedIn Browser Extension.
- ⏳ Cloud Deployment (AWS/Vercel).

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

### Docker Deployment (Recommended)

The easiest way to run JobSearchAI is using Docker Compose.

1. **Prerequisites:**
   - Docker and Docker Compose installed.

2. **Configure Environment Variables:**
   - Create a `.env` file in the `backend/` directory with your API keys (see [Backend Setup](#backend-setup)).

3. **Build and Run:**
   ```bash
   docker-compose up --build
   ```

4. **Access the Application:**
   - Frontend: `http://localhost:3000`
   - Backend API Docs: `http://localhost:8000/docs`

### Manual Deployment
See `nextSteps.md` Section 11 for detailed manual deployment instructions.

## 📚 Documentation

- **Project Roadmap**: See `nextSteps.md` for detailed phases and features
- **Database Setup**: See `docs/DATABASE_SETUP.md` for detailed database configuration and initialization
- **S3 Integration**: See `README_S3_INTEGRATION.md`

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📄 License

This project is for educational and demonstration purposes.

---

**Note**: This project supports full authentication and multi-tenancy. Each user's data is isolated and secured.
