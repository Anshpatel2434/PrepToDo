# Daily Content Pipeline - Multi-Step Edge Functions

## Overview

The daily-content workflow has been refactored from a single monolithic edge function into an 8-step pipeline following the same architecture as `customized-mocks`. This provides better error handling, state management, and the ability to trigger daily content generation automatically via cron.

## Pipeline Structure

### Step Functions (8 total)

1. **`daily-content-init`** - Initializes daily content generation
   - Selects genre for today
   - Fetches article and extracts semantic ideas
   - Generates embeddings and fetches reference data
   - Creates exam record and generation state

2. **`daily-content-passage`** - Generates CAT-style passage
   - Uses semantic ideas and authorial persona
   - Saves passage to database

3. **`daily-content-rc-questions`** - Generates RC questions
   - Creates 4 RC questions based on passage
   - Saves questions to database

4. **`daily-content-rc-answers`** - Selects RC answers
   - Uses AI to select correct answers for RC questions
   - Updates questions with correct_option

5. **`daily-content-va-questions`** - Generates VA questions
   - Creates para-summary, para-completion, para-jumble questions
   - Uses semantic ideas and reference data

6. **`daily-content-va-answers`** - Selects VA answers
   - Uses AI to select correct answers for VA questions
   - Fetches reasoning graph nodes for rationale generation

7. **`daily-content-rc-rationales`** - Generates RC rationales
   - Tags questions with reasoning graph nodes
   - Generates elimination-based rationales using reasoning graph context

8. **`daily-content-va-rationales`** - Generates VA rationales
   - Tags VA questions with reasoning graph nodes
   - Generates elimination-based rationales
   - Marks exam as completed and cleans up state

## Folder Structure

```
services/workers/daily-content/
├── functions/
│   ├── step1Init/handler.ts
│   ├── step2Passage/handler.ts
│   ├── step3RCQuestions/handler.ts
│   ├── step4RCAnswers/handler.ts
│   ├── step5VAQuestions/handler.ts
│   ├── step6VAAnswers/handler.ts
│   ├── step7RCRationales/handler.ts
│   └── step8VARationales/handler.ts
├── shared/
│   ├── stateManager.ts
│   ├── functionInvoker.ts
│   ├── errorHandler.ts
│   └── referenceDataHelpers.ts
├── types/
│   └── state.ts
├── runDailyContent.ts (legacy - still functional)
└── setup-triggers.sql

supabase/functions/
├── daily-content/ (legacy - existing monolithic function)
├── daily-content-init/
│   └── index.ts
├── daily-content-passage/
│   └── index.ts
├── daily-content-rc-questions/
│   └── index.ts
├── daily-content-rc-answers/
│   └── index.ts
├── daily-content-va-questions/
│   └── index.ts
├── daily-content-va-answers/
│   └── index.ts
├── daily-content-rc-rationales/
│   └── index.ts
└── daily-content-va-rationales/
    └── index.ts
```

## Shared Utilities

### StateManager (`shared/stateManager.ts`)
- `load(examId)` - Load generation state
- `update(examId, updates)` - Update state
- `markFailed(examId, errorMessage)` - Mark as failed
- `markCompleted(examId)` - Mark as completed and cleanup
- `create(examId, genre, totalSteps)` - Create initial state

### FunctionInvoker (`shared/functionInvoker.ts`)
- `invokeNext(step, { exam_id })` - Invoke next step in pipeline
- Maps steps to function names for automatic invocation

### ErrorHandler (`shared/errorHandler.ts`)
- `withErrorHandling(examId, step, fn)` - Wrap functions with error handling
- Automatically marks state as failed on error

## State Management

The pipeline uses the `exam_generation_state` table to track progress:

```typescript
interface ExamGenerationState {
    exam_id: string;
    status: GenerationStatus;        // Current pipeline status
    current_step: number;            // 1-8
    total_steps: number;             // Always 8
    genre?: string;                  // Selected genre
    article_data?: any;              // Article and semantic data
    passage_id?: string;             // Generated passage ID
    rc_question_ids?: string[];      // RC question IDs
    va_question_ids?: string[];      // VA question IDs
    reference_passages_content?: string[];  // Reference for generation
    reference_data_rc?: any[];        // RC reference data
    reference_data_va?: any[];        // VA reference data
    reasoning_graph_nodes?: any[];    // Nodes for rationale generation
    user_id: string;                  // 'system' for daily content
    params: Record<string, any>;     // Generation parameters
}
```

## Bundling Script

A new bundling script creates all 8 edge function bundles:

```bash
cd services
npm run bundle:daily-content
```

This creates `bundled.ts` files in each `supabase/functions/daily-content-*/` directory.

## SQL Triggers & Automation

The `setup-triggers.sql` file contains:

1. **Daily Cron Job** - Triggers at midnight UTC every day
2. **Stored Procedure** - `process_daily_content_generation()` 
3. **Manual Trigger Function** - `trigger_daily_content_manual()`
4. **Monitoring Views** - Track generation progress

### Installation

```sql
-- Run in Supabase SQL editor
\i services/workers/daily-content/setup-triggers.sql
```

### Manual Trigger

```sql
-- Generate daily content immediately
SELECT trigger_daily_content_manual(CURRENT_DATE);
```

### Monitoring

```sql
-- View recent daily content
SELECT * FROM daily_content_monitoring;

-- Check cron job status
SELECT * FROM cron_job_status;

-- View recent runs
SELECT * FROM daily_content_runs;

-- Check generation state
SELECT * FROM exam_generation_state ORDER BY updated_at DESC;
```

## Deployment

### Deploy All Functions

```bash
cd services
npm run bundle:daily-content

# Deploy all 8 functions
supabase functions deploy daily-content-init
supabase functions deploy daily-content-passage
supabase functions deploy daily-content-rc-questions
supabase functions deploy daily-content-rc-answers
supabase functions deploy daily-content-va-questions
supabase functions deploy daily-content-va-answers
supabase functions deploy daily-content-rc-rationales
supabase functions deploy daily-content-va-rationales
```

### Environment Variables

Ensure these are set in Supabase Edge Functions:

```bash
supabase secrets set OPENAI_API_KEY=your_key
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Usage

### Automatic (Preferred)
Once deployed and cron is set up, content generates automatically at midnight UTC.

### Manual API Call
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/daily-content-init' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"date": "2025-01-26"}'
```

### Legacy (Still Works)
The original monolithic function remains available:
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/daily-content' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

## Benefits Over Monolithic

1. **Better Error Handling** - Failures in one step don't affect others
2. **State Management** - Track progress and resume if needed
3. **Automatic Retries** - Each step can be retried independently
4. **Monitoring** - Track progress at each step
5. **Scalability** - Steps can be distributed across resources
6. **Maintainability** - Each step is isolated and easier to debug
7. **Reusability** - Individual steps can be reused for other workflows

## Key Differences from Customized-Mocks

| Aspect | Daily Content | Customized-Mocks |
|--------|--------------|------------------|
| Trigger | Cron (midnight) | User request |
| User | System | Actual user |
| Genre | Automatic rotation | User selected |
| Passages | Single | Multiple (1-4) |
| Questions | Fixed (4 RC + 3-4 VA) | Configurable |
| Personalization | None | User history, weak areas |
| Use Case | Daily practice | Custom tests |

The architecture is identical, only the parameters and trigger mechanism differ.

## Troubleshooting

### Function Not Found
```bash
# Re-bundle and redeploy
cd services
npm run bundle:daily-content
supabase functions deploy daily-content-init # etc.
```

### State Stuck
```sql
-- Check state
SELECT * FROM exam_generation_state WHERE exam_id = 'your-exam-id';

-- Manual cleanup if needed
DELETE FROM exam_generation_state WHERE exam_id = 'your-exam-id';
UPDATE exam_papers SET generation_status = 'failed' WHERE id = 'your-exam-id';
```

### Cron Not Running
```sql
-- Verify cron job exists
SELECT * FROM cron.job WHERE jobname = 'daily-content-generation';

-- Reschedule if missing
SELECT cron.schedule('daily-content-generation', '0 0 * * *', 'CALL process_daily_content_generation();');
```
