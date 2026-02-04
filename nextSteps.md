# Project Status & Audit

## Unified Application Architecture

**Important:** This is a **single, unified application** called **JobSearchAI**. All features (resume customization, email generation, job tracking, future features) are part of one integrated system with:
- **One database** (PostgreSQL/SQLite) for all features
- **One backend** (FastAPI) serving all endpoints
- **One frontend** (Next.js) with multiple pages/routes
- **One deployment** (not separate services)

## Current Implementation Status

### Main Application: JobSearchAI

**Backend (FastAPI) - Unified:**
- **✅ Phase 1 Complete:** **Persistent database** (SQLite/PostgreSQL) with SQLAlchemy.
- **✅ Phase 2 Complete:** **Job Discovery (Hunter)** - JSearch API integration for job search.
- **Modular structure:** `app/db/`, `app/models/`, `app/api/endpoints/`, `app/schemas/`, `app/services/`.
- **Database models:** Users, Jobs, Resumes, Applications (shared across all features).
- **Job CRUD API:** POST, GET, PATCH, DELETE endpoints for job tracking.
- **Resume API:** `/resumes/tailor` endpoint saves to database and creates Application records.
- **Search API:** `/search/jobs` endpoint for job discovery with filters (location, remote, employment type, date posted).
- **Email/Outreach (from email-genius):** Will be integrated as `/api/endpoints/outreach.py` (Phase 3).
- **Outputs:** Written to `output/` and/or S3, with database records for tracking.
- **Status:**  
  - **Phase 1 (Tracker Database) ✅ COMPLETE**
  - **Phase 2 (Hunter - Job Discovery) ✅ COMPLETE**
  - Resume customization functional and integrated.
  - Ready for Phase 3 (Automation & Outreach).

**Frontend (Next.js + Tailwind) - Unified:**
- **✅ Phase 1 Complete:** `/jobs` page for viewing and managing saved jobs.
- **✅ Phase 2 Complete:** `/hunter` page for job discovery with search and filters.
- **✅ Kanban Board:** Drag-and-drop job tracking with dnd-kit.
- **Enhanced form:** Option to save job before customizing resume.
- **Job status tracking:** Filterable job list with Kanban board view.
- **Single-page flow:** Still works (backward compatible).
- **Pages implemented:**
  - `/` - Home/Resume Customization ✅
  - `/jobs` - Job Tracker with Kanban Board ✅
  - `/hunter` - Job Discovery ✅
  - `/outreach` - Email/Cover Letter Generation (Phase 3) ✅
  - `/referrals` - Network Referrals (Phase 4)
  - `/settings` - User Settings

## Overall Project Status

**Unified Application: JobSearchAI**
- **Architecture:** Single FastAPI backend + Single Next.js frontend + Single PostgreSQL database
- **All features share:** Same database, same user accounts, same authentication, same deployment

- **Current State:** 
  - ✅ **Phase 1 COMPLETE**: Full **Tracker Database** foundation with job CRUD, resume tracking, and application management.
  - ✅ **Phase 2 COMPLETE**: **Hunter (Job Discovery)** - Job search API integration, search UI with filters, save to tracker functionality.
  - ✅ **Kanban Board COMPLETE**: Drag-and-drop job tracking with status management.
  - ✅ Working **Resume Tailoring engine** integrated with database.
  - ✅ **Jobs page** with Kanban board for viewing and managing saved jobs.
  - ✅ **Hunter page** for discovering and saving jobs.
  - ✅ **Email/Outreach (Phase 3 - Content Generation)** - Email generation and contact finding integrated.
- **Completed in Phase 1:**
  - ✅ Persistent storage (SQLite for dev, PostgreSQL ready for production)
  - ✅ Job tracking with status management
  - ✅ Application tracking (links jobs to customized resumes)
  - ✅ Modular backend architecture (ready for all future features)
  - ✅ Frontend job management UI
- **Completed in Phase 2:**
  - ✅ Job search API integration (JSearch via RapidAPI)
  - ✅ Job discovery UI (`/hunter` page) with search and filters
  - ✅ Save to tracker functionality from search results
  - ✅ Kanban board UI with drag-and-drop (`/jobs` page)
  - ✅ Status filtering and job management
- **Completed in Phase 3 (Partial):**
  - ✅ Email/Cover Letter Generation & Contact Finding integrated (core `email-genius` logic moved to `app/services/email_generator.py`, new endpoints in `app/api/endpoints/outreach.py`, and `/outreach` page in Next.js frontend).
- **Gap to Vision:** 
  - ⏳ Automation/bots (cover letters, autofill - Phase 3) - **Next up: Browser Automation & Gmail Integration**
  - ⏳ Network/referral intelligence (Phase 4) - **Will be new routes in same app**
- **Next Focus:**  
 1. **Phase 3 (Remaining)**: Browser Automation & Gmail Integration
 2. **Phase 4**: Referrals & Network Intelligence - New `/referrals` page, new endpoints
 3. Authentication & Multi-tenancy - Remove hardcoded user_id, add user accounts

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

### Target State (Unified Application)
*   **Frontend:** Next.js App Router with multiple routes:
    - `/` - Home/Resume Customization
    - `/jobs` - Job Tracker (Kanban board)
    - `/hunter` - Job Discovery
    - `/outreach` - Email/Cover Letter Generation (integrates email-genius)
    - `/referrals` - Network Referrals
    - `/settings` - User Settings
*   **Backend:** FastAPI (Modular Services) - **Single unified backend**:
    - All endpoints under one FastAPI app
    - Shared database for all features
    - Modular structure: `app/api/endpoints/` (jobs, resumes, outreach, search, referrals)
*   **Database:** PostgreSQL (or SQLite for local dev) - **Single database** storing:
    - Users, Resumes, Jobs, Applications, Outreach, Connections, Referrals
    - All features share the same database schema
*   **Workers:** Background tasks (Celery or Redis Queue) for long-running scraping and applying tasks.
*   **Deployment:** Single deployment (one backend, one frontend, one database).

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

### Phase 2: The "Hunter" (Discovery & Filtering) ✅ COMPLETE
*Goal: Find jobs without leaving the app.*

**✅ Completed:**
1.  **Job Aggregation Service:**
    *   ✅ Integrated JSearch API (RapidAPI) for job search
    *   ✅ Created `/search/jobs` endpoint with filters (location, remote, employment type, date posted)
    *   ✅ Created `/search/jobs/save` endpoint to save jobs from search to tracker
2.  **Job Feed UI:**
    *   ✅ Created `/hunter` page with searchable job list
    *   ✅ Filters for Location, Remote Only, Employment Type, Date Posted
    *   ✅ "Save to Tracker" button on each job card
    *   ✅ Job details display (title, company, location, salary, description)
3.  **Kanban Board Enhancement:**
    *   ✅ Implemented drag-and-drop Kanban board on `/jobs` page using dnd-kit
    *   ✅ Six columns: New, Saved, Applied, Interview, Offer, Rejected
    *   ✅ Drag jobs between columns to update status
    *   ✅ Status filtering still available

**Future Enhancements (Optional):**
- Background workers for scheduled job crawls (Redis + Celery/RQ)
- Additional job sources (LinkedIn Jobs API, company career pages)
- Scraping service using Crawl4AI/Playwright for custom sources

### Phase 3: The "Bot" (Automation & Outreach)
*Goal: Reduce manual data entry and increase conversion.*

**Note:** This phase integrates the email-genius functionality into the main application.

1.  **Content Generation (Integrates email-genius):**
    *   **Cover Letters:** Use LLM to generate cover letters based on the resume + job description.
    *   **Outreach:** Generate 3 variations of LinkedIn connection messages/emails for hiring managers.
    *   **Implementation:**
        *   Move email-genius logic to `app/services/email_generator.py`
        *   Create `app/api/endpoints/outreach.py` with endpoints:
            *   `POST /outreach/cover-letter` - Generate cover letter
            *   `POST /outreach/email` - Generate outreach email
            *   `POST /outreach/linkedin-message` - Generate LinkedIn message
        *   Add `Outreach` model to database (already in schema)
        *   Create `/outreach` page in Next.js frontend
2.  **Browser Automation:**
    *   Use **Playwright** (Python version) to automate filling out Greenhouse/Lever forms.
    *   Add to `app/services/browser_automation.py`
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

### Backend Structure (Unified Application)
Current modular structure (all features in one backend):
```text
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── resumes.py (✅ Existing - Resume customization)
│   │   │   ├── jobs.py    (✅ Existing - Job CRUD)
│   │   │   ├── outreach.py (⏳ Phase 3 - Email/Cover letters, integrates email-genius)
│   │   │   ├── search.py  (⏳ Phase 2 - Job discovery APIs/scraping)
│   │   │   └── referrals.py (⏳ Phase 4 - Referral matching)
│   ├── core/
│   ├── db/ (✅ Single database for all features)
│   ├── models/ (✅ Shared models: User, Job, Resume, Application, Outreach, Connection, Referral)
│   └── services/
│       ├── pdf_generator/ (✅ Existing)
│       ├── resume_processor/ (✅ Existing)
│       ├── email_generator/ (⏳ Phase 3 - From email-genius)
│       ├── scraper/ (⏳ Phase 2 - Crawl4AI/Playwright)
│       └── email_parser/ (⏳ Phase 3 - Gmail integration)
├── main.py (✅ Single FastAPI app, includes all routers)
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

## 6. Phase 1 & Phase 2 Implementation Status ✅

**✅ COMPLETE: Phase 1 - Tracker Database Foundation**

**✅ COMPLETE: Phase 2 - Hunter (Job Discovery) & Kanban Board**

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
cd backend
pip install -r requirements.txt
```

**2. Initialize Database:**
```bash
cd backend
python init_db.py
```
*(Alternatively, database auto-initializes on server start)*

**3. Start Backend Server:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```
- API docs: `http://127.0.0.1:8000/docs`
- Database: `jobsearchai.db` (SQLite, created automatically)

**For Production Deployment:** See Section 11 (Deployment & Hosting Guide) for complete deployment instructions.

**4. Start Frontend:**
```bash
cd frontend
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

### Phase 2 Implementation Details:

**✅ Backend - Job Search API:**
- Created `app/api/endpoints/search.py` with JSearch integration
- `GET /search/jobs` - Search jobs with filters
- `POST /search/jobs/save` - Save job from search to tracker
- Integrated with existing job CRUD endpoints

**✅ Frontend - Hunter Page:**
- Created `/hunter` page (`src/app/hunter/page.tsx`)
- Search form with query, location, remote, employment type, date posted filters
- Job cards displaying title, company, location, salary, description
- "Save to Tracker" button on each job
- Toast notifications for user feedback

**✅ Frontend - Kanban Board:**
- Updated `/jobs` page with drag-and-drop Kanban board
- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Six columns: New, Saved, Applied, Interview, Offer, Rejected
- Drag jobs between columns to update status
- Status filtering still functional
- Visual feedback during drag operations

### Next Steps:

**Phase 3 - Automation & Outreach:**
1. Integrate email-genius code into main app
2. Create cover letter generation endpoints
3. Build outreach UI (`/outreach` page)
4. Browser automation for form filling (Playwright)
5. Gmail integration for status tracking

**Phase 4 - Referrals:**
1. LinkedIn connections CSV upload
2. Referral matching engine
3. Network-powered job discovery UI
4. Personalized outreach generation


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

#### 8.3.1 High-Level Diagram (Unified Application)

**Single Unified Application:**
- **Frontend (Next.js App Router) - One Application:**
  - Routes: `/` (Home), `/jobs` (Tracker), `/hunter` (Discovery), `/outreach` (Email/Cover Letters), `/referrals`, `/settings`.
  - Uses **TanStack Query/Zustand** for state and caching.
  - All pages share same authentication, user context, and API base URL.
- **Backend (FastAPI) – Single Unified Backend:**
  - One FastAPI app (`main.py`) with all routers included.
  - `api/endpoints/`:
    - `jobs.py`: CRUD, search, filtering (✅ Phase 1).
    - `resumes.py`: upload, parse, tailor, PDF generation (✅ Phase 1).
    - `outreach.py`: cover letters, emails, LinkedIn messages (⏳ Phase 3 - integrates email-genius).
    - `search.py`: job sources (APIs + scraping) (⏳ Phase 2).
    - `referrals.py`: connections ingestion + referral matching (⏳ Phase 4).
  - `services/`:
    - `pdf_generator/`: LaTeX pipeline (✅ Phase 1).
    - `resume_processor/`: Resume analysis and tailoring (✅ Phase 1).
    - `email_generator/`: Email/cover letter generation (⏳ Phase 3 - from email-genius).
    - `scraper/`: Playwright + optional **Crawl4AI** integration (⏳ Phase 2). [Crawl4AI](https://github.com/unclecode/crawl4ai)
    - `email_parser/`: Gmail integration & status inference (⏳ Phase 3).
    - `referral_engine/`: matching algorithms for jobs ↔ connections (⏳ Phase 4).
- **Database (PostgreSQL / SQLite for dev) - Single Database:**
  - **One database** with all tables: `users`, `resumes`, `jobs`, `applications`, `outreach`, `connections`, `referrals`.
  - All features share the same database schema and user accounts.
- **Background Workers (Celery/RQ + Redis) - Optional:**
  - Long-running tasks: scraping jobs, generating PDFs, bulk tailoring, referral matching refresh.
  - Deployed as part of the same backend or separate worker instances.

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
2. **Milestone 2 – Hunter MVP** ✅ **COMPLETE**
   - ✅ External job feed integration (JSearch API)
   - ✅ Save-to-tracker flow from discovery
   - ✅ Hunter page with search and filters
   - ✅ Kanban board with drag-and-drop
   - ⏳ Scraping service (Crawl4AI/Playwright) - Optional enhancement
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

### 9.2 Interview Management & Tracking (Revised)

**Note:** Generic AI interview prep removed - users can find that online. Focus on personalized, contextual prep tied to specific applications.

- **Goal:** Help users prepare for interviews by leveraging their specific application context and tracking interview progress.
- **Key Capabilities:**
  - **Personalized Question Suggestions:**
    - Based on user's resume + specific job description (not generic questions)
    - "How would you answer this question based on your experience at [Company X]?"
    - STAR story suggestions from user's actual work history
  - **Interview Tracking:**
    - Store interview details (type, date, interviewer names, format)
    - Post-interview notes and feedback
    - Track interview questions asked (build personal question bank)
    - Thank you note generation and tracking
  - **Company-Specific Context:**
    - Link to company research (from Company Research feature)
    - Interviewer LinkedIn profiles (if available)
    - Company values/culture notes for behavioral questions
  - **Interview Readiness Checklist:**
    - Resume tailored? ✅
    - Cover letter sent? ✅
    - Company researched? ✅
    - STAR stories prepared? ✅
    - Questions for interviewer ready? ✅
  
**What We DON'T Do:**
- ❌ Generic interview question banks (users can find these online)
- ❌ Generic mock interviews (plenty of tools exist)
- ❌ Generic behavioral question prep (not differentiated)

**What We DO:**
- ✅ Contextual prep tied to user's specific application
- ✅ Interview tracking and organization
- ✅ Personalized story suggestions from their resume
- ✅ Integration with company research and application data

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
  - Similar to the "Job Insights" and performance analytics in tools like Careerflow's Job Tracker ([careerflow.ai](https://www.careerflow.ai/job-tracker)), but deeply tied to tailored resume/cover letter quality.
- **Networking Tracker:**
  - CRM-style view of contacts (recruiters, hiring managers, referrers) with relationship strength, last contact date, and next action.
  - Integrate tightly with the Referrals module to keep track of warm intros and follow-ups.
- **Offer Management & Negotiation Coach:**
  - Track offers (comp, equity, benefits) in one place.
  - Provide AI-guided negotiation scripts and counter-offer suggestions.
- **Learning & Skill Gap Recommender:**
  - Based on roles the user is repeatedly rejected from, suggest specific skills and resources to close gaps (courses, projects, certifications).
- **Advanced Automation:**
  - Smart batching of applications and outreach (e.g., "Apply to these 10 high-fit roles this week with tailored materials").
  - Smart reminders for follow-ups, coffee chats, and interview prep tasks integrated with the calendar module.

### 9.5 Additional Missing Features in Job Application Process

These features address gaps in the complete job search lifecycle:

#### Company Research & Intelligence
- **Company Profiles:**
  - Auto-populate company info (size, industry, funding, culture) from APIs (Clearbit, Crunchbase)
  - Glassdoor integration for reviews, ratings, interview difficulty
  - Levels.fyi integration for salary data
  - Company culture fit analysis based on user preferences
- **Company Notes:**
  - Save research notes per company
  - Track company-specific interview questions
  - Store company values/mission for interview prep

#### Salary Research & Negotiation
- **Salary Intelligence:**
  - Real-time salary data from multiple sources (Levels.fyi, Glassdoor, PayScale)
  - Role-specific salary ranges based on location, experience, company size
  - Total compensation calculator (base + equity + benefits)
- **Offer Comparison:**
  - Side-by-side offer comparison matrix
  - Cost of living adjustments
  - Benefits comparison (healthcare, PTO, 401k matching)
  - AI-powered "which offer is better" analysis

#### Application Materials Management
- **Portfolio & Profile Management:**
  - Track GitHub profile, personal website, portfolio links
  - AI suggestions for profile optimization
  - Portfolio piece recommendations based on job requirements
- **Reference Management:**
  - Store reference contacts (name, title, company, relationship, contact info)
  - Reference request tracking (who asked, when, status)
  - Reference letter templates
  - Reminder to update references periodically

#### Interview Management (Beyond Prep)
- **Interview Scheduling:**
  - Calendar integration for interview scheduling
  - Interview type tracking (phone screen, technical, behavioral, on-site, virtual)
  - Interviewer information storage
  - Interview location/dial-in details
- **Post-Interview Tracking:**
  - Interview notes and feedback (what went well, what didn't)
  - Questions asked (build company-specific question bank)
  - Thank you note generation and tracking
  - Follow-up reminder automation
  - Interview performance self-assessment
- **Personalized Prep (Not Generic):**
  - STAR story suggestions from user's actual resume/work history
  - "How to answer X question based on your experience at [Company]"
  - Questions to ask interviewer based on company research
  - Interview readiness checklist tied to specific application

#### Application Analytics & Metrics
- **Job Search Dashboard:**
  - Application velocity (applications per week)
  - Response rate by source (LinkedIn, Indeed, company website, referral)
  - Time-to-response tracking
  - Conversion rates (application → interview → offer)
  - Best performing resume versions (which got most interviews)
  - Best performing cover letter templates
- **Goal Setting & Tracking:**
  - Set weekly/monthly application goals
  - Track progress toward goals
  - Application target reminders
  - Time spent on job search tracking

#### Skills & Development
- **Skills Gap Analysis:**
  - Compare user skills vs. job requirements
  - Identify missing skills for target roles
  - Suggest learning resources (courses, tutorials, projects)
  - Track skill development progress
- **Certification Tracker:**
  - Track certifications (completed, in-progress, planned)
  - Certification recommendations based on job requirements
  - Expiration date reminders

#### Application Workflow Enhancements
- **Application Deadline Management:**
  - Track application deadlines
  - Reminders for upcoming deadlines
  - Priority scoring (deadline + fit score)
- **Bulk Application Tools:**
  - Apply to multiple similar roles at once
  - Template-based application workflow
  - Batch resume customization
- **Application Status Deep Tracking:**
  - Sub-statuses within main status (e.g., "Interview" → "Phone Screen", "Technical Round", "Final Round")
  - Timeline view of application progress
  - Stale application detection (no update in X days)

#### Rejection & Learning
- **Rejection Analysis:**
  - Track rejection reasons (if provided)
  - Pattern detection (rejected from similar roles/companies)
  - Learning from rejections (what to improve)
  - Rejection recovery suggestions
- **Success Pattern Analysis:**
  - What worked? (which resume versions, cover letters, outreach messages led to interviews)
  - Best performing job sources
  - Best performing application timing

#### Networking Enhancements
- **Event Tracking:**
  - Career fair attendance
  - Meetup/conference participation
  - Networking event notes and contacts
- **Relationship Strength Scoring:**
  - Rate relationship strength with contacts
  - Track interaction history
  - Suggest when to reconnect

#### Automation & Efficiency
- **Smart Job Alerts:**
  - Saved search profiles (e.g., "Remote SWE, $150k+, Python")
  - Auto-save matching jobs to tracker
  - Daily/weekly digest of new matches
- **Application Templates:**
  - Save common application form answers
  - Auto-fill frequently asked questions
  - Company-specific application notes

#### Integration Enhancements
- **ATS Optimization:**
  - Real-time ATS score (already have this)
  - ATS keyword suggestions
  - Resume format optimization recommendations
- **LinkedIn Deep Integration:**
  - Auto-save jobs from LinkedIn
  - Profile optimization suggestions
  - Connection recommendations for target companies
  - Activity tracking (who viewed your profile)

#### User Experience
- **Quick Actions:**
  - "Apply Now" button that generates resume + cover letter + saves to tracker in one click
  - "Save for Later" with auto-reminder
  - "Not Interested" to hide and learn preferences
- **Mobile App:**
  - Quick job saving on mobile
  - Interview reminders
  - Application status updates on-the-go

#### Data & Privacy
- **Data Export:**
  - Export all application data (CSV, JSON)
  - Resume version history
  - Complete application timeline
- **Data Backup:**
  - Automatic cloud backup
  - Version history for resumes/cover letters
  - Restore previous versions

### 9.6 Feature Priority Recommendations

**High Priority (Core Job Search):**
1. Company research & salary intelligence
2. Interview scheduling & management
3. Application analytics dashboard
4. Post-interview tracking & thank you notes
5. Application deadline reminders

**Medium Priority (Enhancement):**
1. Reference management
2. Portfolio/profile optimization
3. Skills gap analysis
4. Offer comparison tool
5. Bulk application tools

**Low Priority (Nice to Have):**
1. Mobile app
2. Networking event tracking
3. Certification tracker
4. Rejection pattern analysis
5. LinkedIn deep integration

## 10. Inspiration & Reference Tools

These tools and products serve as inspiration for UX, features, and positioning:

- **OfferLoop** – `https://offerloop.ai`
- **Careerflow Job Tracker** – [careerflow.ai/job-tracker](https://www.careerflow.ai/job-tracker)
- **Simplify** – `https://simplify.com`
- **JobCopilot** – `https://jobcopilot.ai`
- **JobHuntr** – `https://jobhuntr.fyi`

## 11. Deployment & Hosting Guide

This section covers everything needed to deploy JobSearchAI to production.

### 11.1 Pre-Deployment Checklist

**Backend Requirements:**
- ✅ Environment variables configured
- ✅ Database migrations ready (Alembic)
- ✅ Production database (PostgreSQL) provisioned
- ✅ S3 bucket configured for file storage
- ✅ API keys secured (Gemini AI, job APIs)
- ✅ CORS configured for production domain
- ✅ Logging and error tracking set up

**Frontend Requirements:**
- ✅ Environment variables for API endpoints
- ✅ Production build tested
- ✅ API base URL configured
- ✅ Error boundaries implemented

### 11.2 Environment Variables

**Backend (`.env` file):**

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/jobsearchai
# For local dev: DATABASE_URL=sqlite:///./jobsearchai.db

# AI Service
GEMINI_API_KEY=your_gemini_api_key_here

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=jobsearchai-resumes

# CORS (production domain)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Security
SECRET_KEY=your_secret_key_for_sessions  # For future auth
ENVIRONMENT=production

# Optional: Job APIs (Phase 2)
JSEARCH_API_KEY=your_jsearch_api_key  # From RapidAPI
LINKEDIN_CLIENT_ID=your_linkedin_client_id  # If using LinkedIn API

# Optional: Email (Phase 3)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret

# Optional: Background Workers (Phase 5)
REDIS_URL=redis://localhost:6379  # For Celery/RQ
```

**Frontend (`.env.local` or `.env.production`):**

```bash
# API Base URL
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
# For local dev: NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

### 11.3 Database Setup for Production

**Option A: Managed PostgreSQL (Recommended)**

1. **Supabase** (Free tier available):
   ```bash
   # Get connection string from Supabase dashboard
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

2. **Neon** (Serverless PostgreSQL):
   ```bash
   # Get connection string from Neon dashboard
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname
   ```

3. **Railway** (Includes PostgreSQL addon):
   - Create PostgreSQL service
   - Connection string auto-provided

4. **AWS RDS / Google Cloud SQL** (Enterprise):
   - Full control, higher cost
   - Best for high-traffic production

**Database Migrations:**

```bash
# Install Alembic (if not already in requirements.txt)
pip install alembic

# Initialize Alembic (one-time)
cd backend
alembic init alembic

# Configure alembic.ini to use your DATABASE_URL
# Then create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 11.4 Backend Deployment Options

#### Option 1: Railway (Recommended for Simplicity)

**Steps:**
1. Sign up at [railway.app](https://railway.app)
2. Create new project → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables in Railway dashboard
5. Add PostgreSQL service (Railway will auto-configure `DATABASE_URL`)
6. Railway auto-detects FastAPI and deploys

**Railway Configuration:**
- **Build Command:** (auto-detected)
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Check:** `/health` endpoint

**Cost:** ~$5-20/month (includes PostgreSQL)

#### Option 2: Render

**Steps:**
1. Sign up at [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Configure:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3
4. Add PostgreSQL database (separate service)
5. Add environment variables
6. Deploy

**Cost:** Free tier available, $7/month for PostgreSQL

#### Option 3: Fly.io

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Create `fly.toml`:
   ```toml
   app = "jobsearchai-backend"
   primary_region = "iad"

   [build]
     builder = "paketobuildpacks/builder:base"

   [http_service]
     internal_port = 8000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]

   [[services]]
     protocol = "tcp"
     internal_port = 8000
     processes = ["app"]
   ```
4. Deploy: `fly deploy`
5. Add secrets: `fly secrets set GEMINI_API_KEY=xxx DATABASE_URL=xxx`

**Cost:** Pay-as-you-go, ~$2-10/month for small apps

#### Option 4: AWS / Google Cloud / Azure

**AWS (Elastic Beanstalk or ECS):**
- More complex setup
- Better for enterprise scale
- Requires Dockerfile or platform-specific config

**Dockerfile Example:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for LaTeX
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 11.5 Frontend Deployment (Vercel - Recommended)

**Steps:**
1. Sign up at [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next`
4. Add environment variables:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com`
5. Deploy

**Vercel automatically:**
- Provides HTTPS
- Handles CDN
- Auto-deploys on git push
- Provides preview deployments

**Alternative: Netlify**
- Similar process to Vercel
- Good for static sites (Next.js works with both)

### 11.6 File Storage (S3 Setup)

**AWS S3 Configuration:**
1. Create S3 bucket in AWS Console
2. Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": []
     }
   ]
   ```
3. Create IAM user with S3 access
4. Add credentials to backend environment variables

**Alternative: Cloudflare R2**
- S3-compatible API
- No egress fees
- Good alternative to AWS S3

### 11.7 Domain & DNS Setup

1. **Purchase domain** (Namecheap, Google Domains, etc.)
2. **Backend subdomain:**
   - Create A record: `api.yourdomain.com` → Backend IP
   - Or CNAME: `api.yourdomain.com` → `your-app.railway.app`
3. **Frontend domain:**
   - Vercel: Add domain in dashboard → Configure DNS
   - Usually: `yourdomain.com` and `www.yourdomain.com`

### 11.8 SSL/HTTPS

- **Vercel/Railway/Render:** Automatic HTTPS via Let's Encrypt
- **Custom domains:** Configure in hosting dashboard
- **Backend:** Ensure CORS allows HTTPS origins only in production

### 11.9 Monitoring & Logging

**Recommended Tools:**

1. **Sentry** (Error Tracking):
   ```bash
   pip install sentry-sdk[fastapi]
   ```
   ```python
   # In main.py
   import sentry_sdk
   sentry_sdk.init(
       dsn="your-sentry-dsn",
       traces_sample_rate=1.0,
   )
   ```

2. **Logtail / Better Stack** (Logging):
   - Add to environment variables
   - Centralized log aggregation

3. **Uptime Monitoring:**
   - UptimeRobot (free tier)
   - Pingdom
   - Monitor `/health` endpoint

### 11.10 Security Checklist

- [ ] All API keys in environment variables (never in code)
- [ ] Database credentials secured
- [ ] CORS configured for production domains only
- [ ] HTTPS enforced (automatic on Vercel/Railway)
- [ ] Rate limiting implemented (consider `slowapi` for FastAPI)
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (SQLAlchemy handles this)
- [ ] File upload size limits
- [ ] Authentication ready (for future user accounts)

### 11.11 CI/CD Setup (Optional but Recommended)

**GitHub Actions Example:**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          # Railway CLI or webhook trigger
          
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: frontend
```

### 11.12 Deployment Steps Summary

**Quick Start (Railway + Vercel):**

1. **Backend:**
   ```bash
   # Push code to GitHub
   git push origin main
   
   # On Railway:
   # - Connect GitHub repo
   # - Add PostgreSQL service
   # - Add environment variables
   # - Deploy
   ```

2. **Database:**
   ```bash
   # On Railway PostgreSQL, run migrations:
   # Connect via Railway CLI or pgAdmin
   alembic upgrade head
   ```

3. **Frontend:**
   ```bash
   # On Vercel:
   # - Import GitHub repo
   # - Set root to frontend
   # - Add NEXT_PUBLIC_API_BASE_URL
   # - Deploy
   ```

4. **Domain:**
   - Add custom domain in Vercel
   - Point `api.yourdomain.com` to Railway backend
   - Update CORS in backend to allow frontend domain

### 11.13 Cost Estimates

**Minimum Viable Production:**
- **Backend (Railway):** $5-10/month
- **Database (Railway PostgreSQL):** Included
- **Frontend (Vercel):** Free (hobby) or $20/month (pro)
- **S3 Storage:** ~$1-5/month (depending on usage)
- **Domain:** ~$10-15/year
- **Total:** ~$15-30/month

**Scaling Considerations:**
- Background workers (Celery/RQ): +$5-10/month (Redis)
- Higher traffic: Backend scaling costs
- Database backups: Usually included

### 11.14 Post-Deployment

1. **Test all endpoints** via production API
2. **Verify database migrations** applied
3. **Check file uploads** to S3 working
4. **Monitor error logs** for first 24 hours
5. **Set up uptime monitoring**
6. **Configure backups** (database, S3)

### 11.15 Troubleshooting

**Common Issues:**

1. **Database connection errors:**
   - Check `DATABASE_URL` format
   - Verify database is accessible from hosting IP
   - Check firewall rules

2. **CORS errors:**
   - Verify `ALLOWED_ORIGINS` includes frontend domain
   - Check protocol (http vs https)

3. **File upload issues:**
   - Verify S3 credentials
   - Check bucket permissions
   - Verify CORS on S3 bucket

4. **Build failures:**
   - Check Python/Node versions
   - Verify all dependencies in requirements.txt
   - Check build logs for specific errors

### 11.16 Phase-Specific Deployment Notes

**Phase 1 (Current):**
- ✅ Ready for deployment as **single unified application**
- **Single deployment:** One backend (FastAPI), one frontend (Next.js), one database
- Requires: Database, S3, environment variables
- **Note:** email-genius code exists but will be integrated in Phase 3 (not separate deployment)

**Phase 2 (Hunter - Job Discovery):**
- Will need: Job API keys (JSearch, etc.)
- Scraping services may need proxy/VPN
- Consider rate limiting for external APIs

**Phase 3 (Bot - Automation):**
- Browser automation (Playwright) may need:
  - Docker container with browser dependencies
  - Or headless browser service (Browserless.io)

**Phase 5 (Background Workers):**
- Requires Redis for task queue
- Deploy Celery workers separately
- Consider: Railway workers, Render workers, or separate Fly.io instances

### 11.17 Monetization & Public Access Prerequisites

**⚠️ Important:** The current Phase 1 implementation uses a hardcoded `user_id=1`, which means:
- ❌ **NOT ready for multiple users** - All data is shared
- ❌ **NOT secure for public access** - No authentication
- ❌ **NOT ready for monetization** - No user accounts, subscriptions, or payment

**To make this monetizable and publicly accessible, you need:**

#### Critical Requirements (Must Have):

1. **User Authentication System:**
   - User registration (email/password or OAuth)
   - Login/logout functionality
   - Session management (JWT tokens or cookies)
   - Password reset flow
   - Email verification
   - **Implementation:** Use FastAPI-Users or Auth0, or build custom with JWT

2. **Multi-Tenant Database:**
   - Remove hardcoded `user_id=1`
   - Get `user_id` from authenticated session
   - Ensure data isolation between users
   - **Current Issue:** All jobs/resumes are linked to user_id=1

3. **User Management:**
   - User profiles
   - Account settings
   - Data export (GDPR compliance)
   - Account deletion

4. **Security Hardening:**
   - Rate limiting (prevent abuse)
   - Input validation & sanitization
   - CSRF protection
   - SQL injection prevention (SQLAlchemy helps, but verify)
   - File upload size limits
   - API rate limits per user

5. **Landing Page & Marketing:**
   - Public landing page (separate from app)
   - Pricing page
   - Features showcase
   - Sign up / Login pages
   - Terms of Service
   - Privacy Policy

#### Monetization Features:

1. **Payment Integration:**
   - Stripe integration (recommended)
   - Subscription management
   - Payment webhooks
   - Invoice generation
   - **Libraries:** `stripe` Python package, Stripe Checkout or Elements

2. **Subscription Tiers:**
   - Free tier (limited features)
   - Premium tier (unlimited jobs, advanced features)
   - Enterprise tier (if targeting businesses)
   - Usage limits per tier:
     - Free: 5 jobs, 3 resume customizations/month
     - Premium: Unlimited jobs, unlimited customizations
     - Track usage in database

3. **User Limits & Quotas:**
   - Track API calls per user
   - Track resume generations per user
   - Track storage (S3) per user
   - Enforce limits based on subscription tier

4. **Billing Management:**
   - Subscription status tracking
   - Upgrade/downgrade flows
   - Cancellation handling
   - Billing history

#### Public Testing Features:

1. **Onboarding Flow:**
   - Welcome tutorial
   - Sample data for new users
   - Feature walkthrough

2. **Error Handling:**
   - User-friendly error messages
   - Error logging (Sentry)
   - Graceful degradation

3. **Public Demo/Trial:**
   - Limited free tier for testing
   - No credit card required for trial
   - Time-limited trial (e.g., 14 days)

4. **Analytics:**
   - User signups
   - Feature usage
   - Conversion tracking (free → paid)
   - Churn analysis

#### Implementation Roadmap for Monetization:

**Phase 1.5: Authentication & Multi-Tenancy (2-3 weeks)**
1. Install `fastapi-users` or build custom auth
2. Add `User` model with authentication fields
3. Update all endpoints to use authenticated user
4. Remove hardcoded `user_id=1`
5. Add login/register pages to frontend
6. Add protected routes

**Phase 1.6: Basic Monetization (2-3 weeks)**
1. Integrate Stripe
2. Add subscription tiers to database
3. Create pricing page
4. Add subscription management UI
5. Implement usage tracking
6. Enforce limits based on tier

**Phase 1.7: Public Launch Prep (1-2 weeks)**
1. Create landing page
2. Add Terms of Service & Privacy Policy
3. Set up analytics (Google Analytics, Mixpanel)
4. Add error tracking (Sentry)
5. Load testing
6. Security audit

**Estimated Timeline:** 5-8 weeks to go from current state to monetizable product

#### Quick Start for Public Beta (Minimal Viable):

If you want to launch a **free public beta** quickly:

1. **Add Basic Auth (1 week):**
   ```python
   # Use FastAPI-Users or simple JWT
   # Update endpoints to get user from token
   ```

2. **Add User Registration (3 days):**
   - Simple email/password signup
   - Email verification (optional for beta)

3. **Multi-tenant data (2 days):**
   - Update all queries to filter by `user_id`
   - Remove hardcoded `user_id=1`

4. **Landing Page (2-3 days):**
   - Simple Next.js page
   - Sign up form
   - Basic features list

5. **Deploy & Launch:**
   - Follow Section 11 deployment steps
   - Add "Beta" badge
   - Collect user feedback

**Total: ~2 weeks for public beta (free, no monetization yet)**

#### Recommended Tech Stack for Monetization:

- **Auth:** FastAPI-Users or Auth0
- **Payments:** Stripe (Python SDK)
- **Email:** SendGrid, Resend, or AWS SES
- **Analytics:** PostHog (open-source) or Mixpanel
- **Error Tracking:** Sentry
- **Database:** Already using PostgreSQL ✅

#### Cost Considerations:

- **Stripe:** 2.9% + $0.30 per transaction (standard)
- **Email Service:** ~$10-20/month (SendGrid free tier: 100 emails/day)
- **Analytics:** Free tiers available (PostHog, Mixpanel)
- **Additional hosting:** Minimal (same infrastructure)

**Bottom Line:** The deployment steps will make it **accessible online**, but you need **authentication + multi-tenancy + payments** to make it **monetizable**. Plan for 5-8 weeks of additional development, or 2 weeks for a free public beta.
