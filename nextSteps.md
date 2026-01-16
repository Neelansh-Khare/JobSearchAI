# Project Status & Audit

## Current Subprojects

1. **Resume-Customizer/**
   - **Backend (FastAPI):**
     - Generates tailored resumes as PDFs using LaTeX templates.
     - **✅ Phase 1 Complete:** Now includes **persistent database** (SQLite/PostgreSQL) with SQLAlchemy.
     - Modular structure: `app/db/`, `app/models/`, `app/api/endpoints/`, `app/schemas/`, `app/services/`.
     - Database models: Users, Jobs, Resumes, Applications with full relationships.
     - **Job CRUD API**: POST, GET, PATCH, DELETE endpoints for job tracking.
     - **Enhanced Resume API**: `/resumes/tailor` endpoint saves to database and creates Application records.
     - Outputs written to `output/` and/or S3, with database records for tracking.
     - Logging, prompts, and PDF generation pipeline remain intact.
   - **Frontend (Next.js + Tailwind):**
     - **✅ Phase 1 Complete:** New `/jobs` page for viewing and managing saved jobs.
     - Enhanced form with option to save job before customizing resume.
     - Job status tracking with filterable job list.
     - Single-page flow still works (backward compatible).
     - TypeScript types and API integration for job management.
   - **Status:**  
     - **Phase 1 (Tracker Database) ✅ COMPLETE**
     - MVP for resume customization remains functional.
     - Ready for Phase 2 (Job Discovery/Hunter).

2. **email-genius/**
   - **Backend (Flask/FastAPI style single file):**
     - Lightweight app for generating emails (e.g., outreach, follow-ups) from templates and prompts.
   - **Frontend (Jinja template):**
     - Simple `index.html` form-based UI.
   - **Status:**  
     - **Experimental utility** that can be folded into the broader “outreach/cover letter” services.  
     - Good starting point for email/LinkedIn outreach generation but not yet integrated with the main job-tracking workflow.

## Overall Project Status

- **Current State:** 
  - ✅ **Phase 1 COMPLETE**: Full **Tracker Database** foundation with job CRUD, resume tracking, and application management.
  - ✅ Working **Resume Tailoring engine** integrated with database.
  - ✅ **Jobs page** for viewing and managing saved jobs.
  - ✅ Email generation utility (not yet integrated).
- **Completed in Phase 1:**
  - ✅ Persistent storage (SQLite for dev, PostgreSQL ready for production)
  - ✅ Job tracking with status management
  - ✅ Application tracking (links jobs to customized resumes)
  - ✅ Modular backend architecture
  - ✅ Frontend job management UI
- **Gap to Vision:** 
  - ⏳ Job discovery/aggregation (Hunter - Phase 2)
  - ⏳ Automation/bots (cover letters, autofill - Phase 3)
  - ⏳ Network/referral intelligence (Phase 4)
  - ⏳ Kanban board UI (next enhancement)
  - ⏳ Email parsing/Gmail integration
- **Next Focus:**  
 1. **Phase 2**: Job Discovery (Hunter) - Integrate job APIs/scraping
 2. Enhance Tracker UI with Kanban board
 3. Phase 3: Automation & Outreach
 4. Phase 4: Referrals & Network Intelligence

# Next Steps: Evolving "Resume Customizer" into "JobSearchAI"

## 1. Vision
Transform the current single-function Resume Customizer into a holistic **Job Search Automation Platform**. 
The goal is to move from *reactive* (customizing a resume for a job you found) to *proactive* (finding jobs, tracking them, and applying automatically).

**Core Pillars:**
1.  **Discover:** Aggregating job listings from multiple sources with advanced **Filtering** (salary, remote, tech stack).
2.  **Manage:** Kanban-style tracking of applications (Applied, Interview, Offer, Rejected).
3.  **Automate:** 
    *   AI-driven **Resume Tailoring**.
    *   **Cover Letter Generation**.
    *   **Hiring Manager Outreach** (email/LinkedIn templates).
    *   **Auto-filling applications**.
    *   **Rank jobs based on resume similarity**.
    *   **Auto apply to jobs**
4.  **Integrate:** Sync with **LinkedIn** (for easy apply/networking) and **Gmail** (to track application status updates).

---

## 2. Architecture Evolution

### Current State
*   **Frontend:** Next.js (Single Page) - stateless.
*   **Backend:** FastAPI - stateless (processes inputs, returns PDF).
*   **Data:** None (everything is in-memory or temp files).

### Target State
*   **Frontend:** Next.js App Router (Dashboard, Job Board, Tracker).
*   **Backend:** FastAPI (Modular Services).
*   **Database:** PostgreSQL (or SQLite for local dev) to store Users, Resumes, Jobs, Applications, and Templates.
*   **Workers:** Background tasks (Celery or Redis Queue) for long-running scraping and applying tasks.

---

## 3. Database Schema Design (Conceptual)

You need persistence to track applications.

*   **Users**: `id, email, preferences (remote, salary, roles), linkedin_token, gmail_token`
*   **Resumes**: `id, user_id, raw_text, file_path, tags (e.g., 'frontend', 'backend')`
*   **Jobs**: `id, title, company, description, url, source, status (New, Applied, Rejected), salary_range, remote_policy`
*   **Applications**: `id, job_id, resume_id, tailored_resume_path, cover_letter_text, applied_at`
*   **Outreach**: `id, job_id, hiring_manager_name, contact_info, generated_message, status (Draft, Sent)`

---

## 4. Implementation Phases

### Phase 1: The "Tracker" (Foundation)
*Goal: Build the 'Home Base' for the job search.*

1.  **Database Integration:**
    *   Add `SQLAlchemy` (Python) or `Prisma` (Node/Python) to the backend.
    *   Create migrations for the schema above.
2.  **Frontend Dashboard:**
    *   Create a Kanban board (using `dnd-kit` or similar) to move jobs between stages.
    *   View: "My Applications".
3.  **Integrate Existing Tool:**
    *   When a user adds a job to the "Tracker", add a button: **"Generate Tailored Resume"**.
    *   This calls your existing `customize-resume` endpoint, but saves the result to the DB/S3 instead of just returning it.

### Phase 2: The "Hunter" (Discovery & Filtering)
*Goal: Find jobs without leaving the app.*

1.  **Job Aggregation Service:**
    *   **Option A (APIs):** Integrate RapidAPI (JSearch, LinkedIn Jobs API).
    *   **Option B (Scraping):** Build Python scripts using `BeautifulSoup` or `Scrapy` to fetch jobs from company career pages or aggregators (use with caution).
2.  **Job Feed UI:**
    *   A searchable list of jobs with filters for **Salary**, **Remote**, and **Role**.
    *   "Save to Tracker" button.

### Phase 3: The "Bot" (Automation & Outreach)
*Goal: Reduce manual data entry and increase conversion.*

1.  **Content Generation:**
    *   **Cover Letters:** Use LLM to generate cover letters based on the resume + job description.
    *   **Outreach:** Generate 3 variations of LinkedIn connection messages/emails for hiring managers.
2.  **Browser Automation:**
    *   Use **Playwright** (Python version) to automate filling out Greenhouse/Lever forms.
3.  **Integration:**
    *   **Gmail:** Read-only access to scan for "Application Received" or "Interview Request" emails and auto-update job status.
    *   **LinkedIn:** (Difficult via API, often requires extension) Use a Chrome Extension to inject "Save Job" buttons into LinkedIn UI.

### Phase 4: "Jobs by Referral" (Network-Powered Discovery)
*Goal: Use the candidate’s network to surface jobs where they can get warm referrals.*

1. **Connection Data Ingestion**
    * **Primary (Manual / V1):**
        * Allow users to **export their LinkedIn connections** (CSV) and upload the file.
        * Parse connection data into a `Connections` table: `id, user_id, name, title, company, location, linkedin_url, tags`.
    * **Future (Semi-automatic):**
        * Optional **browser extension** that scrapes the user’s LinkedIn connections page and keeps the local `Connections` table in sync.
        * Where To Use Scraping: use a dedicated scraping service built on **Playwright** or **Crawl4AI** for non-API data (company career pages, open roles, etc.) while keeping it compliant and rate-limited. See: [Crawl4AI](https://github.com/unclecode/crawl4ai).
    * **API Notes:**
        * Native LinkedIn APIs for connections are heavily restricted; assume **no reliable direct API access** and lean on **manual upload + browser automation** instead.

2. **Referral Matching Engine**
    * For each job in `Jobs`:
        * Normalize job company names (e.g., “Google LLC” → “Google”) using a simple normalization service.
        * Join against `Connections.company` to find **1st-degree connections** at that company.
    * Optional: Score matches by:
        * **Seniority match** between user’s target role and connection’s title.
        * **Location relevance** (same region, remote-friendly).
    * Persist results in a `Referrals` or extended `Outreach` model:
        * `id, user_id, job_id, connection_id, match_score, status (Suggested, Contacted, Replied)`.

3. **Referral Outreach Generation**
    * For each `(job, connection)` pair:
        * Generate **personalized outreach messages** (LinkedIn DM / email) using the LLM:
            * Inputs: user’s resume, job description, connection’s profile/title, relationship hints.
            * Outputs: 2–3 variants of a referral request message.
    * Allow the user to:
        * Edit messages inline.
        * Copy to clipboard, or send via:
            * **Email:** via Gmail API (when connected).
            * **LinkedIn DM:** copied text or triggered via the browser extension.

4. **UI & Workflow (Phase 4)**
    * Add a **"Referrals" tab** and also embed referral info into:
        * Job detail panel: show “People who can refer you”.
        * Application detail: show “Warm intros you should do before/after applying”.
    * Surfaces:
        * **Referrable Jobs List:** jobs where at least one connection works at the company.
        * **Connection-Centric View:** for each connection, list jobs at their company you’re interested in.
    * Status Tracking:
        * For each referral request, track **Draft → Sent → Replied → Intro Made**.
        * Feed this status back into the main **Tracker** (e.g., badge on a job card: “Referral in progress”).

---

## 5. Technical Recommendations

### Backend Refactor
Move `main.py` into a modular structure:
```text
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── resumes.py (Existing)
│   │   │   ├── jobs.py    (CRUD + Filtering)
│   │   │   ├── outreach.py (New: Generate messages)
│   │   │   └── search.py  (External API calls)
│   ├── core/
│   ├── db/
│   ├── models/
│   └── services/
│       ├── pdf_generator/
│       ├── scraper/
│       └── email_parser/  (New: Gmail integration)
```

### Frontend Additions
*   **State Management:** Use `Zustand` or `TanStack Query` (React Query) to manage the list of jobs and application states.
*   **UI Components:** Add a Table view (TanStack Table) and Kanban Board.

### Libraries to Explore
*   **DB:** `SQLAlchemy` + `Alembic` (Migrations).
*   **Scraping:** `Playwright` or `Crawl4AI`.
*   **Job APIs:** `JSearch` (RapidAPI).
*   **UI:** `shadcn/ui` (continue using/expand usage).

---

## 6. Phase 1 Implementation Status ✅

**✅ COMPLETE: Tracker Database Foundation**

### What Has Been Implemented:

**Backend:**
1. ✅ SQLite/PostgreSQL database setup with SQLAlchemy
2. ✅ Database models: `User`, `Job`, `Resume`, `Application`
3. ✅ Job CRUD API endpoints: `POST /jobs`, `GET /jobs`, `GET /jobs/{id}`, `PATCH /jobs/{id}`, `DELETE /jobs/{id}`
4. ✅ Resume API endpoints: `POST /resumes/upload`, `GET /resumes`, `POST /resumes/tailor` (integrated with database)
5. ✅ Modular backend structure: `app/db/`, `app/models/`, `app/api/endpoints/`, `app/schemas/`, `app/services/`
6. ✅ Database initialization script (`init_db.py`)
7. ✅ Automatic database initialization on server startup

**Frontend:**
1. ✅ Jobs management page (`/jobs`) - View, filter, update status, delete jobs
2. ✅ Enhanced job application form with "save job first" option
3. ✅ TypeScript types and API service functions for job management
4. ✅ Job status tracking (New, Saved, Applied, Interview, Offer, Rejected)

### Setup Instructions:

**1. Install Dependencies:**
```bash
cd Resume-Customizer/backend
pip install -r requirements.txt
```

**2. Initialize Database:**
```bash
cd Resume-Customizer/backend
python init_db.py
```
*(Alternatively, database auto-initializes on server start)*

**3. Start Backend Server:**
```bash
cd Resume-Customizer/backend
uvicorn main:app --reload --port 8000
```
- API docs: `http://127.0.0.1:8000/docs`
- Database: `jobsearchai.db` (SQLite, created automatically)

**4. Start Frontend:**
```bash
cd Resume-Customizer/frontend
npm install  # if not already done
npm run dev
```
- Frontend: `http://localhost:3000`
- Jobs page: `http://localhost:3000/jobs`

### Key Features Now Available:

- ✅ Save jobs with title, company, description, URL, and metadata
- ✅ Track job application status with Kanban-ready status values
- ✅ Link customized resumes to specific jobs automatically
- ✅ View and manage all saved jobs in one place
- ✅ Filter jobs by status
- ✅ Update job status (for future Kanban drag-and-drop)
- ✅ Backward compatible - existing `/customize-resume/` endpoint still works

### Database Schema:

- **users**: User accounts (ready for auth)
- **jobs**: Job listings with status, company, description, URL, etc.
- **resumes**: Resume documents with raw text and file paths
- **applications**: Links jobs to resumes, tracks tailored resume paths and application status

### Next Steps:

**Phase 2 - Job Discovery (Hunter):**
1. Integrate job aggregation APIs (JSearch, LinkedIn Jobs API)
2. Build scraping service using Crawl4AI/Playwright
3. Create Hunter page with search and filters
4. "Save to Tracker" flow from job discovery

**Enhancement - Kanban Board:**
1. Install `dnd-kit` for drag-and-drop
2. Replace jobs list with Kanban board view
3. Drag-and-drop triggers `PATCH /jobs/{id}` status updates


## 7. Resources
1. Internity
2. JobHuntr.fyi
3. Simplify 

## 8. Detailed Product Requirements (PRD)

### 8.1 Product Overview

- **Product Name:** JobSearchAI  
- **Primary Goal:** Automate and optimize the end-to-end job search process: **discover → prioritize → apply → track → leverage network**.  
- **Core Modules:**
  1. **Tracker:** Central Kanban for jobs and applications.
  2. **Hunter:** Job discovery via APIs and scraping.
  3. **Bot:** Automation for tailoring resumes, cover letters, and autofilling forms.
  4. **Referrals:** Network intelligence to find warm introductions and referral paths.

### 8.2 Users & Use Cases

1. **Primary User: Individual Job Seeker**
   - Wants a single place to manage all applications.
   - Needs help prioritizing roles and customizing resumes/cover letters quickly.
   - Wants to tap into their network for referrals without manually hunting LinkedIn.
2. **Secondary User: Power User / Career Coach**
   - Manages multiple candidate pipelines.
   - Needs structured views, filters, and exportable reports.

Key use cases:
- Save a job from anywhere (URL, copy-paste description) and automatically:
  - Parse job details.
  - Match to best-fit resume variant.
  - Generate a tailored resume + cover letter.
  - Suggest relevant connections who can refer.
- See a dashboard of all applications with statuses and next actions.

### 8.3 System Architecture

#### 8.3.1 High-Level Diagram (Conceptual)

- **Frontend (Next.js App Router):**
  - Pages: `Dashboard/Tracker`, `Hunter`, `Job Detail`, `Referrals`, `Settings`.
  - Uses **TanStack Query/Zustand** for state and caching.
- **Backend (FastAPI) – Modular:**
  - `api/endpoints/`:
    - `jobs.py`: CRUD, search, filtering.
    - `resumes.py`: upload, parse, tailor, PDF generation.
    - `applications.py`: CRUD + status transitions.
    - `outreach.py`: cover letters, emails, LinkedIn messages.
    - `search.py`: job sources (APIs + scraping).
    - `referrals.py`: connections ingestion + referral matching.
  - `services/`:
    - `pdf_generator/`: LaTeX pipeline (existing).
    - `scraper/`: Playwright + optional **Crawl4AI** integration for web crawling and content extraction. [Crawl4AI](https://github.com/unclecode/crawl4ai)
    - `email_parser/`: Gmail integration & status inference.
    - `referral_engine/`: matching algorithms for jobs ↔ connections.
- **Database (PostgreSQL / SQLite for dev):**
  - Core tables: `users`, `resumes`, `jobs`, `applications`, `outreach`, `connections`, `referrals`.
- **Background Workers (Celery/RQ + Redis):**
  - Long-running tasks: scraping jobs, generating PDFs, bulk tailoring, referral matching refresh.

#### 8.3.2 Data Model (Detailed)

- **Users**
  - `id, email, password_hash (if auth), preferences (JSON), linkedin_token (nullable), gmail_token (nullable)`
- **Resumes**
  - `id, user_id (FK), raw_text, file_path, tags (JSON), created_at, updated_at`
- **Jobs**
  - `id, user_id (owner), title, company, description, url, source, status (New, Saved, Applied, Interview, Offer, Rejected), salary_range, remote_policy, location, created_at`
- **Applications**
  - `id, job_id (FK), resume_id (FK), tailored_resume_path, cover_letter_text, applied_at, last_status_update, current_stage`
- **Outreach**
  - `id, user_id, job_id, to_name, to_email_or_profile, channel (Email, LinkedIn), generated_message, variant_index, status (Draft, Sent, Replied), sent_at`
- **Connections**
  - `id, user_id, name, title, company, location, linkedin_url, tags (JSON), imported_from (CSV, extension), imported_at`
- **Referrals**
  - `id, user_id, job_id, connection_id, match_score, status (Suggested, Contacted, Replied, Intro_Made), notes, updated_at`

### 8.4 Feature Implementation Details

#### 8.4.1 Tracker

- **Backend:**
  - Endpoints:
    - `POST /jobs`: create a job (title, company, description, url, source).
    - `GET /jobs`: list with filters (status, company, role, remote).
    - `PATCH /jobs/{id}`: update status (for Kanban drag-and-drop).
    - `GET /jobs/{id}`: job detail including related `applications`, `outreach`, `referrals`.
  - Business logic:
    - Enforce allowed status transitions (e.g., New → Applied → Interview).
    - Auto-create an `Application` record on “Mark as Applied”.
- **Frontend:**
  - Kanban board using `dnd-kit`:
    - Columns: New, Saved, Applied, Interview, Offer, Rejected.
    - Drag-and-drop triggers `PATCH /jobs/{id}`.
  - Job detail side panel:
    - Shows parsed description, attachments, tailored resume links, outreach, referral suggestions.

#### 8.4.2 Hunter (Job Discovery)

- **Backend:**
  - `search.py`:
    - Integrate 3rd-party APIs (e.g., JSearch on RapidAPI) for structured job feeds.
    - For custom sources (company career pages), use:
      - **Crawl4AI** as a crawling/extraction engine to fetch URLs and job blocks.
      - Parsing pipeline to normalize into `Jobs` schema.
  - Worker tasks:
    - Scheduled crawls for saved “search profiles” (e.g., “Remote frontend roles, $X+ salary”).
- **Frontend:**
  - Hunter page:
    - Search bar + filters (location, remote, salary, tech stack).
    - Job list with “Save to Tracker” + “Tailor Resume” CTA buttons.
    - Pagination / infinite scroll.

#### 8.4.3 Bot (Automation & Outreach)

- **Backend:**
  - Tailored resume:
    - Endpoint `POST /resumes/tailor`:
      - Inputs: `resume_id`, `job_id` (or raw job description).
      - Steps: extract relevant bullets, rewrite summary, regenerate PDF via LaTeX.
  - Cover letters:
    - Endpoint `POST /outreach/cover-letter`:
      - Inputs: `resume_id`, `job_id`, tone settings.
      - Use LLM to generate structured letter; persist to `Outreach`.
  - Browser automation:
    - Worker task that uses Playwright to open job application URLs and autofill using stored profile/resume data.
- **Frontend:**
  - From job detail:
    - Buttons: “Generate Tailored Resume”, “Generate Cover Letter”.
    - Show progress indicators for long-running tasks (polling worker results).

#### 8.4.4 Referrals (Jobs by Referral)

- **Backend:**
  - Connections ingestion:
    - `POST /connections/upload` (CSV): parse & validate headers.
    - Store connections and trigger a background job to refresh referral matches.
  - Referral matching:
    - `/referrals/rebuild` (worker): recompute matches across all `Jobs` for a user.
    - `GET /referrals?job_id=...`: list referral candidates for a given job.
  - Outreach:
    - `POST /referrals/{id}/message`: generate personalized message for a specific referral.
    - Integrate with Gmail API if configured; otherwise return message for manual sending.
- **Frontend:**
  - **Referrals Tab:**
    - Table of jobs with counts: “Connections at this company (N)”.
    - Click into a job → list of connections + suggested message preview.
  - **Upload Flow:**
    - Simple “Upload LinkedIn Connections CSV” wizard with field mapping check.
  - **Inline in Tracker:**
    - Small badge on job cards: “2 possible referrers”.

### 8.5 Frontend UX & Screens

1. **Dashboard / Tracker**
   - Left sidebar: navigation (`Tracker`, `Hunter`, `Referrals`, `Settings`).
   - Main area: Kanban board of jobs.
   - Right panel: job detail with tabs (`Overview`, `Application`, `Outreach`, `Referrals`).
2. **Hunter**
   - Top: filters + search bar.
   - Center: job cards list with key details and actions (“Save”, “Tailor”, “View Details”).
3. **Job Detail**
   - Shows parsed JD, tailored assets, outreach drafts, and referral candidates.
4. **Referrals**
   - Two views:
     - **By Job:** For each job, show connections at that company.
     - **By Connection:** For each connection, show jobs where they could refer.
5. **Settings**
   - Integrations: Gmail, (future) LinkedIn/browser extension.
   - Data: Upload/download connections, export applications.

### 8.6 Non-Functional Requirements

- **Performance:** Kanban interactions and list loading should feel instant (<200ms perceived latency with client caching).
- **Security & Privacy:** 
  - Encrypt tokens (Gmail) at rest.
  - Treat connection and application data as highly sensitive; provide export/delete options.
- **Compliance:**
  - Respect robots.txt and rate limits when crawling with Crawl4AI/Playwright.
  - Keep any LinkedIn-related automation within ToS as much as possible (emphasize manual upload + extensions).

### 8.7 Milestones

1. **Milestone 1 – Tracker MVP** ✅ **COMPLETE**
   - ✅ DB in place (SQLite/PostgreSQL with SQLAlchemy)
   - ✅ Basic job CRUD (POST, GET, PATCH, DELETE)
   - ✅ Manual job creation via form
   - ⏳ Kanban board UI (enhancement - next step)
2. **Milestone 2 – Hunter MVP** ⏳ **IN PROGRESS**
   - ⏳ External job feed integration (JSearch, LinkedIn Jobs API)
   - ⏳ Scraping service (Crawl4AI/Playwright)
   - ⏳ Save-to-tracker flow from discovery
   - ⏳ Hunter page with search and filters
3. **Milestone 3 – Bot MVP** ⏳ **PLANNED**
   - ✅ Tailored resume generation (exists, now integrated with DB)
   - ⏳ Cover letter generation wired into jobs
   - ⏳ Browser automation for autofill
4. **Milestone 4 – Referrals MVP** ⏳ **PLANNED**
   - ⏳ CSV upload of connections
   - ⏳ Referral matching engine
   - ⏳ Basic referral UI
5. **Milestone 5 – Automation & Polish** ⏳ **PLANNED**
   - ⏳ Background workers (Celery/RQ)
   - ⏳ Scraping integrations
   - ⏳ UX refinements
   - ⏳ Analytics and insights

## 9. V2+ Roadmap (Future Ideas)

These features are explicitly **V2+** and will be implemented after the core Tracker/Hunter/Bot/Referrals experience is stable.

### 9.1 Calendar for Coffee Chats & Follow-Ups

- **Goal:** Turn networking into a structured, low-friction habit rather than ad-hoc outreach.
- **Key Capabilities:**
  - Parse email replies (via Gmail integration) to detect when someone agrees to chat or proposes times.
  - Offer “one-click” actions from within JobSearchAI to:
    - Create calendar events (Google Calendar, Outlook) pre-filled with video links and context.
    - Attach the relevant job, company, and notes to the calendar event.
  - Maintain a dedicated **Networking Calendar view** inside the app:
    - Upcoming coffee chats, recruiter calls, and interviews.
    - Auto-reminders to send pre- and post-meeting follow-ups.

### 9.2 Interview Prep for Your Career Path

- **Goal:** Provide tailored interview preparation based on role (e.g., SWE, PM, DS, design) and target company type.
- **Key Capabilities:**
  - Generate **role-specific question banks** using the user’s resume and the job description.
  - Provide **mock interviews** with structured feedback:
    - Behavioral (STAR-based prompts, story bank suggestions).
    - Technical (concept questions, coding prompts, system design outlines).
  - Surface **company-specific prep packs**:
    - Common questions, culture notes, and key values (where data is available).
  - Track prep progress per application so the user knows when they are “interview ready”.

### 9.3 AI Career Coach

- **Goal:** Act as a long-term, context-aware career companion rather than a one-off job search tool.
- **Key Capabilities:**
  - Ingest the user’s full history: past roles, skills, applications, interviews, offers, and rejections.
  - Recommend **target roles, companies, and upskilling paths** based on:
    - Historical success rates (where did interviews/offers cluster?).
    - Market demand for certain skills and titles.
  - Provide **ongoing coaching** via:
    - Weekly “job search health” reports (applications, responses, interviews).
    - Suggestions to rebalance focus (e.g., “fewer cold applications, more referrals”).
  - Act as a conversational agent that can answer “What should I do next?” in the context of the user’s pipeline.

### 9.4 Additional Future Features to Consider

- **Job Search Insights & Analytics:**
  - Visualize funnel metrics (Saved → Applied → Interview → Offer) by role, company type, and channel.
  - Similar to the “Job Insights” and performance analytics in tools like Careerflow’s Job Tracker ([careerflow.ai](https://www.careerflow.ai/job-tracker)), but deeply tied to tailored resume/cover letter quality.
- **Networking Tracker:**
  - CRM-style view of contacts (recruiters, hiring managers, referrers) with relationship strength, last contact date, and next action.
  - Integrate tightly with the Referrals module to keep track of warm intros and follow-ups.
- **Offer Management & Negotiation Coach:**
  - Track offers (comp, equity, benefits) in one place.
  - Provide AI-guided negotiation scripts and counter-offer suggestions.
- **Learning & Skill Gap Recommender:**
  - Based on roles the user is repeatedly rejected from, suggest specific skills and resources to close gaps (courses, projects, certifications).
- **Advanced Automation:**
  - Smart batching of applications and outreach (e.g., “Apply to these 10 high-fit roles this week with tailored materials”).
  - Smart reminders for follow-ups, coffee chats, and interview prep tasks integrated with the calendar module.

## 10. Inspiration & Reference Tools

These tools and products serve as inspiration for UX, features, and positioning:

- **OfferLoop** – `https://offerloop.ai`
- **Careerflow Job Tracker** – [careerflow.ai/job-tracker](https://www.careerflow.ai/job-tracker)
- **Simplify** – `https://simplify.com`
- **JobCopilot** – `https://jobcopilot.ai`
- **JobHuntr** – `https://jobhuntr.fyi`
