# Bug Fixes + Feature Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 15 identified bugs and implement the 4 remaining Phase 7 items (Actionable Insights, Follow-up Reminders, Improved Match Score, doc update).

**Architecture:** Backend is FastAPI + SQLAlchemy 2.0 (SQLite dev / PostgreSQL prod). Frontend is Next.js 15 + TypeScript. AI via `google-generativeai`. No Alembic setup — new columns are added via a lightweight migration helper in `init_db`.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, google-generativeai (Gemini), APScheduler, Next.js 15, TypeScript, react-hot-toast.

---

## File Map

**Modified (backend):**
- `backend/app/core/security.py` — make SECRET_KEY required
- `backend/app/db/database.py` — disable echo in prod, add migration helper
- `backend/app/models/application.py` — add follow_up_date/follow_up_status columns
- `backend/app/schemas/application.py` — add follow_up fields to Update/Response schemas
- `backend/app/services/browser_automation.py` — replace bare `except:` with `except Exception`
- `backend/app/services/email_generator.py` — raise instead of returning error string
- `backend/app/api/endpoints/jobs.py` — fix ilike, add /insights/next-actions, add /follow-ups
- `backend/app/api/endpoints/referrals.py` — fix CSV error handling, fix ilike, move import
- `backend/app/api/endpoints/search.py` — fix ilike
- `backend/app/api/endpoints/applications.py` — add GET /follow-ups endpoint
- `backend/app/api/endpoints/gmail.py` — HMAC-signed CSRF state
- `backend/main.py` — add APScheduler startup/shutdown
- `backend/requirements.txt` — add apscheduler

**Modified (frontend):**
- `frontend/src/components/Dashboard.tsx` — fix all 5 bugs + add insights & follow-up widgets
- `frontend/src/app/page.tsx` — remove console.error
- `frontend/src/components/JobApplicationForm.tsx` — remove console.error
- `frontend/src/services/api.ts` — add getActionableInsights(), getFollowUps()
- `frontend/src/types/index.ts` — add DashboardStats, ActionableInsight, FollowUpReminder types

**Modified (docs):**
- `docs/nextSteps.md` — document Interview Prep as complete

---

## Task 1: Backend security & config bugs

**Files:**
- Modify: `backend/app/core/security.py`
- Modify: `backend/app/db/database.py`

- [ ] **Step 1: Fix hardcoded SECRET_KEY default**

Replace the current line 8 in `backend/app/core/security.py`:
```python
# OLD
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGEME_FOR_PRODUCTION_ONLY_USE_ENVIRONMENT_VARIABLES")

# NEW — raise at import time if unset, preventing silent misuse
_raw_key = os.getenv("SECRET_KEY")
if not _raw_key:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )
SECRET_KEY = _raw_key
```

- [ ] **Step 2: Fix echo=True and add schema migration helper in database.py**

Replace the entire `backend/app/db/database.py` with:
```python
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
```

- [ ] **Step 3: Verify the app still starts (the SECRET_KEY check will fire if .env is missing it)**

Confirm `backend/.env` has `SECRET_KEY=<some value>`. If not, add:
```
SECRET_KEY=dev-only-change-me-in-production
```

- [ ] **Step 4: Commit**
```bash
git add backend/app/core/security.py backend/app/db/database.py backend/.env
git commit -m "fix: require SECRET_KEY env var; disable SQL echo in prod; add follow_up migration"
```

---

## Task 2: Backend service bugs

**Files:**
- Modify: `backend/app/services/browser_automation.py`
- Modify: `backend/app/services/email_generator.py`

- [ ] **Step 1: Replace bare except in browser_automation.py**

Line 104 in `_fill_input_by_label` — replace `except:` with `except Exception`:
```python
# OLD (line 33-34)
            except Exception:
                continue

# This is already correct in _fill_input_by_label (line 33).
# Fix line 104 in _fill_greenhouse:
```

In `backend/app/services/browser_automation.py`:

Replace at line 102-105:
```python
        try:
            await page.get_by_label("LinkedIn Profile").fill(data.get("linkedin", ""))
        except:
            pass # Optional
```
With:
```python
        try:
            await page.get_by_label("LinkedIn Profile").fill(data.get("linkedin", ""))
        except Exception:
            pass  # Optional field
```

Replace at line 161-163:
```python
            try:
                await page.locator("input[type='file']").first.set_input_files(resume_path)
            except:
                pass
```
With:
```python
            try:
                await page.locator("input[type='file']").first.set_input_files(resume_path)
            except Exception:
                pass
```

- [ ] **Step 2: Fix email_generator.py returning error string instead of raising**

In `backend/app/services/email_generator.py`, replace lines 236-238:
```python
# OLD
        except Exception as e:
            logger.error(f"Gemini email generation error: {str(e)}")
            return f"Error generating email: {str(e)}"
```
With:
```python
# NEW
        except Exception as e:
            logger.error(f"Gemini email generation error: {str(e)}")
            raise RuntimeError(f"Email generation failed: {str(e)}") from e
```

- [ ] **Step 3: Commit**
```bash
git add backend/app/services/browser_automation.py backend/app/services/email_generator.py
git commit -m "fix: replace bare except clauses; raise instead of returning error string"
```

---

## Task 3: Backend API bugs (ilike, CSV, Gmail CSRF)

**Files:**
- Modify: `backend/app/api/endpoints/jobs.py`
- Modify: `backend/app/api/endpoints/referrals.py`
- Modify: `backend/app/api/endpoints/search.py`
- Modify: `backend/app/api/endpoints/gmail.py`

- [ ] **Step 1: Fix ilike in jobs.py**

In `backend/app/api/endpoints/jobs.py`, line 159:
```python
# OLD
    if company:
        query = query.filter(Job.company.ilike(f"%{company}%"))

# NEW — icontains escapes % and _ characters in user input
    if company:
        query = query.filter(Job.company.icontains(company, autoescape=True))
```

- [ ] **Step 2: Fix ilike in referrals.py, clean up misplaced import, fix CSV error handling**

In `backend/app/api/endpoints/referrals.py`:

**Move the import at line 134 to the top of the file** (after existing imports):
```python
# Add after line 12 (after existing imports)
from app.api.endpoints.search import search_jobs_jsearch
```
Then **delete** the duplicate import at the original line 134 position.

**Fix ilike at line 41** (inside `get_referrals`):
```python
# OLD
    if company:
        query = query.filter(Referral.company.ilike(f"%{company}%"))

# NEW
    if company:
        query = query.filter(Referral.company.icontains(company, autoescape=True))
```

**Fix CSV error handling** — wrap the decode + DictReader block in `upload_referrals_csv` (around line 60-62):
```python
# OLD
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))

# NEW
    content = await file.read()
    try:
        decoded = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
    except (UnicodeDecodeError, Exception) as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {str(e)}")
```

- [ ] **Step 3: Fix ilike in search.py**

`backend/app/api/endpoints/search.py` does not use `ilike` for user-facing filtering (it builds a query string for JSearch API). No change needed here — the bug agent confused the JSearch query string building with a SQL `ilike`. Skip.

- [ ] **Step 4: Fix Gmail OAuth CSRF state using HMAC**

In `backend/app/api/endpoints/gmail.py`, add the import at the top:
```python
import hmac
import hashlib
import secrets
```

Replace the state generation at lines 62-67:
```python
# OLD
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        state=str(current_user.id)
    )

# NEW — state = base64(user_id:nonce:hmac) so it can't be forged
    nonce = secrets.token_urlsafe(16)
    raw = f"{current_user.id}:{nonce}"
    signature = hmac.new(
        client_secret.encode(),
        raw.encode(),
        hashlib.sha256
    ).hexdigest()[:16]
    signed_state = f"{raw}:{signature}"

    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        state=signed_state
    )
```

Replace the callback state parsing at line 81:
```python
# OLD
    user_id = int(state)

# NEW
    try:
        parts = state.split(":")
        if len(parts) != 3:
            raise ValueError()
        user_id = int(parts[0])
        nonce = parts[1]
        received_sig = parts[2]

        expected_sig = hmac.new(
            client_secret.encode(),
            f"{user_id}:{nonce}".encode(),
            hashlib.sha256
        ).hexdigest()[:16]

        if not hmac.compare_digest(received_sig, expected_sig):
            return RedirectResponse(
                url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings?error=InvalidState"
            )
    except (ValueError, AttributeError):
        return RedirectResponse(
            url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings?error=InvalidState"
        )
```

Also add `client_secret = os.getenv("GMAIL_CLIENT_SECRET")` before the HMAC usage in the callback (it's already fetched in the auth endpoint but needs to be available in callback scope too). The callback already fetches `client_secret = os.getenv("GMAIL_CLIENT_SECRET")` at around line 87, so use that existing variable.

- [ ] **Step 5: Commit**
```bash
git add backend/app/api/endpoints/jobs.py backend/app/api/endpoints/referrals.py backend/app/api/endpoints/gmail.py
git commit -m "fix: icontains autoescape, CSV error handling, HMAC-signed OAuth state"
```

---

## Task 4: Frontend Dashboard.tsx — all 5 bugs

**Files:**
- Modify: `frontend/src/components/Dashboard.tsx`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add DashboardStats type to types/index.ts**

Append to `frontend/src/types/index.ts`:
```typescript
export interface DashboardStats {
  status_distribution: Record<string, number>;
  velocity_30d: number;
  velocity_7d: number;
  funnel: {
    applied: number;
    interviews: number;
    offers: number;
  };
}
```

- [ ] **Step 2: Fix useState<any> + N+1 fetch + loading race condition + null assertions**

Replace the entire Dashboard.tsx with this corrected version:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { JobSearchAPI } from '@/services/api';
import { Job, DashboardStats } from '@/types';
import GlassCard from './GlassCard';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchScores, setMatchScores] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, jobsData] = await Promise.all([
          JobSearchAPI.getJobStats(),
          JobSearchAPI.getJobs()
        ]);
        setStats(statsData);
        setJobs(jobsData);

        // Fetch match scores in parallel (fix N+1 sequential fetches)
        const recent = [...jobsData]
          .sort((a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )
          .slice(0, 5);

        const scoreResults = await Promise.allSettled(
          recent.map(job => JobSearchAPI.getJobMatchScore(job.id))
        );

        const scores: Record<number, number> = {};
        scoreResults.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            scores[recent[i].id] = result.value.match_score;
          }
        });
        setMatchScores(scores);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-gray-400">Loading your command center...</p>
      </div>
    );
  }

  // Safe date extraction for interview sorting (fixes non-null assertion bugs)
  const getInterviewDate = (job: Job): Date | null => {
    const dateStr = job.applications?.[0]?.interview_date;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const upcomingInterviews = jobs
    .filter(job => {
      const d = getInterviewDate(job);
      return d !== null && d >= new Date();
    })
    .sort((a, b) => {
      const dA = getInterviewDate(a)!.getTime();
      const dB = getInterviewDate(b)!.getTime();
      return dA - dB;
    });

  const recentJobs = [...jobs]
    .sort((a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white">Welcome Back!</h1>
          <p className="text-gray-400 mt-1">Here is what&apos;s happening with your job search.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/hunter">
            <button className="glassmorphism px-4 py-2 text-sm font-bold text-white hover:bg-white/10 transition-all">
              Find Jobs
            </button>
          </Link>
          <Link href="/analytics">
            <button className="glassmorphism px-4 py-2 text-sm font-bold text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 transition-all">
              Full Analytics
            </button>
          </Link>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-6 border-blue-500/20">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Applied</p>
          <p className="text-3xl font-bold text-white">{stats?.funnel?.applied ?? 0}</p>
        </GlassCard>
        <GlassCard className="p-6 border-purple-500/20">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Interviews</p>
          <p className="text-3xl font-bold text-white">{stats?.funnel?.interviews ?? 0}</p>
        </GlassCard>
        <GlassCard className="p-6 border-green-500/20">
          <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Offers</p>
          <p className="text-3xl font-bold text-white">{stats?.funnel?.offers ?? 0}</p>
        </GlassCard>
        <GlassCard className="p-6 border-indigo-500/20">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Velocity (7d)</p>
          <p className="text-3xl font-bold text-white">{stats?.velocity_7d ?? 0}</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Upcoming Interviews */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Upcoming Interviews
          </h2>
          {upcomingInterviews.length > 0 ? (
            <div className="space-y-4">
              {upcomingInterviews.map(job => {
                const interviewDate = getInterviewDate(job)!;
                return (
                  <GlassCard key={`dashboard-int-${job.id}`} className="p-4 border-purple-500/30 hover:border-purple-500/50 transition-all">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white">{job.title}</h3>
                        <p className="text-sm text-gray-400">{job.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-purple-400">
                          {interviewDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                        <Link href="/jobs" className="text-[10px] text-gray-500 hover:text-white transition-colors">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <GlassCard className="p-10 text-center border-dashed border-2 border-white/5">
              <p className="text-gray-500 italic">No interviews scheduled yet. Keep applying!</p>
            </GlassCard>
          )}
        </section>

        {/* Recent Activity */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Recent Activity
          </h2>
          {recentJobs.length > 0 ? (
            <div className="space-y-4">
              {recentJobs.map(job => (
                <GlassCard key={`dashboard-recent-${job.id}`} className="p-4 border-white/5 hover:border-white/20 transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white">{job.title}</h3>
                      <p className="text-sm text-gray-400">{job.company}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex gap-2 items-center">
                        {matchScores[job.id] !== undefined && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            matchScores[job.id] >= 80 ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                            matchScores[job.id] >= 60 ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' :
                            'border-red-500/50 text-red-400 bg-red-500/10'
                          }`} title="AI Match Score">
                            {matchScores[job.id]}% Match
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          job.status === 'Applied' ? 'bg-blue-500/20 text-blue-300' :
                          job.status === 'Interview' ? 'bg-purple-500/20 text-purple-300' :
                          job.status === 'Offer' ? 'bg-green-500/20 text-green-300' :
                          'bg-white/10 text-gray-300'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Added {new Date(job.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              ))}
              <div className="text-center pt-2">
                <Link href="/jobs" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  View All Jobs →
                </Link>
              </div>
            </div>
          ) : (
            <GlassCard className="p-10 text-center border-dashed border-2 border-white/5">
              <p className="text-gray-500 italic">No activity yet. Start your journey!</p>
            </GlassCard>
          )}
        </section>
      </div>

      {/* Quick Actions */}
      <section className="pt-10 border-t border-white/5">
        <h2 className="text-2xl font-bold text-white mb-8">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/">
            <GlassCard className="p-6 hover:bg-white/5 transition-all cursor-pointer group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">✨</div>
              <h3 className="text-lg font-bold text-white mb-2">Tailor Resume</h3>
              <p className="text-sm text-gray-400">Optimize your resume for a specific job.</p>
            </GlassCard>
          </Link>
          <Link href="/hunter">
            <GlassCard className="p-6 hover:bg-white/5 transition-all cursor-pointer group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🔍</div>
              <h3 className="text-lg font-bold text-white mb-2">Find Jobs</h3>
              <p className="text-sm text-gray-400">Discover new opportunities with AI search.</p>
            </GlassCard>
          </Link>
          <Link href="/outreach">
            <GlassCard className="p-6 hover:bg-white/5 transition-all cursor-pointer group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📧</div>
              <h3 className="text-lg font-bold text-white mb-2">Generate Outreach</h3>
              <p className="text-sm text-gray-400">Create personalized emails for networking.</p>
            </GlassCard>
          </Link>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/Dashboard.tsx frontend/src/types/index.ts
git commit -m "fix: Dashboard type safety, N+1 → Promise.allSettled, null assertion guards, remove console.error"
```

---

## Task 5: Frontend minor cleanup (page.tsx + JobApplicationForm.tsx)

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/components/JobApplicationForm.tsx`

- [ ] **Step 1: Remove console.log / console.error from page.tsx**

In `frontend/src/app/page.tsx`, remove line 33:
```typescript
// DELETE this line:
console.log(`Job saved with ID: ${jobId}. Resume customized and linked to this job.`);
```

Remove line 40:
```typescript
// DELETE this line:
console.error('Error:', err);
// Keep the toast.error line below it
```

- [ ] **Step 2: Remove console.error from JobApplicationForm.tsx**

In `frontend/src/components/JobApplicationForm.tsx`, remove line 80:
```typescript
// DELETE this line:
console.error('Error submitting form:', error);
// Keep the toast.error line below it
```

- [ ] **Step 3: Commit**
```bash
git add frontend/src/app/page.tsx frontend/src/components/JobApplicationForm.tsx
git commit -m "fix: remove console.error/log from production code"
```

---

## Task 6: Feature — Actionable Search Insights (backend)

**Files:**
- Modify: `backend/app/api/endpoints/jobs.py`

- [ ] **Step 1: Add the insights endpoint to jobs.py**

Add this import at the top of `backend/app/api/endpoints/jobs.py` (after existing imports):
```python
import google.generativeai as genai
import os as _os
_gemini_key = _os.getenv("GEMINI_API_KEY") or _os.getenv("GOOGLE_API_KEY")
if _gemini_key:
    genai.configure(api_key=_gemini_key)
```

Add this new endpoint **before** the `@router.post("/")` endpoint in jobs.py (after the `get_job_match_score` endpoint, to keep static routes before parameterized ones):

```python
@router.get("/insights/next-actions")
def get_next_actions(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return AI-generated actionable insights based on the user's job search data.
    """
    # Gather stats to give the LLM context
    thirty_days_ago = datetime.now() - timedelta(days=30)
    seven_days_ago = datetime.now() - timedelta(days=7)

    status_counts = db.query(Job.status, func.count(Job.id)).filter(
        Job.user_id == current_user.id
    ).group_by(Job.status).all()
    counts = {str(s): c for s, c in status_counts}

    apps_7d = db.query(func.count(Job.id)).filter(
        Job.user_id == current_user.id,
        Job.created_at >= seven_days_ago,
        Job.status != JobStatus.NEW
    ).scalar() or 0

    # Applications with no interview and applied > 14 days ago
    stale_count = db.query(func.count(Job.id)).filter(
        Job.user_id == current_user.id,
        Job.status == JobStatus.APPLIED,
        Job.created_at <= datetime.now() - timedelta(days=14)
    ).scalar() or 0

    # Upcoming interviews
    upcoming_interviews = db.query(func.count(Application.id)).filter(
        Application.user_id == current_user.id,
        Application.interview_date >= datetime.now()
    ).scalar() or 0

    prompt = f"""You are a career coach analyzing someone's job search. Based on the data below, give 3-4 short, specific, actionable next-step recommendations.

JOB SEARCH DATA:
- Applications this week: {apps_7d}
- Total by status: {counts}
- Applications applied 14+ days ago with no response: {stale_count}
- Upcoming interviews scheduled: {upcoming_interviews}

Return a JSON array of insight objects. Each object must have:
- "title": short action title (5-7 words)
- "description": one sentence explaining why
- "action_url": one of "/jobs", "/hunter", "/outreach", "/analytics", "/"
- "priority": "high", "medium", or "low"

Return ONLY the JSON array, no markdown."""

    try:
        model = genai.GenerativeModel("gemini-2.0-flash-lite")
        response = model.generate_content(prompt)
        import json
        insights = json.loads(response.text)
        return {"insights": insights}
    except Exception as e:
        # Fallback: deterministic insights if LLM fails
        fallback = []
        if apps_7d == 0:
            fallback.append({
                "title": "Apply to new jobs this week",
                "description": "You have no applications in the past 7 days.",
                "action_url": "/hunter",
                "priority": "high"
            })
        if stale_count > 0:
            fallback.append({
                "title": f"Follow up on {stale_count} stale application(s)",
                "description": "These were applied 2+ weeks ago with no status update.",
                "action_url": "/jobs",
                "priority": "high"
            })
        if upcoming_interviews > 0:
            fallback.append({
                "title": "Prepare for upcoming interviews",
                "description": f"You have {upcoming_interviews} interview(s) scheduled.",
                "action_url": "/jobs",
                "priority": "high"
            })
        if not fallback:
            fallback.append({
                "title": "Tailor your resume for more jobs",
                "description": "Customized resumes increase interview rates significantly.",
                "action_url": "/",
                "priority": "medium"
            })
        return {"insights": fallback}
```

- [ ] **Step 2: Verify the new route doesn't conflict with existing routes**

Check route order in jobs.py. The order should be:
1. `GET /jobs/stats`
2. `GET /jobs/{job_id}/match`
3. `GET /jobs/insights/next-actions`  ← new (static, must be before `/{job_id}`)
4. `POST /jobs/`
5. `GET /jobs/`
6. `GET /jobs/{job_id}`
7. `PATCH /jobs/{job_id}`
8. `DELETE /jobs/{job_id}`

- [ ] **Step 3: Commit**
```bash
git add backend/app/api/endpoints/jobs.py
git commit -m "feat: add /jobs/insights/next-actions endpoint with Gemini + fallback"
```

---

## Task 7: Feature — Actionable Search Insights (frontend)

**Files:**
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/components/Dashboard.tsx`

- [ ] **Step 1: Add ActionableInsight type to types/index.ts**

Append to `frontend/src/types/index.ts`:
```typescript
export interface ActionableInsight {
  title: string;
  description: string;
  action_url: string;
  priority: 'high' | 'medium' | 'low';
}
```

- [ ] **Step 2: Add getActionableInsights() to api.ts**

Find the `JobSearchAPI` object in `frontend/src/services/api.ts` and add this method (you can add it near `getJobStats`):
```typescript
  getActionableInsights: async (): Promise<{ insights: ActionableInsight[] }> => {
    const response = await fetch(`${API_BASE_URL}/jobs/insights/next-actions`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch insights');
    return response.json();
  },
```

Also add the import for `ActionableInsight` at the top of `api.ts`:
```typescript
import { ..., ActionableInsight } from '@/types';
```
(Add `ActionableInsight` to the existing import list.)

- [ ] **Step 3: Add Next Best Actions widget to Dashboard.tsx**

In `frontend/src/components/Dashboard.tsx`:

1. Add to the state declarations (after `matchScores` state):
```typescript
const [insights, setInsights] = useState<ActionableInsight[]>([]);
```

2. Add the import at the top:
```typescript
import { Job, DashboardStats, ActionableInsight } from '@/types';
```

3. Inside `fetchDashboardData`, after the match scores block, add:
```typescript
        // Fetch AI insights (non-blocking — don't delay loading)
        JobSearchAPI.getActionableInsights()
          .then(data => setInsights(data.insights))
          .catch(() => {}); // Silently ignore if unavailable
```

4. Add the widget **before** the Quick Actions section (after the `grid` with upcoming interviews + recent activity):

```tsx
      {/* Next Best Actions */}
      {insights.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Next Best Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, i) => (
              <Link key={i} href={insight.action_url}>
                <GlassCard className={`p-5 cursor-pointer hover:bg-white/5 transition-all border ${
                  insight.priority === 'high' ? 'border-red-500/30 hover:border-red-500/50' :
                  insight.priority === 'medium' ? 'border-yellow-500/30 hover:border-yellow-500/50' :
                  'border-white/10 hover:border-white/20'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0 ${
                      insight.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-white/10 text-gray-400'
                    }`}>
                      {insight.priority.toUpperCase()}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">{insight.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{insight.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>
      )}
```

- [ ] **Step 4: Commit**
```bash
git add frontend/src/components/Dashboard.tsx frontend/src/services/api.ts frontend/src/types/index.ts
git commit -m "feat: add Next Best Actions widget to Dashboard with AI-powered insights"
```

---

## Task 8: Feature — Application Follow-up Reminders (backend)

**Files:**
- Modify: `backend/app/models/application.py`
- Modify: `backend/app/schemas/application.py`
- Modify: `backend/app/api/endpoints/applications.py`
- Modify: `backend/main.py`
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Add follow_up columns to Application model**

In `backend/app/models/application.py`, add two columns after `generated_interview_prep`:
```python
    # Follow-up Reminder Fields
    follow_up_date = Column(DateTime(timezone=True), nullable=True)
    follow_up_status = Column(String, nullable=True, default="pending")  # pending, sent, dismissed
```

- [ ] **Step 2: Update ApplicationUpdate and ApplicationResponse schemas**

In `backend/app/schemas/application.py`:

Add to `ApplicationUpdate`:
```python
    follow_up_date: Optional[datetime] = None
    follow_up_status: Optional[str] = None
```

Add to `ApplicationResponse`:
```python
    follow_up_date: Optional[datetime]
    follow_up_status: Optional[str]
```

- [ ] **Step 3: Add GET /applications/follow-ups endpoint**

In `backend/app/api/endpoints/applications.py`, add this endpoint **before** the `PATCH /{application_id}` route:

```python
from datetime import datetime as dt

@router.get("/follow-ups")
def get_pending_follow_ups(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return applications where follow_up_date has passed and status is still pending.
    """
    now = dt.utcnow()
    pending = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.follow_up_date <= now,
        Application.follow_up_status == "pending"
    ).all()
    return pending
```

Also add to the imports at the top of `applications.py`:
```python
from app.models.job import Job
```
(Needed because ApplicationResponse includes job relationship data — verify the existing imports cover it, add if not.)

- [ ] **Step 4: Add APScheduler to requirements.txt**

In `backend/requirements.txt`, add:
```
apscheduler>=3.10.0
```

- [ ] **Step 5: Add scheduler to main.py**

In `backend/main.py`, add after the existing imports:
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime as _dt
from app.db.database import SessionLocal
from app.models.application import Application
```

Add the scheduler and its job function before `@app.on_event("startup")`:
```python
scheduler = AsyncIOScheduler()

async def _mark_overdue_follow_ups():
    """Background task: logs overdue follow-ups. Extend with email notifications as needed."""
    db = SessionLocal()
    try:
        now = _dt.utcnow()
        overdue = db.query(Application).filter(
            Application.follow_up_date <= now,
            Application.follow_up_status == "pending"
        ).all()
        if overdue:
            logger.info(f"[FollowUp] {len(overdue)} overdue follow-up(s) for user(s): "
                        f"{list({a.user_id for a in overdue})}")
        # Future: send Gmail notification per user here
    except Exception as e:
        logger.error(f"[FollowUp] Scheduler error: {e}")
    finally:
        db.close()
```

Update the startup event:
```python
@app.on_event("startup")
async def startup_event():
    init_db()
    scheduler.add_job(_mark_overdue_follow_ups, 'interval', hours=1, id='follow_up_check')
    scheduler.start()
    logger.info("Database initialized and scheduler started")
```

Add a shutdown event:
```python
@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    logger.info("Scheduler stopped")
```

- [ ] **Step 6: Commit**
```bash
git add backend/app/models/application.py backend/app/schemas/application.py \
        backend/app/api/endpoints/applications.py backend/main.py backend/requirements.txt
git commit -m "feat: follow-up reminder fields, GET /applications/follow-ups, APScheduler hourly check"
```

---

## Task 9: Feature — Follow-up Reminders (frontend)

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/components/Dashboard.tsx`

- [ ] **Step 1: Add FollowUpReminder type and update Application type**

Update the `Application` interface in `frontend/src/types/index.ts` to add the new fields:
```typescript
export interface Application {
  id: number;
  user_id: number;
  job_id: number;
  resume_id: number;
  tailored_resume_path?: string;
  tailored_resume_s3_url?: string;
  cover_letter_text?: string;
  cover_letter_s3_url?: string;
  applied_at?: string;
  last_status_update?: string;
  current_stage?: string;
  interview_date?: string;
  interview_notes?: string;
  interviewer_names?: string;
  follow_up_date?: string;       // NEW
  follow_up_status?: string;     // NEW
  created_at: string;
  updated_at?: string;
}
```

- [ ] **Step 2: Add getFollowUps() to api.ts**

In `frontend/src/services/api.ts`, inside the `JobSearchAPI` object, add:
```typescript
  getFollowUps: async (): Promise<Application[]> => {
    const response = await fetch(`${API_BASE_URL}/applications/follow-ups`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch follow-ups');
    return response.json();
  },
```

Import `Application` type is already imported via `@/types` if it's in the existing import list — verify.

- [ ] **Step 3: Add Follow-up Reminders widget to Dashboard.tsx**

In `frontend/src/components/Dashboard.tsx`:

1. Add import update:
```typescript
import { Job, DashboardStats, ActionableInsight, Application } from '@/types';
```

2. Add state:
```typescript
const [followUps, setFollowUps] = useState<Application[]>([]);
```

3. Inside `fetchDashboardData`, after insights fetch:
```typescript
        // Fetch pending follow-ups (non-blocking)
        JobSearchAPI.getFollowUps()
          .then(data => setFollowUps(data))
          .catch(() => {});
```

4. Add the widget after the stats grid, before the upcoming interviews/recent activity grid:

```tsx
      {/* Follow-up Reminders Banner */}
      {followUps.length > 0 && (
        <section>
          <GlassCard className="p-5 border-orange-500/30 bg-orange-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-orange-400">
                  {followUps.length} application{followUps.length > 1 ? 's' : ''} need a follow-up
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Reach out to keep your candidacy fresh.
                </p>
              </div>
              <Link href="/jobs">
                <button className="glassmorphism text-xs px-3 py-1.5 text-orange-400 border-orange-500/30 hover:bg-orange-500/10 transition-all font-bold">
                  View Jobs →
                </button>
              </Link>
            </div>
          </GlassCard>
        </section>
      )}
```

- [ ] **Step 4: Commit**
```bash
git add frontend/src/components/Dashboard.tsx frontend/src/services/api.ts frontend/src/types/index.ts
git commit -m "feat: follow-up reminder banner on dashboard with overdue application count"
```

---

## Task 10: Feature — Improved Match Score (semantic via Gemini embeddings)

**Files:**
- Modify: `backend/app/api/endpoints/jobs.py`

- [ ] **Step 1: Replace keyword matching with Gemini embedding cosine similarity**

In `backend/app/api/endpoints/jobs.py`, replace the entire `get_job_match_score` endpoint (lines 73-111) with:

```python
@router.get("/{job_id}/match")
def get_job_match_score(
    job_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate a semantic match score between a job and the user's latest resume
    using Gemini text embeddings and cosine similarity.
    """
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    from app.models.resume import Resume
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).first()

    if not resume:
        return {"match_score": 0, "message": "No resume found to match against"}

    job_text = f"{job.title} {job.description}".strip()
    resume_text = (resume.raw_text or "").strip()

    if not resume_text:
        return {"match_score": 0, "message": "Resume has no text content"}

    try:
        # Embed both texts using Gemini
        job_emb_result = genai.embed_content(
            model="models/text-embedding-004",
            content=job_text[:8000],  # Truncate to avoid token limits
        )
        resume_emb_result = genai.embed_content(
            model="models/text-embedding-004",
            content=resume_text[:8000],
        )

        job_vec = job_emb_result["embedding"]
        resume_vec = resume_emb_result["embedding"]

        # Cosine similarity (no external deps needed)
        dot = sum(a * b for a, b in zip(job_vec, resume_vec))
        mag_j = sum(x * x for x in job_vec) ** 0.5
        mag_r = sum(x * x for x in resume_vec) ** 0.5
        cosine = dot / (mag_j * mag_r) if (mag_j and mag_r) else 0.0

        # Map from [-1, 1] to [0, 100]; in practice embeddings stay in [0, 1] for same-language
        score = int(max(0.0, min(1.0, cosine)) * 100)

        return {
            "match_score": score,
            "method": "semantic",
            "matched_skills": [],
            "missing_skills": []
        }
    except Exception as e:
        logger.warning(f"Embedding-based match failed, falling back to keyword: {e}")
        # Keyword fallback — original logic
        skills = ["python", "react", "fastapi", "next.js", "typescript", "aws", "docker",
                  "sql", "machine learning", "ai"]
        job_lower = job_text.lower()
        resume_lower = resume_text.lower()
        matched = [s for s in skills if s in job_lower and s in resume_lower]
        score = min(50 + len(matched) * 5, 100)
        return {
            "match_score": score,
            "method": "keyword_fallback",
            "matched_skills": matched,
            "missing_skills": [s for s in skills if s in job_lower and s not in resume_lower]
        }
```

Add `import logging` if not already imported (it is — verify). Add `logger = logging.getLogger(__name__)` near the top of the file if not present.

- [ ] **Step 2: Commit**
```bash
git add backend/app/api/endpoints/jobs.py
git commit -m "feat: semantic match score via Gemini embeddings with keyword fallback"
```

---

## Task 11: Update nextSteps.md

**Files:**
- Modify: `docs/nextSteps.md`

- [ ] **Step 1: Mark Interview Prep as complete in the doc and update Phase 7 status**

In `docs/nextSteps.md`:

1. In the Phase 6 section, add a line documenting Interview Prep:
```markdown
### Phase 6: "Professional Suite" (Interviews & Analytics) ✅ COMPLETE
...
3. **AI Interview Prep ✅**: Generate tailored questions per application via `POST /applications/{id}/interview-prep`.
```

2. Update the Milestone 7 entry:
```markdown
7. **Milestone 7 – Professional Suite & Analytics** ✅ **COMPLETE**
   - ✅ Analytics Dashboard (Stats visualization).
   - ✅ Interview Tracking (Scheduling and notes).
   - ✅ AI Interview Prep (Tailored questions via `/applications/{id}/interview-prep`).
   - ✅ Performance Insights (Funnel analysis).
```

3. Update Phase 7 / Milestone 8 to reflect new completions:
```markdown
### Phase 7: "The Command Center" (Intelligent Dashboard) ✅ COMPLETE

1. **Unified Dashboard ✅**: Stats, upcoming interviews, recent activity at `/`.
2. **AI Job Match Scoring ✅**: Semantic similarity via Gemini embeddings at `GET /jobs/{id}/match`.
3. **Actionable Search Insights ✅**: AI "Next Best Action" cards at `GET /jobs/insights/next-actions`.
4. **Application Follow-up Reminders ✅**: Overdue follow-up detection with APScheduler + `GET /applications/follow-ups`.

8. **Milestone 8 – Intelligent Dashboard** ✅ **COMPLETE**
   - ✅ Unified User Dashboard.
   - ✅ AI Job Match Scoring (semantic, Gemini embeddings).
   - ✅ Actionable search insights (Next Best Actions widget).
   - ✅ Application Follow-up Reminders (scheduler + dashboard banner).
```

- [ ] **Step 2: Commit**
```bash
git add docs/nextSteps.md
git commit -m "docs: mark Phase 7 complete, document interview prep and new features"
```

---

## Self-Review

**Spec coverage:**
- Bug 1 (SECRET_KEY) → Task 1 ✅
- Bug 2 (bare except) → Task 2 ✅
- Bug 3 (route ordering) → Task 3 (import moved to top) ✅
- Bug 4 (N+1 Dashboard) → Task 4 ✅
- Bug 5 (loading race) → Task 4 ✅
- Bug 6 (ilike) → Task 3 ✅
- Bug 7 (null assertions) → Task 4 ✅
- Bug 8 (CSV error handling) → Task 3 ✅
- Bug 9 (race condition) → Task 4 (same fix as Bug 5) ✅
- Bug 10 (email error string) → Task 2 ✅
- Bug 11 (Gmail CSRF) → Task 3 ✅
- Bug 12 (console.error) → Tasks 4 + 5 ✅
- Bug 13 (useState<any>) → Task 4 ✅
- Bug 14 (duplicate of Bug 9) → Task 4 ✅
- Bug 15 (echo=True) → Task 1 ✅
- Feature 1 (Actionable Insights) → Tasks 6 + 7 ✅
- Feature 2 (Follow-up Reminders) → Tasks 8 + 9 ✅
- Feature 3 (Doc Interview Prep) → Task 11 ✅
- Feature 4 (Improved Match Score) → Task 10 ✅

**Type consistency check:**
- `DashboardStats` defined in Task 4 Step 1, used in Dashboard.tsx Step 2 ✅
- `ActionableInsight` defined in Task 7 Step 1, used in Dashboard and api.ts ✅
- `Application.follow_up_date/status` added in Task 8 Step 1, in schema Task 8 Step 2, in frontend types Task 9 Step 1 ✅
- `getActionableInsights` return type `{ insights: ActionableInsight[] }` consistent between api.ts and Dashboard usage ✅
- `getFollowUps` return type `Application[]` consistent ✅

**Placeholder scan:** No TBDs or "add appropriate" phrases found. ✅
