# Worker Migration Progress

## Overview

This document tracks the migration of Supabase edge function workers to an Express backend architecture as specified in `worker_migration_spec.md`.

## Completed Tasks

### Phase 1: Infrastructure Setup ✅

- [x] Created directory structure for backend workers and features
  - `services/backend/src/workers/daily-content/` with retrieval, graph, schemas, shared, types subdirectories
  - `services/backend/src/features/{daily-content,customized-mocks,analytics}/` with controllers, schemas, services, types
  
- [x] Extended Drizzle ORM schema
  - Added all 14 missing tables to `services/backend/src/db/schema.ts`
  - Tables added: articles, genres, examPapers, passages, questions, practiceSessions, questionAttempts, graphNodes, graphEdges, examGenerationState, theoryChunks
  - All table types exported for use across the application

- [x] Created thin controller layer
  - `features/daily-content/controllers/dailyContent.controller.ts` - placeholder controllers for 7 daily endpoints
  - `features/customized-mocks/controllers/customizedMocks.controller.ts` - placeholder controllers for 11 mock endpoints
  - `features/analytics/controllers/analytics.controller.ts` - placeholder controllers for analytics

- [x] Created feature routes
  - `features/daily-content/dailyContent.routes.ts` - 7 routes (GET /today, /previous, /:id, POST /start-session, PUT /session/:id, POST /attempts, GET /:id/leaderboard)
  - `features/customized-mocks/customizedMocks.routes.ts` - 11 routes (list, genres, generate, status, sessions)
  - `features/analytics/analytics.routes.ts` - 3 routes (process, dashboard, internal trigger)

- [x] Integrated routes into main backend server
  - Routes mounted at `/api/daily`, `/api/mocks`, `/api/analytics`

### Phase 2: Worker File Migration (In Progress)

- [x] Copied all worker files from `services/workers/` to `services/backend/src/workers/`
  - `runDailyContent.ts`
  - `retrieval/` directory with all sub-modules
  - `graph/` directory
  - `schemas/` directory
  - `shared/` directory
  - `types/` directory

- [x] Removed Supabase imports
  - Used sed to remove all `import { supabase }` statements from worker files

- [x] Updated 2 key files to use Drizzle ORM
  - `fetchGenre.ts` - now uses Drizzle with proper filtering and logging
  - `fetchQuestionsData.ts` - now uses Drizzle with inArray for filtering

- [x] Update remaining retrieval files
  - `passageHandling/` files (fetchPassagesData.ts, generatePassage.ts, evaluateCATLikeness.ts, finalizeCATPassage.ts)
  - `rcQuestionsHandling/` files (generateRCQuestions.ts, selectCorrectAnswers.ts, tagQuestionsWithNodes.ts, generateBatchRCRationales.ts)
  - `vaQuestionsHandling/` files (generateAllVAQuestions.ts, selectVAAnswers.ts, tagVAQuestionsWithNodes.ts, generateBatchVARationales.ts)
  - `articleHandling/` files (fetchArticleForUsage.ts)
  - Utility files (formatOutputForDB.ts, generateEmbedding.ts, searchPassageAndQuestionEmbeddings.ts, saveAllDataToDB.ts)

- [x] Update graph files
  - `graph/fetchNodes.ts`
  - `graph/createReasoningGraphContext.ts`

- [x] Replace console.log with logger calls in runDailyContent.ts
- [ ] Replace console.log with logger calls in remaining worker files

## Next Steps (In Priority Order)

### 1. Complete Worker Migration (HIGH PRIORITY)

- [x] Update key `retrieval/` files to use Drizzle ORM
  - ✅ fetchGenre.ts - migrated to Drizzle
  - ✅ fetchQuestionsData.ts - migrated to Drizzle
  - ✅ searchPassageAndQuestionEmbeddings.ts - migrated to Drizzle
  - ✅ createReasoningGraphContext.ts - migrated to Drizzle

- [x] Replace console.log with logger in main worker files
  - ✅ runDailyContent.ts - migrated to logger
  - ✅ createReasoningGraphContext.ts - migrated to logger

- [ ] Replace console.log calls with logger in remaining files
  - Files remaining: CostTracker.ts, functionInvoker.ts, referenceDataHelpers.ts, stateManager.ts
  - Files in passageHandling/, rcQuestionsHandling/, vaQuestionsHandling/

### 2. Implement Daily Content Feature

- [ ] Implement getTodayDaily controller
  - Query examPapers table for today's exam
  - Return exam with passages and questions
  
- [ ] Implement startSession controller
  - Create practice_sessions record
  - Return session data

- [ ] Implement updateSession controller
  - Update session status and progress

- [ ] Implement saveAttempts controller
  - Save question_attempts records

- [ ] Implement triggerDailyGeneration controller
  - Call runDailyContent worker
  - Handle async generation with status tracking

### 3. Implement Customized Mocks Feature

- [ ] Copy customized-mocks worker files
- [ ] Update with Drizzle ORM queries
- [ ] Implement generation status tracking using `exam_generation_state` table
- [ ] Implement polling endpoint for frontend status updates

### 4. Implement Analytics Feature

- [ ] Copy analytics worker files
- [ ] Update with Drizzle ORM queries
- [ ] Implement analytics processing pipeline
- [ ] Set up trigger mechanism (application-level for now)

### 5. Frontend Integration

- [ ] Update `apps/web/src/pages/daily/redux_usecase/dailyPracticeApi.ts`
  - Replace Supabase calls with HTTP backend calls
  - Update all 12 endpoints to use `fetchBaseQuery` with `credentials: 'include'`
  - Add error handling for API responses

- [ ] Update `apps/web/src/pages/customized-mocks/redux_usecase/customizedMocksApi.ts`
  - Replace Supabase realtime with polling
  - Update status tracking

### 6. Database Migrations

- [ ] Create Neon pg_cron schedule for daily content generation
- [ ] Create SQL trigger for session completion analytics

## Key Implementation Notes

### Pattern for Drizzle Query Migration

**Before (Supabase):**
```typescript
const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('field', value);
```

**After (Drizzle):**
```typescript
const data = await db
    .select()
    .from(tableSchema)
    .where(eq(tableSchema.field, value));
```

### Logging Pattern

```typescript
import { createChildLogger } from '../../../common/utils/logger.js';
const logger = createChildLogger('feature-name');

logger.debug({ context }, 'Debug message');
logger.info({ context }, 'Info message');
logger.warn({ context }, 'Warning message');
logger.error({ error }, 'Error message');
```

### Error Handling Pattern

```typescript
import { Errors, successResponse } from '../../../common/utils/errors.js';

// Throw typed errors
throw Errors.unauthorized();
throw Errors.notFound('Resource');
throw Errors.validationError({ field: 'error' });

// Return success
res.json(successResponse(data));
```

## Files Structure

```
services/backend/src/
├── features/
│   ├── daily-content/
│   │   ├── controllers/
│   │   │   └── dailyContent.controller.ts ✅ (placeholder)
│   │   ├── dailyContent.routes.ts ✅
│   │   └── index.ts ✅
│   ├── customized-mocks/
│   │   ├── controllers/
│   │   │   └── customizedMocks.controller.ts ✅ (placeholder)
│   │   ├── customizedMocks.routes.ts ✅
│   │   └── index.ts ✅
│   └── analytics/
│       ├── controllers/
│       │   └── analytics.controller.ts ✅ (placeholder)
│       ├── analytics.routes.ts ✅
│       └── index.ts ✅
│
└── workers/
    ├── daily-content/
    │   ├── runDailyContent.ts ✅ (migrated to logger)
    │   ├── retrieval/
    │   │   ├── fetchGenre.ts ✅ (migrated to Drizzle)
    │   │   ├── fetchQuestionsData.ts ✅ (migrated to Drizzle)
    │   │   ├── searchPassageAndQuestionEmbeddings.ts ✅ (migrated to Drizzle)
    │   │   ├── passageHandling/
    │   │   ├── rcQuestionsHandling/
    │   │   ├── vaQuestionsHandling/
    │   │   ├── articleHandling/
    │   │   └── utils/
    │   ├── graph/
    │   │   ├── fetchNodes.ts ✅ (migrated to Drizzle)
    │   │   └── createReasoningGraphContext.ts ✅ (migrated to Drizzle)
    │   ├── schemas/
    │   ├── shared/
    │   └── types/
```

## Testing Strategy

1. **Unit tests for worker files** - test Drizzle queries work correctly
2. **Integration tests for controllers** - test worker + HTTP layer
3. **End-to-end tests for API endpoints** - test full workflow

## Known Issues

- [ ] Some worker files use relative imports that may need adjustment
- [ ] Vector embeddings (vector type) in Drizzle ORM may need special handling
- [ ] Some Supabase-specific features (realtime, pg_net functions) need alternative implementations
- [ ] functionInvoker.ts still uses Supabase functions - needs migration to HTTP calls or removal
- [ ] Some files in shared/ directory still have console.log calls

## References

- Migration spec: `/home/engine/project/worker_migration_spec.md`
- Drizzle ORM docs: https://orm.drizzle.team/docs/overview
- Backend schema: `/home/engine/project/services/backend/src/db/schema.ts`
- Worker source: `/home/engine/project/services/workers/`
