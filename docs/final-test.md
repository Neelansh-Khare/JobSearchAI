# JobSearchAI Local Test Checklist

## Prerequisites — One-Time Setup

### 1. Install Runtime Dependencies
- **Python 3.11+** — `python --version`
- **Node.js 18+** — `node --version`
- **npm** — `npm --version`

### 2. Get API Keys

| Key | Where to get it | Required? |
|-----|----------------|-----------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) | Yes — for resume tailoring, email gen, match score, insights |
| `JSEARCH_API_KEY` | [RapidAPI → JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) | Yes — for job discovery (Hunter page) |
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` | [Google Cloud Console → OAuth 2.0](https://console.cloud.google.com/apis/credentials) | Optional — for Gmail OAuth |
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` | Yes — JWT signing |

### 3. Create `backend/.env`
```
SECRET_KEY=your_generated_secret_key
GEMINI_API_KEY=your_gemini_key
JSEARCH_API_KEY=your_jsearch_key
GMAIL_CLIENT_ID=optional
GMAIL_CLIENT_SECRET=optional
GMAIL_REDIRECT_URI=http://localhost:8000/gmail/callback
```

### 4. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
playwright install chromium   # for browser auto-apply
```

### 5. Install Frontend Dependencies
```bash
cd frontend
npm install
```

---

## 0. Startup

### Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```
- [ ] Server starts without errors
- [ ] `http://localhost:8000/docs` — Swagger UI loads, all routers listed
- [ ] `http://localhost:8000/health` (or any unprotected endpoint) responds

### Frontend
```bash
cd frontend
npm run dev
```
- [ ] Dev server starts on `http://localhost:3000`
- [ ] `http://localhost:3000` loads (redirects to `/login` if not authenticated)

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
- [ ] "Next Best Actions" widget appears with AI-generated cards (requires Gemini key + some data)
  - [ ] Cards show priority badges (HIGH / MEDIUM / LOW) with color coding
  - [ ] Clicking a card navigates to the correct page
- [ ] If any applications have overdue follow-up dates → orange banner appears at top
- [ ] "Quick Actions" section at bottom renders three cards (Tailor Resume, Find Jobs, Generate Outreach)

---

## 3. Resume Tailoring (`/` main form)

- [ ] Paste a job description and your base resume → click **Tailor Resume**
- [ ] Spinner/loading state shown during AI call
- [ ] Tailored resume output appears (Gemini-generated, formatted text)
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
- [ ] **AI Interview Prep** button on a job → generates tailored interview questions (requires Gemini)
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
- [ ] Click **Generate** → AI-written email appears (requires Gemini)
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
- [ ] API response includes `"method": "semantic"` when Gemini key is set
- [ ] With Gemini key missing/invalid → fallback returns `"method": "keyword_fallback"`, score still shown

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
