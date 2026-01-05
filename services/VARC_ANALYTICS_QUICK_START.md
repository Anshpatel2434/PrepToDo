# VARC Analytics - Quick Start Guide for Implementation

## 🎯 Implementation Priority Order

### Step 1: Set Up Worker Structure (30 minutes)
```bash
cd services/workers
mkdir -p varc-analytics/phases
mkdir -p varc-analytics/utils
touch varc-analytics/runVarcAnalytics.ts
touch varc-analytics/types.ts
touch varc-analytics/utils/mapping.ts
touch varc-analytics/utils/scoring.ts
touch varc-analytics/phases/phaseA_fetchSessionData.ts
touch varc-analytics/phases/phaseB_computeSurfaceStats.ts
touch varc-analytics/phases/phaseC_llmDiagnostics.ts
touch varc-analytics/phases/phaseD_updateProficiency.ts
touch varc-analytics/phases/phaseE_rollupSignals.ts

Step 2: Implement Utils (1 hour)

Start with pure functions that have no dependencies:


utils/mapping.ts - Load and index the metric mapping JSON
utils/scoring.ts - Math functions (confidence, smoothing, trend)

Why first? These are testable in isolation and required by later phases.


Step 3: Implement Phase B (1 hour)

Implement phaseB_computeSurfaceStats.ts next because:


It's pure computation (no DB or LLM)
You can test it with mock data
It validates your understanding of the metric mapping

Step 4: Implement Phase A (1.5 hours)

Now implement phaseA_fetchSessionData.ts:


Includes idempotence checks
Database queries
Dataset construction
Most complex phase in terms of data fetching

Step 5: Implement Phase D & E (2 hours)

Implement proficiency updates:


phaseD_updateProficiency.ts - Atomic updates with upsert
phaseE_rollupSignals.ts - Summary rollup

Test thoroughly: These phases write to the database and must be idempotent.


Step 6: Implement Phase C (1 hour)

Implement phaseC_llmDiagnostics.ts:


LLM integration
Structured output parsing
Error handling (must not block pipeline)

Why last? It's optional for MVP (can be stubbed initially).


Step 7: Implement Orchestrator (30 minutes)

Implement runVarcAnalytics.ts:


Call phases in order A→B→C→D→E
Comprehensive logging
Mark session as analysed

Step 8: Create Edge Function (30 minutes)

mkdir -p supabase/functions/analyze-varc-session
touch supabase/functions/analyze-varc-session/index.ts

Step 9: Bundle & Test (1 hour)

Update bundler script
Generate bundled.ts
Test locally with sample session

Step 10: Deploy (30 minutes)

Deploy edge function
Create and apply trigger migration
Test end-to-end

Total estimated time: 8-10 hours for complete implementation



🔑 Critical Implementation Details

1. Idempotence Pattern (MUST IMPLEMENT)

// In Phase A - ALWAYS check first
if (session.is_analysed) {
  console.log('⚠️ Session already analysed, skipping');
  return { alreadyAnalysed: true };
}

// In orchestrator - ONLY set at the very end
await supabase
  .from('practice_sessions')
  .update({ is_analysed: true })
  .eq('id', session_id);

2. Reasoning Node Source (VERIFY IN YOUR DB)

// Question tags should contain graph node UUIDs
reasoning_node_ids: question.tags || []

// If tags is empty, check:
// 1. Are questions tagged with nodes in production?
// 2. Is there another field storing this mapping?
// 3. Do you need to implement fallback logic?

3. Metric Mapping Usage

// Build indexes once at startup
const { metricToNodes, nodeToMetrics } = loadMetricMapping(json);

// For each attempt, find which metrics it participates in
for (const nodeId of attempt.reasoning_node_ids) {
  const metricKeys = nodeToMetrics.get(nodeId);
  // This attempt counts toward all these metrics
}

4. Proficiency Math (EXACT FORMULAS)

// Constants (DO NOT CHANGE without understanding impact)
const ALPHA = 0.2;
const CONFIDENCE_THRESHOLD = 9;
const TREND_DELTA = 3;

// Confidence: sqrt curve
confidence = Math.min(1.0, Math.sqrt(attempts / CONFIDENCE_THRESHOLD))

// Smoothing: exponential weighted average
newPS = oldPS * (1 - α*confidence) + surfaceScore * (α*confidence)

// Trend: simple threshold
if (newPS > oldPS + 3) → 'improving'
if (newPS < oldPS - 3) → 'declining'
else → 'stagnant'

5. Database Unique Constraint (CHECK IF EXISTS)

-- Required for upsert to work in Phase D
ALTER TABLE user_metric_proficiency 
ADD CONSTRAINT unique_user_dimension 
UNIQUE (user_id, dimension_type, dimension_key);

If this constraint doesn't exist, you'll need to implement conditional insert/update logic.



🧪 Testing Strategy

Unit Tests (Recommended)

// Test scoring functions
expect(calculateConfidence(9)).toBeCloseTo(1.0);
expect(calculateConfidence(4)).toBeCloseTo(0.67);
expect(calculateNewProficiency(50, 80, 1.0)).toBe(56);

// Test Phase B computation
const stats = computeSurfaceStats(mockDataset, mockMapping);
expect(stats.core_metric.get('inference_accuracy').accuracy).toBe(0.75);

Integration Test (Essential)

// Create test session
const testSession = {
  id: 'test-session-id',
  user_id: 'test-user-id',
  status: 'completed',
  is_analysed: false,
  // ... with real attempts
};

// Run analytics
const result = await runVarcAnalytics({
  session_id: testSession.id,
  user_id: testSession.user_id
});

// Verify
expect(result.success).toBe(true);
expect(session.is_analysed).toBe(true);
// Check proficiency records created/updated

Manual Test Checklist

[ ] Run on session with all correct answers
[ ] Run on session with all incorrect answers
[ ] Run on session with mixed results
[ ] Run twice on same session (should skip second time)
[ ] Verify proficiency scores make sense
[ ] Verify trend calculations are correct
[ ] Check diagnostics stored in session_data
[ ] Verify summary signals updated correctly


🐛 Common Issues & Solutions

Issue: "Question tags is empty"

Cause: Questions not tagged with reasoning nodes

Solution:


Verify in DB: SELECT id, tags FROM questions LIMIT 10;
If empty, check if there's another field or junction table
Implement fallback or add tagging step

Issue: "Upsert fails with duplicate key error"

Cause: Unique constraint doesn't exist or is different

Solution:


Check constraint: \d user_metric_proficiency in psql
Add constraint via migration if missing
Or implement select-then-update logic

Issue: "LLM timeout blocks pipeline"

Cause: Phase C not catching errors properly

Solution:


try {
  const diagnostics = await runLLMDiagnostics(...);
} catch (error) {
  console.error('⚠️ [Phase C] LLM failed, continuing without diagnostics');
  return { diagnostics: [] }; // Don't throw
}

Issue: "Double counting in proficiency"

Cause: Idempotence check missing

Solution:


// In Phase D, before updating each dimension
if (existing && existing.last_session_id === session_id) {
  console.log('⚠️ Already updated for this session, skipping');
  continue;
}

Issue: "Trigger not firing"

Cause: HTTP extension not enabled or URL incorrect

Solution:


-- Enable extension
CREATE EXTENSION IF NOT EXISTS http;

-- Check function URL setting
SHOW app.settings.supabase_function_url;

-- Test trigger manually
UPDATE practice_sessions 
SET status = 'completed' 
WHERE id = 'test-id' AND is_analysed = false;


📊 Expected Data Flow

Session Completed
    ↓
Database Trigger Fires
    ↓
Edge Function Called
    ↓
Phase A: Fetch session + attempts + questions + passages
    ↓
Phase B: Compute stats (core_metric, genre, question_type)
    ↓
Phase C: LLM diagnoses incorrect attempts
    ↓
Phase D: Update user_metric_proficiency (9+ rows typically)
    ↓
Phase E: Rollup to user_proficiency_signals (1 row)
    ↓
Mark is_analysed = true
    ↓
Done

Typical Processing Time

Small session (5 attempts): ~2-3 seconds
Medium session (15 attempts): ~5-8 seconds
Large session (30 attempts): ~10-15 seconds

Most time spent in Phase C (LLM) and Phase D (DB upserts).



🎨 Code Style Examples

Phase Entry Points

export async function phaseX_doSomething(
  supabase: any,
  param1: string,
  param2: number
): Promise<ReturnType> {
  
  console.log(`🎯 [Phase X] Starting description`);
  
  // Implementation
  
  console.log(`✅ [Phase X] Completed successfully`);
  return result;
}

Database Operations

// Always check error
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('field', value);

if (error) {
  throw new Error(`Operation failed: ${error.message}`);
}

console.log(`📊 [Context] Fetched ${data.length} records`);

LLM Operations

// Always log before waiting
console.log('⏳ [Phase C] Waiting for LLM response (diagnostics)...');

const completion = await client.chat.completions.parse({
  model: "gpt-4o-mini",
  temperature: 0.2,
  messages: [...],
  response_format: zodResponseFormat(Schema, "name"),
});

console.log('✅ [Phase C] LLM response received');


📝 Logging Template

Copy this structure for each phase:


// Phase start
console.log(`\n📥 [Phase ${X}/${TOTAL}] ${DESCRIPTION}`);

// Progress updates
console.log(`   - ${DETAIL}: ${VALUE}`);

// Before async operations
console.log(`⏳ [Phase ${X}] Waiting for ${OPERATION}...`);

// Success
console.log(`✅ [Phase ${X}] ${SUMMARY}`);

// Errors
console.error(`❌ [Phase ${X}] ${ERROR_DESCRIPTION}:`, error);


🚀 Deployment Commands

# From services directory
cd services

# Bundle the worker
npm run bundle:edge -- varc-analytics
# or
node scripts/bundle-varc-analytics.js

# Verify bundled.ts created
ls -lh ../supabase/functions/analyze-varc-session/bundled.ts

# Deploy edge function
cd ..
supabase functions deploy analyze-varc-session

# Apply trigger migration
supabase db push

# Test manually
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/analyze-varc-session' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"session_id":"xxx","user_id":"yyy"}'


✅ Definition of Done

Your implementation is complete when:


[ ] All 5 phases implemented and tested
[ ] Orchestrator calls phases in correct order
[ ] Idempotence checks in place and verified
[ ] Edge function deployed and callable
[ ] Database trigger created and firing
[ ] Test session processes successfully
[ ] No double-counting when run twice on same session
[ ] Proficiency scores update correctly
[ ] Summary signals rollup correctly
[ ] Diagnostics stored in session_data
[ ] Logs are clear and follow emoji pattern
[ ] Error handling prevents partial updates


📚 Key Files Reference

Read these files first:


Full spec: VARC_ANALYTICS_IMPLEMENTATION_SPEC.md
Schema: apps/web/src/sql_schema/schema.sql
Metric mapping: services/config/core_metric_reasoning_map_v1.0.json
Daily worker example: services/workers/daily-content/runDailyContent.ts

Copy patterns from:


DB operations: services/workers/daily-content/retrieval/saveAllDataToDB.ts
LLM operations: services/workers/daily-content/retrieval/rcQuestionsHandling/tagQuestionsWithNodes.ts
Edge wrapper: supabase/functions/daily-content/index.ts