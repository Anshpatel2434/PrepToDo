# VARC Analytics Worker

## Overview

This worker analyzes completed practice sessions to compute user proficiency metrics across multiple dimensions.

## Architecture

The analytics pipeline follows a 5-phase approach:

1. **Phase A - Data Collection**: Fetch session, attempts, questions, and passages from database
2. **Phase B - Surface Statistics**: Compute deterministic statistics per dimension
3. **Phase C - LLM Diagnostics**: (Optional) Use GPT-4o-mini to diagnose incorrect attempts
4. **Phase D - Proficiency Engine**: Update atomic proficiency scores with exponential smoothing
5. **Phase E - Summary Rollup**: Aggregate data into user_proficiency_signals

## Idempotence

The system implements multi-layer idempotence:

1. **Trigger-level**: Only fires when `status = 'completed'` AND `is_analysed = false`
2. **Phase A check**: Returns immediately if session already analysed
3. **Phase D check**: Skips dimension if `last_session_id` matches current session
4. **Finalization**: Only sets `is_analysed = true` after all phases succeed

## Key Formulas

### Confidence Score
```
confidence = min(1.0, sqrt(attempts / 9))
```

### Proficiency Smoothing
```
learning_weight = 0.2 * confidence
new_proficiency = old_proficiency * (1 - learning_weight) + surface_score * learning_weight
```

### Trend Classification
```
if delta > 3 → 'improving'
if delta < -3 → 'declining'
else → 'stagnant'
```

## Dimensions Tracked

- **Core Metrics**: inference_accuracy, argument_structure_analysis, trap_avoidance_rate, etc.
- **Genres**: Philosophy, Economics, Science, etc.
- **Question Types**: rc_question, para_jumble, inference, tone, etc.
- **Reasoning Steps**: Individual graph node IDs

## Database Tables

### Reads from:
- `practice_sessions` - Session metadata
- `question_attempts` - Atomic attempt records
- `questions` - Question metadata and tags (reasoning node IDs)
- `passages` - Passage genre metadata

### Writes to:
- `user_metric_proficiency` - Atomic proficiency per dimension
- `user_proficiency_signals` - Denormalized summary for UI
- `practice_sessions.session_data` - LLM diagnostics (JSONB)

## Usage

### Local Development

```bash
cd services
npm run bundle:varc-analytics
```

### Deployment

```bash
cd services
npm run deploy:varc-analytics
```

### Manual Invocation

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/analyze-varc-session' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"session_id":"xxx","user_id":"yyy"}'
```

## Error Handling

- **Phase C (LLM)**: Failures are logged but don't block pipeline
- **Phase D/E (DB)**: Failures block pipeline to maintain data consistency
- All errors result in `is_analysed` remaining `false` for retry

## Testing

Run the full pipeline on a completed session:

```typescript
import { runVarcAnalytics } from "./runVarcAnalytics";

const result = await runVarcAnalytics({
  session_id: 'session-uuid',
  user_id: 'user-uuid'
});

console.log(result);
```

## Dependencies

- `@supabase/supabase-js` - Database client
- `openai` - LLM for diagnostics
- `zod` - Schema validation

## Configuration

Required environment variables:
- `OPENAI_API_KEY` - For GPT-4o-mini diagnostics
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for DB writes

## Notes

- Questions must have reasoning node UUIDs in `tags[]` field
- If `tags[]` is empty, core metrics will not be calculated for that attempt
- The system assumes a unique constraint exists on `(user_id, dimension_type, dimension_key)` for upserts
- If constraint doesn't exist, falls back to conditional insert/update logic
