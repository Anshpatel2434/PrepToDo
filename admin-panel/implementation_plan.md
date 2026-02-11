# PrepToDo Admin Panel — Implementation Plan

> **Author**: Auto-generated | **Date**: 2026-02-11 | **Status**: Awaiting Approval

---

## 1. Overview

Build a founder-grade admin dashboard for PrepToDo that provides:
- **Financial tracking**: AI costs per user, total spending, revenue, P&L
- **User analytics**: Per-user usage, sessions, questions, time spent
- **Platform metrics**: Overall health, growth, content stats, future predictions
- **Admin actions**: Direct DB modifications, user management
- **Security**: Email-locked (`preptodo.app@gmail.com`) + encrypted password, stricter than user auth

### Design Inspiration
- Operations Dashboard (monitoring automations, bottlenecks, load)
- Financial Dashboard (revenue vs costs, margins, forecasts)
- Sales Dashboard (daily sales, conversions, revenue sources)
- **Mobile-first**, equally polished on desktop; clean navigation with separate pages

---

## 2. Current Architecture Summary

| Layer | Tech | Key Files |
|-------|------|-----------|
| Backend | Express + Drizzle ORM + NeonDB (Neon Serverless Postgres) | `services/backend/src/index.ts` |
| Auth | JWT (access + refresh) + Google OAuth + Turnstile CAPTCHA | `features/auth/` |
| Config | dotenv, validated env vars | `config/index.ts` |
| DB | Drizzle schema + Neon HTTP driver | `db/index.ts`, `db/schema.ts` |
| Workers | daily-content, customized-mocks (7-step), analytics (6-phase A-F) | `workers/` |
| Cost Tracking | In-memory `CostTracker` class — **NOT persisted to DB** | `workers/daily-content/retrieval/utils/CostTracker.ts` |
| Frontend | React 18 + React Router + Vite + Supabase (DB only) | `apps/web/src/` |
| API Client | Custom `apiFetch()` with cookie-based auth | `services/apiClient.ts` |

### Existing DB Tables (16+)
`users`, `user_profiles`, `user_analytics`, `user_proficiency_signals`, `user_metric_proficiency`, `auth_sessions`, `auth_pending_signups`, `auth_password_reset_tokens`, `articles`, `passages`, `questions`, `question_types`, `question_attempts`, `practice_sessions`, `exam_papers`, `exam_generation_state`, `genres`, `core_metrics`, `embeddings`, `theory_chunks`, `graph_nodes`, `graph_edges`

---

## 3. New Database Tables (SQL Migration)

> File: `admin-panel/migration.sql`

### 3.1 `admin_ai_cost_log` — Persists every AI API call

```sql
CREATE TABLE admin_ai_cost_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_type text NOT NULL,           -- 'daily_content' | 'customized_mocks' | 'analytics' | 'teaching_concept'
    function_name text NOT NULL,         -- e.g. 'generatePassage', 'generateRCQuestions'
    model_name text NOT NULL DEFAULT 'gpt-4o-mini',
    input_tokens integer NOT NULL DEFAULT 0,
    output_tokens integer NOT NULL DEFAULT 0,
    cost_cents numeric(10,4) NOT NULL DEFAULT 0,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,  -- NULL for system-level (daily content)
    exam_id uuid REFERENCES exam_papers(id) ON DELETE SET NULL,
    session_id uuid REFERENCES practice_sessions(id) ON DELETE SET NULL,
    metadata jsonb,                      -- extra context (prompt version, etc.)
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_cost_log_worker ON admin_ai_cost_log(worker_type);
CREATE INDEX idx_cost_log_user ON admin_ai_cost_log(user_id);
CREATE INDEX idx_cost_log_created ON admin_ai_cost_log(created_at);
CREATE INDEX idx_cost_log_model ON admin_ai_cost_log(model_name);
```

### 3.2 `admin_platform_metrics_daily` — Daily aggregated snapshots

```sql
CREATE TABLE admin_platform_metrics_daily (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    total_users integer DEFAULT 0,
    new_users_today integer DEFAULT 0,
    active_users_today integer DEFAULT 0,
    total_sessions integer DEFAULT 0,
    sessions_today integer DEFAULT 0,
    total_questions_attempted integer DEFAULT 0,
    questions_attempted_today integer DEFAULT 0,
    total_passages_generated integer DEFAULT 0,
    passages_generated_today integer DEFAULT 0,
    total_exams_generated integer DEFAULT 0,
    exams_generated_today integer DEFAULT 0,
    ai_cost_today_cents numeric(10,4) DEFAULT 0,
    ai_cost_cumulative_cents numeric(12,4) DEFAULT 0,
    avg_session_duration_seconds integer DEFAULT 0,
    avg_accuracy_percentage numeric(5,2),
    revenue_today_cents integer DEFAULT 0,
    revenue_cumulative_cents integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_platform_metrics_date ON admin_platform_metrics_daily(date);
```

### 3.3 `admin_user_activity_log` — Tracks significant user events

```sql
CREATE TABLE admin_user_activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type text NOT NULL,  -- 'signup' | 'login' | 'session_start' | 'session_complete' | 'exam_generate' | 'subscription_change'
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_activity_user ON admin_user_activity_log(user_id);
CREATE INDEX idx_activity_type ON admin_user_activity_log(event_type);
CREATE INDEX idx_activity_created ON admin_user_activity_log(created_at);
```

### 3.4 Drizzle Schema Additions

Add to `services/backend/src/db/schema.ts`:
- `adminAiCostLog` table definition
- `adminPlatformMetricsDaily` table definition
- `adminUserActivityLog` table definition

---

## 4. Environment Variables

> File: `services/backend/.env.example`

```env
# --- Admin Panel ---
ADMIN_EMAIL=preptodo.app@gmail.com
ADMIN_PASSWORD_HASH=<bcrypt-hashed-password>
ADMIN_JWT_SECRET=<separate-secret-from-user-jwt>
```

**How it works**:
1. On first setup, run: `node -e "const bcrypt=require('bcrypt');bcrypt.hash('YOUR_PASS',12).then(h=>console.log(h))"`
2. Paste the hash into `.env` as `ADMIN_PASSWORD_HASH`
3. `ADMIN_JWT_SECRET` is separate from user JWT to prevent cross-contamination
4. Add these 3 vars to `config/index.ts` under a new `admin` section

---

## 5. Backend — Admin Feature Module

### 5.1 Directory Structure

```
services/backend/src/features/admin/
├── index.ts                          # Exports router
├── admin.routes.ts                   # All admin routes
├── middleware/
│   └── admin.middleware.ts           # requireAdmin middleware
├── controllers/
│   ├── admin-auth.controller.ts      # Login/logout/verify
│   ├── admin-overview.controller.ts  # Dashboard overview metrics
│   ├── admin-users.controller.ts     # User listing, details, management
│   ├── admin-financials.controller.ts# Cost breakdown, revenue tracking
│   ├── admin-content.controller.ts   # Content stats (passages, questions, exams)
│   └── admin-system.controller.ts    # DB operations, manual actions
└── services/
    ├── admin-cost.service.ts         # Cost persistence & aggregation queries
    ├── admin-metrics.service.ts      # Daily metrics snapshot generation
    └── admin-users.service.ts        # User data aggregation queries
```

### 5.2 Admin Auth Middleware (`requireAdmin`)

```typescript
// Different from requireAuth — uses separate JWT secret, checks admin email
export const requireAdmin = async (req, res, next) => {
    const token = extractAdminToken(req); // from Authorization header or admin cookie
    const payload = verifyAdminJwt(token, config.admin.jwtSecret);
    if (payload.email !== config.admin.email) throw Errors.forbidden();
    req.admin = payload;
    next();
};
```

**Security layers (exceeding user auth)**:
1. Separate JWT secret (`ADMIN_JWT_SECRET`)
2. Email whitelist check (hardcoded to `preptodo.app@gmail.com`)
3. Bcrypt password verification (not plain text comparison)
4. Stricter rate limiting: 3 attempts per 30 min window
5. Short token expiry: 1 hour (vs 15min user access + 7d refresh)
6. No refresh token — must re-login after expiry
7. IP logging on every admin action
8. Admin-only cookie name (`preptodo_admin_token`) with `httpOnly`, `secure`, `sameSite: strict`

### 5.3 Admin Routes

```
POST   /api/admin/auth/login           # Admin login (email + password)
POST   /api/admin/auth/logout          # Admin logout
GET    /api/admin/auth/verify          # Verify admin session

GET    /api/admin/overview             # Dashboard overview (all key metrics)
GET    /api/admin/overview/trends      # Time-series data for charts

GET    /api/admin/users                # Paginated user list with search
GET    /api/admin/users/:id            # Single user deep-dive
PATCH  /api/admin/users/:id            # Update user (subscription, ban, etc.)
DELETE /api/admin/users/:id            # Delete user (soft/hard)

GET    /api/admin/financials/summary   # Financial summary (costs, revenue, P&L)
GET    /api/admin/financials/ai-costs  # AI cost breakdown by model/worker/user
GET    /api/admin/financials/timeline  # Cost/revenue over time

GET    /api/admin/content/stats        # Content statistics
GET    /api/admin/content/passages     # Passage listing with filters
GET    /api/admin/content/questions    # Question listing with filters
GET    /api/admin/content/exams        # Exam listing with filters

POST   /api/admin/system/run-query     # Execute read-only SQL (with safeguards)
POST   /api/admin/system/update-record # Update specific DB records
GET    /api/admin/system/logs          # Activity log viewer
POST   /api/admin/system/snapshot      # Trigger daily metrics snapshot
```

### 5.4 Registering in Express

In `services/backend/src/index.ts`, add:
```typescript
import { adminRouter } from './features/admin/index.js';
app.use('/api/admin', adminRouter);
```

---

## 6. Backend — Cost Tracking Persistence (Critical Refactor)

### 6.1 Modify `CostTracker.ts`

**Goal**: Keep existing in-memory behavior (no disruption) + add async DB persistence.

```typescript
// Add to CostTracker.ts
async persistToDb(workerType: string, userId?: string, examId?: string): Promise<void> {
    // Fire-and-forget: insert all calls into admin_ai_cost_log
    // Uses db.insert(adminAiCostLog).values(this.calls.map(...))
    // Wrapped in try/catch — failure must NOT break the worker
}
```

### 6.2 Integration Points (Non-Disruptive)

| File | Change |
|------|--------|
| `workers/daily-content/runDailyContent.ts` | After `costTracker.printReport()`, call `costTracker.persistToDb('daily_content')` |
| `workers/customized-mocks/runCustomizedMocks.ts` | Add CostTracker instance + persist at end with `costTracker.persistToDb('customized_mocks', userId, examId)` |
| `workers/analytics/runAnalytics.ts` | If any LLM calls (phaseC), add tracking + persist |

**CRITICAL RULE**: All persistence is wrapped in try/catch. Worker failures due to cost tracking are logged but never propagated. Existing workflow must be 100% unaffected.

---

## 7. Backend — Admin API Query Examples

### Overview Endpoint (what it computes)
```sql
-- Total users, active users (last 7 days), new users (today)
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) FROM users WHERE last_sign_in_at > NOW() - INTERVAL '7 days';
SELECT COUNT(*) FROM users WHERE created_at::date = CURRENT_DATE;

-- Total sessions, completion rate
SELECT COUNT(*), AVG(CASE WHEN status='completed' THEN 1 ELSE 0 END) FROM practice_sessions;

-- AI cost summary (from admin_ai_cost_log)
SELECT SUM(cost_cents), worker_type FROM admin_ai_cost_log GROUP BY worker_type;

-- Content counts
SELECT COUNT(*) FROM passages; SELECT COUNT(*) FROM questions; SELECT COUNT(*) FROM exam_papers;
```

### Per-User Deep Dive
```sql
-- For a specific user_id
SELECT * FROM user_profiles WHERE id = $1;
SELECT * FROM user_analytics WHERE user_id = $1;
SELECT COUNT(*), SUM(time_spent_seconds), AVG(score_percentage) FROM practice_sessions WHERE user_id = $1;
SELECT COUNT(*), SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) FROM question_attempts WHERE user_id = $1;
SELECT SUM(cost_cents) FROM admin_ai_cost_log WHERE user_id = $1;
```

---

## 8. Frontend — Admin Panel

### 8.1 Directory Structure

```
apps/web/src/pages/admin/
├── page/
│   └── AdminApp.tsx                  # Admin shell (layout + routing)
├── auth/
│   └── AdminLoginPage.tsx            # Login page
├── components/
│   ├── AdminLayout.tsx               # Sidebar + topbar + content area
│   ├── AdminSidebar.tsx              # Navigation sidebar (collapsible on mobile)
│   ├── AdminTopbar.tsx               # Top bar with admin info + logout
│   ├── StatCard.tsx                  # Reusable metric card component
│   ├── ChartCard.tsx                 # Reusable chart wrapper
│   └── DataTable.tsx                 # Reusable sortable/filterable table
├── pages/
│   ├── OverviewPage.tsx              # Main dashboard with KPI cards + charts
│   ├── UsersPage.tsx                 # User list + search + filters
│   ├── UserDetailPage.tsx            # Individual user deep-dive
│   ├── FinancialsPage.tsx            # Revenue vs costs, AI spending breakdown
│   ├── ContentPage.tsx               # Content stats (passages, questions, exams)
│   ├── AIUsagePage.tsx               # AI model usage, token tracking, per-function costs
│   └── SystemPage.tsx                # DB operations, activity logs
├── hooks/
│   ├── useAdminAuth.ts               # Admin session management
│   └── useAdminApi.ts                # Admin-specific API calls
├── services/
│   └── adminApiClient.ts            # Separate API client for admin endpoints
└── styles/
    └── admin.css                     # Admin-specific styles (dark theme)
```

### 8.2 Routing in `App.tsx`

```tsx
// Add lazy imports
const AdminApp = lazy(() => import("./pages/admin/page/AdminApp"));

// Add route (NO SafeAuthRoute - admin has its own auth)
{ path: "/admin/*", element: <Suspense fallback={<PageLoader />}><AdminApp /></Suspense> }
```

Admin sub-routes managed internally by `AdminApp.tsx` using nested `<Routes>`.

### 8.3 Design System (Mobile-First)

**Color palette** (dark admin theme):
- Background: `#0f1117` (near-black), Cards: `#1a1d27`, Borders: `#2a2d3a`
- Primary accent: `#6366f1` (indigo), Success: `#22c55e`, Warning: `#f59e0b`, Danger: `#ef4444`
- Text: `#e2e8f0` (primary), `#94a3b8` (secondary)

**Mobile-first breakpoints**:
- `< 640px`: Single column, collapsible sidebar as overlay, stacked cards
- `640px-1024px`: 2-column grid, sidebar visible
- `> 1024px`: Full layout with fixed sidebar, 3-4 column grids

**Typography**: Inter (already in project) or system font stack

### 8.4 Page Specifications

#### Overview Page (Landing)
- **KPI Row**: Total Users, Active Users (7d), Total Sessions, AI Cost (MTD), Revenue (MTD)
- **Chart 1**: User Growth over time (line chart)
- **Chart 2**: Revenue vs AI Cost (dual-axis bar/line)
- **Chart 3**: Sessions per day (bar chart)
- **Chart 4**: Content generation trend (stacked area)
- **Quick Stats**: Avg session duration, completion rate, accuracy

#### Users Page
- **Search bar** with filters (subscription tier, activity, date range)
- **Data table**: Username, email, subscription, sessions count, last active, AI cost, actions
- **Click row** → User Detail Page
- **Bulk actions**: Export CSV, change tier

#### User Detail Page
- **Profile card**: Avatar, name, email, subscription, join date
- **Activity stats**: Sessions, questions, accuracy, time spent, streaks
- **AI Cost**: How much AI cost this user has generated
- **Session history**: Table of all practice sessions
- **Proficiency radar**: Visual skill breakdown

#### Financials Page
- **P&L Summary**: Revenue, AI Costs, Gross Margin, Burn Rate
- **Cost breakdown**: By worker type (pie), by model (bar), by function (table)
- **Revenue breakdown**: By subscription tier, by period
- **Trend chart**: Monthly cost/revenue with prediction trendline
- **Per-user cost**: Top 10 most expensive users

#### AI Usage Page
- **Token usage**: Input vs output tokens over time
- **Model breakdown**: Cost per model (gpt-4o-mini, text-embedding-3-small, etc.)
- **Function breakdown**: Which AI functions cost the most
- **Alerts**: Anomaly detection (unusual cost spikes)

#### Content Page
- **Stats cards**: Total passages, questions, exams, articles
- **Generation timeline**: Content created per day
- **Quality metrics**: Avg quality score, difficulty distribution
- **Tables**: Browsable with filters

#### System Page
- **Read-only SQL query runner** (with output table)
- **Record editor**: Select table → find record → edit fields
- **Activity log**: Recent admin actions
- **Trigger actions**: Run daily metrics snapshot, clear caches

### 8.5 Charting Library

Use **Recharts** (already React-native, lightweight, responsive):
```bash
npm install recharts
```

---

## 9. Security Architecture

| Layer | Implementation |
|-------|---------------|
| Auth | Separate JWT with `ADMIN_JWT_SECRET`, 1h expiry, no refresh |
| Email Lock | Hardcoded check: `payload.email === config.admin.email` |
| Password | bcrypt hash stored in `.env`, verified server-side |
| Rate Limit | 3 login attempts per 30 minutes |
| Cookie | `httpOnly`, `secure`, `sameSite: strict`, separate name |
| CORS | Admin routes only accept requests from same origin |
| IP Logging | Every admin action logs IP + timestamp |
| SQL Safety | System query endpoint: read-only mode, query sanitization, result limit |
| Route Guard | `requireAdmin` middleware on ALL `/api/admin/*` except login |

---

## 10. What NOT To Change

> **CRITICAL**: These must remain untouched to avoid disrupting user-side workflows.

1. **User auth flow** — `features/auth/*` unchanged
2. **User dashboard** — `features/dashboard/*` unchanged  
3. **Daily content worker output** — Only ADD cost persistence at the end, never modify pipeline
4. **Customized mocks pipeline** — Only ADD cost tracking, never modify generation steps
5. **Analytics phases A-F** — Only ADD tracking if LLM calls exist, never modify computation
6. **Frontend user routes** — No changes to `/home`, `/dashboard`, `/daily`, `/auth`, `/mock`
7. **Existing DB tables** — No ALTER on any existing table; only CREATE new tables
8. **Existing API endpoints** — No modifications to user-facing endpoints

---

## 11. Implementation Order & Dependencies

```
Phase 1 (DB) ──→ Phase 2 (Auth) ──→ Phase 3 (Cost Tracking) ──→ Phase 4 (API)
                                                                      │
                                                                      ▼
                                              Phase 5 (FE Foundation) ──→ Phase 6 (Pages)
                                                                              │
                                                                              ▼
                                                                    Phase 7 (Charts) ──→ Phase 8 (Polish)
```

**Estimated effort**: ~3-4 focused implementation sessions

---

## 12. Verification Plan

### Automated / Script-based
1. **DB migration**: Run SQL script against NeonDB → verify tables exist with `\dt admin_*`
2. **Admin login**: `curl -X POST /api/admin/auth/login -d '{"email":"...","password":"..."}' ` → expect JWT cookie
3. **Auth rejection**: `curl /api/admin/overview` without token → expect 401
4. **Auth rejection**: `curl /api/admin/overview` with regular user token → expect 403
5. **Cost persistence**: Run daily content worker → check `admin_ai_cost_log` has rows

### Browser-based
1. Navigate to `/admin` → should show login page
2. Login with correct credentials → should redirect to overview
3. Verify all sidebar links navigate correctly
4. Check mobile view (resize to 375px width) — sidebar collapses, cards stack
5. Check desktop view (1440px) — full sidebar, multi-column grids
6. Verify charts render with data (or show empty states)

### Manual (User)
1. Deploy to staging → login as admin → verify real data appears
2. Test admin actions (edit user, run query) → verify DB changes
3. Confirm regular users CANNOT access `/admin` routes even if they try

---

## 13. File Reference Index

For any future AI agent — here's where everything lives:

| What | Where |
|------|-------|
| DB Schema (SQL) | `services/backend/sql_schema/schema.sql` |
| DB Schema (Drizzle) | `services/backend/src/db/schema.ts` |
| DB Client | `services/backend/src/db/index.ts` (Drizzle + Neon) |
| Backend entry | `services/backend/src/index.ts` (Express app) |
| Backend config | `services/backend/src/config/index.ts` (env vars) |
| Auth middleware | `services/backend/src/features/auth/middleware/auth.middleware.ts` |
| Auth routes | `services/backend/src/features/auth/auth.routes.ts` |
| User dashboard | `services/backend/src/features/dashboard/` |
| Daily content worker | `services/backend/src/workers/daily-content/runDailyContent.ts` |
| Mock generation worker | `services/backend/src/workers/customized-mocks/runCustomizedMocks.ts` |
| Analytics worker | `services/backend/src/workers/analytics/runAnalytics.ts` |
| Cost tracker (current) | `services/backend/src/workers/daily-content/retrieval/utils/CostTracker.ts` |
| Frontend entry | `apps/web/src/App.tsx` (React Router config) |
| Frontend API client | `apps/web/src/services/apiClient.ts` |
| Error utility | `services/backend/src/common/utils/errors.ts` |
| Logger utility | `services/backend/src/common/utils/logger.ts` |
| Rate limiter | `services/backend/src/common/middleware/rateLimiter.ts` |
| Progress tracker | `admin-panel/progress.md` |
