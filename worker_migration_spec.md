# Worker Migration to Express Backend - Full Specification

> **Purpose**: This document provides complete specifications for an AI coding agent to migrate Supabase edge function workers to the custom Express backend architecture.

---

## 🎯 High-Level Objectives

1. **Migrate Daily Content Worker** → Express backend feature module
2. **Migrate Customized Mocks Worker** → Express backend with status tracking
3. **Migrate Analytics Worker** → Express backend with database triggers
4. **Update Frontend APIs** → Replace Supabase calls with HTTP backend calls

---

## 📁 Source Files Reference

### Workers to Migrate

| Worker | Main File | Lines | Key Dependencies |
|--------|-----------|-------|------------------|
| daily-content | [services/workers/daily-content/runDailyContent.ts](file:///c:/StartUp/preptodo/PrepToDo/services/workers/daily-content/runDailyContent.ts) | 260 | retrieval/*, graph/*, DataManager |
| customized-mocks | [services/workers/customized-mocks/runCustomizedMock.ts](file:///c:/StartUp/preptodo/PrepToDo/services/workers/customized-mocks/runCustomizedMock.ts) | 483 | retrieval/*, graph/*, DataManager |
| analytics | [services/workers/analytics/runAnalytics.ts](file:///c:/StartUp/preptodo/PrepToDo/services/workers/analytics/runAnalytics.ts) | 233 | phases/*, utils/*, supabase |

### SQL Triggers to Migrate

| Worker | SQL File | Purpose |
|--------|----------|---------|
| daily-content | [services/workers/daily-content/setup-triggers.sql](file:///c:/StartUp/preptodo/PrepToDo/services/workers/daily-content/setup-triggers.sql) | pg_cron midnight scheduler |
| analytics | [services/workers/analytics/setup-triggers.sql](file:///c:/StartUp/preptodo/PrepToDo/services/workers/analytics/setup-triggers.sql) | Trigger on session completion |

### Frontend Files to Update

| Feature | API File | Lines | Current Pattern |
|---------|----------|-------|-----------------|
| daily | [apps/web/src/pages/daily/redux_usecase/dailyPracticeApi.ts](file:///c:/StartUp/preptodo/PrepToDo/apps/web/src/pages/daily/redux_usecase/dailyPracticeApi.ts) | 926 | fakeBaseQuery + Supabase |
| customized-mocks | [apps/web/src/pages/customized-mocks/redux_usecase/customizedMocksApi.ts](file:///c:/StartUp/preptodo/PrepToDo/apps/web/src/pages/customized-mocks/redux_usecase/customizedMocksApi.ts) | 1175 | fakeBaseQuery + Supabase + realtime |

---

## 🏗️ Architecture Patterns

### Key Design Decision: Separate Workers Folder

Keep worker logic in a dedicated `src/workers/` folder, separate from the HTTP API layer. This provides:
- **Reusability**: Workers can be called from API, cron jobs, or internal services
- **Clean Code**: Controllers are thin HTTP handlers, workers contain business logic
- **Easy Testing**: Workers can be unit tested without Express dependencies

### Backend Folder Structure

```
services/backend/src/
├── features/                    # HTTP API layer (thin controllers)
│   ├── auth/                    # Existing
│   ├── dashboard/               # Existing
│   ├── daily-content/           # NEW - HTTP routes only
│   │   ├── controllers/
│   │   │   └── dailyContent.controller.ts  # Thin: calls worker
│   │   ├── schemas/
│   │   │   └── dailyContent.schemas.ts
│   │   ├── dailyContent.routes.ts
│   │   └── index.ts
│   ├── customized-mocks/        # NEW
│   │   ├── controllers/
│   │   ├── schemas/
│   │   └── customizedMocks.routes.ts
│   └── analytics/               # NEW
│       ├── controllers/
│       └── analytics.routes.ts
│
├── workers/                     # NEW - Reusable business logic
│   ├── daily-content/
│   │   ├── runDailyContent.ts   # Main orchestrator
│   │   ├── retrieval/           # Copy from services/workers/daily-content/
│   │   ├── graph/
│   │   ├── schemas/
│   │   ├── shared/
│   │   └── types/
│   ├── customized-mocks/
│   │   ├── runCustomizedMock.ts
│   │   ├── retrieval/
│   │   ├── graph/
│   │   ├── core/
│   │   └── types/
│   └── analytics/
│       ├── runAnalytics.ts
│       ├── phases/
│       ├── utils/
│       └── types/
│
├── db/                          # Existing
├── config/                      # Existing
└── common/                      # Existing
```

### Controller Pattern (Thin - Just HTTP)

```typescript
// features/daily-content/controllers/dailyContent.controller.ts
import { runDailyContent } from '../../../workers/daily-content/runDailyContent.js';
import { createChildLogger } from '../../../common/utils/logger.js';

const dailyLogger = createChildLogger('daily-content');

export async function triggerDailyGeneration(req: Request, res: Response): Promise<void> {
    dailyLogger.info({ action: 'trigger_daily_generation' }, 'Starting daily content generation');
    
    try {
        const result = await runDailyContent();
        dailyLogger.info({ action: 'trigger_daily_generation' }, 'Daily content generated');
        res.json(successResponse(result));
    } catch (error) {
        dailyLogger.error({ error }, 'Daily generation failed');
        throw error;
    }
}
```

### Worker Pattern (Business Logic)

Workers remain largely unchanged, just update imports:

```typescript
// workers/daily-content/runDailyContent.ts
// Change: import { supabase } → import { db }
import { db } from '../../db/index.js';
import { examPapers, passages, questions } from '../../db/schema.js';

// Rest of logic stays the same, but use Drizzle ORM queries
```

### Migration Steps for Workers

1. **Copy folder**: `services/workers/{worker}` → `services/backend/src/workers/{worker}`
2. **Update DB import**: `supabase` → `db` from Drizzle
3. **Update queries**: Supabase syntax → Drizzle ORM syntax
4. **Update logger**: `console.log` → Pino logger


### Code Standards

#### Imports Pattern
```typescript
import type { Request, Response } from 'express';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { tableName } from '../../../db/schema.js';
import { Errors, successResponse } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';
```

#### Controller Pattern
```typescript
const featureLogger = createChildLogger('feature-name');

export async function controllerFunction(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    
    if (!userId) {
        throw Errors.unauthorized();
    }

    featureLogger.info({ userId, action: 'action_name' }, 'Description');

    try {
        // Business logic
        const result = await db.select()...
        
        featureLogger.info({ userId, action: 'action_name' }, 'Success');
        res.json(successResponse(result));
    } catch (error) {
        featureLogger.error({ userId, error }, 'Action failed');
        throw error;
    }
}
```

#### Route Pattern
```typescript
import { Router } from 'express';
import { requireAuth } from '../auth/middleware/auth.middleware.js';
import { controller } from './controllers/{feature}.controller.js';
import { validateSchema } from './schemas/{feature}.schemas.js';

const router = Router();

router.get('/', requireAuth, controller);
router.post('/', requireAuth, validateSchema, controller);

export default router;
```

---

## 🔐 Security Requirements

### Authentication
- All protected routes MUST use [requireAuth](file:///c:/StartUp/preptodo/PrepToDo/services/backend/src/features/auth/middleware/auth.middleware.ts#18-50) middleware
- Extract `userId` from `req.user?.userId` (set by middleware)
- Never trust client-provided userId - always use authenticated user

### Input Validation
- Use Zod schemas for all request body/query validation
- Create validation middleware following auth pattern:

```typescript
export const validateSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        throw Errors.validationError(result.error.errors);
    }
    req.body = result.data; // Cleaned data
    next();
};
```

### Rate Limiting
- Apply rate limiters for resource-intensive endpoints (content generation)
- Use existing `generalRateLimiter` or create feature-specific ones

---

## 📝 Logging Requirements

### Required Logs

| Event Type | Level | Required Fields |
|------------|-------|-----------------|
| Request start | info | userId, action |
| Success | info | userId, action, resultSummary |
| Failure | error | userId, action, error |
| Long operation steps | debug | userId, step, progress |

### Logger Creation
```typescript
import { createChildLogger } from '../../../common/utils/logger.js';
const featureLogger = createChildLogger('daily-content');
```

### Sensitive Data
Never log: passwords, tokens, full request bodies, PII

---

## 📦 Feature 1: Daily Content Worker

### New Backend Structure
```
services/backend/src/features/daily-content/
├── controllers/
│   └── dailyContent.controller.ts
├── services/
│   ├── contentGeneration.service.ts  # Main orchestrator
│   ├── passage.service.ts            # Passage generation
│   ├── rcQuestions.service.ts        # RC question generation
│   └── vaQuestions.service.ts        # VA question generation
├── retrieval/                        # Copy from workers/daily-content/retrieval
├── graph/                            # Copy from workers/daily-content/graph
├── types/
│   └── dailyContent.types.ts
├── dailyContent.routes.ts
└── index.ts
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/daily/today` | Public | Get today's daily content (exam_id, passages, questions) |
| GET | `/api/daily/previous` | Public | Get previous daily tests with pagination |
| GET | `/api/daily/:examId` | Public | Get specific daily test by ID |
| POST | `/api/daily/start-session` | Auth | Start a new practice session |
| PUT | `/api/daily/session/:id` | Auth | Update session (progress, completion) |
| POST | `/api/daily/attempts` | Auth | Save question attempts |
| GET | `/api/daily/leaderboard/:examId` | Public | Get daily leaderboard |

### Key Implementation Notes

1. **Copy Retrieval Logic**: All files in `workers/daily-content/retrieval/` should be copied and adapted:
   - Replace `supabase` import with `db` (Drizzle)
   - Change Supabase query syntax to Drizzle ORM syntax
   
2. **DataManager Pattern**: Keep the `DataManager` class as-is (pure logic, no DB)

3. **Cost Tracker**: Keep for monitoring AI API costs

4. **Generation Trigger Options**:
   - Option A: HTTP endpoint + external cron (e.g., Railway cron)
   - Option B: Node.js cron library (node-cron)
   - Option C: Neon's pg_cron (see SQL section)

### SQL for Neon DB (daily-content)

Create `services/backend/sql_schema/daily_content_triggers.sql`:

```sql
-- For Neon DB: Use pg_cron to schedule daily content generation
-- This calls the backend endpoint instead of Supabase edge function

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily content generation at midnight UTC
SELECT cron.schedule(
    'daily-content-generation',
    '0 0 * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-backend-url/api/internal/generate-daily-content',
        headers := '{"Authorization": "Bearer INTERNAL_SECRET_KEY"}'
    );
    $$
);
```

---

## 📦 Feature 2: Customized Mocks Worker

### New Backend Structure
```
services/backend/src/features/customized-mocks/
├── controllers/
│   └── customizedMocks.controller.ts
├── services/
│   ├── mockGeneration.service.ts     # Main orchestrator
│   └── generationState.service.ts    # Status tracking
├── retrieval/                        # Copy from workers/customized-mocks/retrieval
├── graph/                            # Copy from workers/customized-mocks/graph
├── schemas/
│   └── customizedMocks.schemas.ts    # Request validation
├── types/
│   └── customizedMocks.types.ts
├── customizedMocks.routes.ts
└── index.ts
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/mocks` | Auth | List user's mocks with status |
| GET | `/api/mocks/proficiency` | Auth | Get user's proficiency for personalization |
| GET | `/api/mocks/genres` | Public | Get available genres |
| POST | `/api/mocks/generate` | Auth | Start mock generation (async) |
| GET | `/api/mocks/:examId` | Auth | Get mock test data |
| GET | `/api/mocks/:examId/status` | Auth | Poll generation status |
| POST | `/api/mocks/:examId/start-session` | Auth | Start mock session |
| GET | `/api/mocks/session/:sessionId` | Auth | Get existing session |
| PUT | `/api/mocks/session/:sessionId` | Auth | Update session |
| POST | `/api/mocks/attempts` | Auth | Save question attempts |
| DELETE | `/api/mocks/:examId` | Auth | Delete mock (if not started) |

### Generation Status Tracking

**CRITICAL**: The customized mock generation is async and takes 2-5 minutes. Must track status.

#### Status States
```typescript
type GenerationStatus = 
    | 'initializing'
    | 'generating_passages'
    | 'generating_rc_questions'
    | 'generating_va_questions'
    | 'selecting_answers'
    | 'generating_rationales'
    | 'completed'
    | 'failed';
```

#### Status Table (Already exists in schema)
Use `exam_generation_state` table:
- `exam_id`: UUID
- `status`: GenerationStatus
- `current_step`: number (1-7)
- `total_steps`: number (7)
- `error_message`: string | null
- `updated_at`: timestamp

#### Implementation Pattern
```typescript
// In mockGeneration.service.ts
async function generateMock(params: MockRequest): Promise<void> {
    const examId = uuidv4();
    
    // 1. Create initial state
    await db.insert(examGenerationState).values({
        examId,
        status: 'initializing',
        currentStep: 1,
        totalSteps: 7,
        userId: params.userId,
        params: params,
    });
    
    try {
        // 2. Update status at each phase
        await updateGenerationStatus(examId, 'generating_passages', 2);
        const passages = await generatePassages(params);
        
        await updateGenerationStatus(examId, 'generating_rc_questions', 3);
        const rcQuestions = await generateRCQuestions(passages);
        
        // ... continue through all phases
        
        await updateGenerationStatus(examId, 'completed', 7);
    } catch (error) {
        await db.update(examGenerationState)
            .set({ status: 'failed', errorMessage: error.message })
            .where(eq(examGenerationState.examId, examId));
    }
}
```

### Frontend Real-time Updates

The current frontend uses Supabase realtime for status updates. Options:

1. **Polling** (Recommended for simplicity):
   - Frontend polls `/api/mocks/:examId/status` every 3 seconds during generation
   - Stop polling when status is 'completed' or 'failed'

2. **Server-Sent Events (SSE)**:
   - Backend sends updates through SSE connection
   - More efficient but more complex

---

## 📦 Feature 3: Analytics Worker

### New Backend Structure
```
services/backend/src/features/analytics/
├── controllers/
│   └── analytics.controller.ts
├── services/
│   ├── analytics.service.ts          # Main orchestrator
│   ├── proficiencyEngine.service.ts  # Score calculations
│   └── diagnostics.service.ts        # LLM diagnostics
├── phases/                           # Copy from workers/analytics/phases
├── utils/                            # Copy from workers/analytics/utils
├── types/
│   └── analytics.types.ts
├── analytics.routes.ts
└── index.ts
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/analytics/process` | Auth | Process unanalyzed sessions |
| POST | `/api/internal/analytics-trigger` | Internal | Called by DB trigger |

### Trigger Options for Neon DB

#### Option A: Application-level trigger (Recommended)
Call analytics endpoint when session is marked complete in the backend:

```typescript
// In session save endpoint
if (status === 'completed') {
    // Fire and forget - don't await
    fetch(`${BACKEND_URL}/api/analytics/process`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${internalToken}` },
        body: JSON.stringify({ user_id: userId }),
    });
}
```

#### Option B: Neon pg_cron (batch processing)
```sql
-- Process analytics every 5 minutes for any pending sessions
SELECT cron.schedule(
    'process-analytics',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-backend-url/api/internal/process-batch-analytics',
        headers := '{"Authorization": "Bearer INTERNAL_SECRET_KEY"}'
    );
    $$
);
```

### SQL for Neon DB (analytics)

Create `services/backend/sql_schema/analytics_triggers.sql`:

```sql
-- Option: DB-level trigger (if pg_net is available on Neon)
CREATE OR REPLACE FUNCTION notify_session_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
        PERFORM pg_notify('session_completed', json_build_object(
            'user_id', NEW.user_id,
            'session_id', NEW.id
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_session_complete
AFTER UPDATE ON practice_sessions
FOR EACH ROW
EXECUTE FUNCTION notify_session_complete();
```

---

## 🖥️ Frontend Integration

### Pattern: Replace fakeBaseQuery with fetchBaseQuery

#### Before (Supabase)
```typescript
export const api = createApi({
    reducerPath: "api",
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        fetchData: builder.query({
            queryFn: async () => {
                const { data, error } = await supabase.from('table').select();
                if (error) return { error };
                return { data };
            },
        }),
    }),
});
```

#### After (HTTP Backend)
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BACKEND_URL}/api/feature`,
        credentials: 'include', // IMPORTANT: Include cookies for auth
    }),
    tagTypes: ['Tag1', 'Tag2'],
    endpoints: (builder) => ({
        fetchData: builder.query<ResponseType, void>({
            query: () => '/',
            transformResponse: (response: ApiResponse<ResponseType>) => {
                if (!response.success) throw new Error(response.error?.message);
                return response.data;
            },
            providesTags: ['Tag1'],
        }),
    }),
});
```

### API Response Format

All backend responses follow this format:
```typescript
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}
```

### Files to Update

1. **dailyPracticeApi.ts**
   - Replace Supabase queries with HTTP calls
   - Update all 12 endpoints
   - Keep the same hook names for backward compatibility

2. **customizedMocksApi.ts**
   - Replace Supabase queries with HTTP calls
   - Replace realtime subscription with polling
   - Update generation tracking to use status endpoint

---

## ✅ Verification Checklist

### Backend
- [ ] All endpoints return [successResponse(data)](file:///c:/StartUp/preptodo/PrepToDo/services/backend/src/common/utils/errors.ts#148-155) format
- [ ] All routes use [requireAuth](file:///c:/StartUp/preptodo/PrepToDo/services/backend/src/features/auth/middleware/auth.middleware.ts#18-50) middleware
- [ ] All controllers have Pino logging
- [ ] Input validation with Zod schemas
- [ ] Error handling throws `Errors.xyz()`
- [ ] No `console.log` - use logger

### Frontend
- [ ] All APIs use `fetchBaseQuery` with `credentials: 'include'`
- [ ] All APIs handle error responses properly
- [ ] Mock generation shows loading state during polling
- [ ] Same functionality as Supabase version

### Database
- [ ] SQL triggers created for Neon
- [ ] Existing schema covers all required tables

---

## 🔄 Migration Order

1. **Phase 1: Backend Core**
   - Create feature module structures
   - Copy retrieval/graph logic
   - Implement controllers with logging

2. **Phase 2: Daily Content**
   - Implement all `/api/daily/*` endpoints
   - Test with curl/Postman
   - Update dailyPracticeApi.ts

3. **Phase 3: Customized Mocks**
   - Implement all `/api/mocks/*` endpoints
   - Implement status tracking
   - Update customizedMocksApi.ts

4. **Phase 4: Analytics**
   - Implement analytics endpoints
   - Set up trigger mechanism
   - Verify dashboard data flows

5. **Phase 5: SQL Triggers**
   - Create Neon-compatible trigger scripts
   - Test scheduled jobs
