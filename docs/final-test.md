# JobSearchAI Local Test Checklist

## Prerequisites — One-Time Setup

### 1. Install Docker Desktop
- **Docker Desktop** — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- Verify: `docker --version` and `docker compose version`

### 2. Start Ollama (AI backend — runs on host, not in Docker)

All AI features run locally via [Ollama](https://ollama.com). It runs on your host machine; Docker talks to it via `host.docker.internal`.

```bash
# Install Ollama from https://ollama.com, then pull the required models:
ollama pull llama3.2          # text generation
ollama pull nomic-embed-text  # semantic embeddings
```

Ollama must be running (`ollama serve`) before starting the stack.

### 3. Get API Keys

| Key | Where to get it | Required? |
|-----|----------------|-----------|
| `JSEARCH_API_KEY` | [RapidAPI → JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) | Yes — for job discovery (Hunter page) |
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` | [Google Cloud Console → OAuth 2.0](https://console.cloud.google.com/apis/credentials) | Optional — for Gmail OAuth |
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` | Yes — JWT signing |

### 4. Create `backend/.env`
```
SECRET_KEY=your_generated_secret_key
JSEARCH_API_KEY=your_jsearch_key
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
GMAIL_CLIENT_ID=optional
GMAIL_CLIENT_SECRET=optional
GMAIL_REDIRECT_URI=http://localhost:8000/gmail/callback
```

> `host.docker.internal` lets the backend container reach Ollama running on your host machine.

---

## 0. Startup

```bash
docker compose up --build
```

- [ ] All three containers start: `db`, `backend`, `frontend`
- [ ] `http://localhost:8000/docs` — Swagger UI loads, all routers listed
- [ ] `http://localhost:3000` loads (redirects to `/login` if not authenticated)

To stop: `docker compose down`  
To wipe the database too: `docker compose down -v`

---

## 1. Auth — Registration & Login

- [ ] Navigate to `/register` — form renders
- [ ] Submit with mismatched passwords → validation error shown
- [ ] Submit valid registration → success, redirected or logged in
- [ ] Navigate to `/login`
- [ ] Login with wrong password → error message shown (not a stack trace)
- [ ] Login with correct credentials → redirected to dashboard (`/`)
- [ ] Header shows logged-in state (name or logout button)
- [ ] Logout → session cleared, redirected to `/login`
- [ ] Try navigating to `/jobs` while logged out → redirected to `/login` (AuthGuard)

---

## 2. Dashboard (`/`)

- [ ] Dashboard loads with stats grid: Applied, Interviews, Offers, Velocity (7d)
- [ ] "Upcoming Interviews" section renders (empty state or interview cards)
- [ ] "Recent Activity" section shows last 5 saved jobs with status badges
- [ ] Match score badges (e.g. "72% Match") appear next to recent jobs when a resume exists
- [ ] "Next Best Actions" widget appears with AI-generated cards (requires Ollama running + some data)
  - [ ] Cards show priority badges (HIGH / MEDIUM / LOW) with color coding
  - [ ] Clicking a card navigates to the correct page
- [ ] If any applications have overdue follow-up dates → orange banner appears at top
- [ ] "Quick Actions" section at bottom renders three cards (Tailor Resume, Find Jobs, Generate Outreach)

---

## 3. Resume Tailoring (`/` main form)

- [ ] Paste a job description and your base resume → click **Tailor Resume**
- [ ] Spinner/loading state shown during AI call
- [ ] Tailored resume output appears (AI-generated via Ollama, formatted text)
- [ ] Submit with empty fields → validation error, no API call made
- [ ] Resume is saved to your account after tailoring (appears in future match scoring)

---

## 4. Job Tracker (`/jobs`)

- [ ] Jobs list loads for the logged-in user
- [ ] **Kanban view**: columns for New, Applied, Interview, Offer, Rejected
- [ ] Drag a job card to a different column → status updates immediately
- [ ] **Add Job** button → form opens → fill title + company → save → card appears
- [ ] Click a job card → detail view with all fields (title, company, description, URL, notes)
- [ ] Edit a job → change status/notes → save → changes persist on refresh
- [ ] **Delete** a job → confirmation → job removed from board
- [ ] Filter by company name → only matching jobs shown
- [ ] **AI Interview Prep** button on a job → generates tailored interview questions (requires Ollama running)
- [ ] Set `follow_up_date` on an applied job to a past date → orange banner appears on Dashboard

---

## 5. Job Discovery — Hunter (`/hunter`)

- [ ] Search bar accepts query + optional location
- [ ] Click **Search** → results load from JSearch API
- [ ] Each result card shows: title, company, location, salary (if available)
- [ ] Jobs with matching LinkedIn connections show a **"Contact Found"** badge
- [ ] **Save Job** button → job appears in `/jobs` tracker
- [ ] Empty search or API key missing → graceful error message, no crash

---

## 6. Outreach / Email Generation (`/outreach`)

- [ ] Select or paste a job description
- [ ] Select email type (cold outreach / cover letter / referral request)
- [ ] Click **Generate** → AI-written email appears (requires Ollama running)
- [ ] Copy button copies the generated email to clipboard
- [ ] Generated outreach saved to outreach history (visible on same page)
- [ ] Empty inputs → validation error before API call

---

## 7. Referrals / Network (`/referrals`)

- [ ] Referrals list loads (empty state if none added)
- [ ] **Add Referral** manually → fill name, company, role → save → appears in list
- [ ] **CSV Import** → upload a LinkedIn connections export CSV → contacts imported in bulk
  - [ ] Invalid CSV (wrong headers) → error message shown, no partial import
- [ ] After import, return to Hunter and search → jobs at imported companies show "Contact Found"
- [ ] **Generate Outreach** for a referral contact → pre-filled email with their context

---

## 8. Analytics (`/analytics`)

- [ ] Analytics page loads without error
- [ ] **Funnel chart**: shows Applied → Interviews → Offers counts
- [ ] **Status distribution**: breakdown of all job statuses
- [ ] **Velocity**: applications per week (7d) and month (30d) shown
- [ ] Numbers match what's visible in the `/jobs` tracker

---

## 9. Settings (`/settings`)

- [ ] Settings page loads with current profile info (name, email)
- [ ] Edit name → save → changes persist on refresh
- [ ] Change password form: requires current password
  - [ ] Wrong current password → error message shown
  - [ ] Correct current password + new password → success, can log in with new password
- [ ] **Gmail Integration** section shows connect/disconnect status
  - [ ] Click **Connect Gmail** → OAuth flow opens (requires GMAIL_CLIENT_ID)
  - [ ] After auth, Gmail connected state shown

---

## 10. Browser Auto-Apply (`/jobs` job detail)

- [ ] Open a saved job that has a URL pointing to Greenhouse or a generic form
- [ ] Click **✨ Auto Apply** → Playwright opens a browser and attempts to fill the form
- [ ] Status indicator updates (in progress → complete / failed)
- [ ] On failure → error message shown, job status not incorrectly changed

---

## 11. Match Score (Dashboard + Job detail)

- [ ] With a saved resume and saved jobs, Dashboard shows percentage badges
- [ ] Badge color: green ≥ 80%, yellow ≥ 60%, red < 60%
- [ ] API response includes `"method": "semantic"` when Ollama is running with `nomic-embed-text` pulled
- [ ] With Ollama unreachable → fallback returns `"method": "keyword_fallback"`, score still shown

---

## 12. Follow-up Reminders (End-to-End)

- [ ] In `/jobs`, set `follow_up_date` on a job to yesterday (past date), status "Applied"
- [ ] Return to Dashboard → orange follow-up banner appears with count
- [ ] Banner links to `/jobs` to review the applications
- [ ] `GET /applications/follow-ups` returns the overdue item (check Swagger or DevTools)

---

## 13. Security & Error Handling

- [ ] Access any `/api/...` endpoint without `Authorization: Bearer <token>` header → `401 Unauthorized`
- [ ] Try to access another user's job by ID (if you have two accounts) → `404 Not Found`
- [ ] All API error responses return JSON `{"detail": "..."}` — no Python stack traces visible
- [ ] Navigate to a non-existent frontend route → Next.js 404 page loads gracefully
- [ ] **DevTools Console**: no uncaught JavaScript errors during normal navigation

---

## Things to Watch in DevTools the Whole Time

- No red errors in **Console** tab
- No unexpected `401` or `500` responses in **Network** tab during normal flows
- All POST/PATCH requests include `Authorization: Bearer ...` header
- No API responses containing Python exception messages or tracebacks
