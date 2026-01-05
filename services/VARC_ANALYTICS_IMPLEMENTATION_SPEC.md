# VARC Analytics & Intelligence System - Implementation Specification

## Document Purpose

This document provides a **complete, executable specification** for implementing the VARC Analytics & Intelligence System as a new Supabase Edge Function in this repository. It follows the existing patterns from the `daily-content` worker and is designed to be implemented by an AI coding agent with **zero ambiguity**.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Codebase Context & Existing Patterns](#codebase-context--existing-patterns)
3. [Database Schema Reference](#database-schema-reference)
4. [Configuration Files & Mappings](#configuration-files--mappings)
5. [Architecture & File Structure](#architecture--file-structure)
6. [Pipeline Implementation (Phases A-E)](#pipeline-implementation-phases-a-e)
7. [Idempotence & Error Handling](#idempotence--error-handling)
8. [Logging Standards](#logging-standards)
9. [Testing & Validation](#testing--validation)
10. [Deployment](#deployment)

---

## System Overview

### What This System Does

When a user completes a practice session, this system:

1. **Analyzes** raw performance data from the session
2. **Computes** metric signals across multiple dimensions (core metrics, genres, question types)
3. **Updates** atomic proficiency scores in `user_metric_proficiency`
4. **Rolls up** summary data into `user_proficiency_signals`
5. **Stores** diagnostic insights for analytics and historical reference

### Trigger Mechanism

- **Database trigger** on `practice_sessions` when `status` changes to `'completed'`
- Only fires when `is_analysed = false`
- Calls Edge Function `analyze-varc-session` with `session_id` and `user_id`

### Key Principles

✅ **LLM is ONLY for diagnostics** (Phase C) - understanding WHY errors happened  
✅ **All scoring is mathematical** - no LLM-based scores  
✅ **Deterministic & reproducible** - same inputs = same outputs  
✅ **Idempotent** - safe to run multiple times on same session  
✅ **Follows daily-content patterns** - same structure, style, logging

---

## Codebase Context & Existing Patterns

### Existing Daily Content Worker (Pattern to Follow)

**Location:** `services/workers/daily-content/`

**Key Files:**

- `runDailyContent.ts` - Main orchestrator with clear phases
- `retrieval/` - Database and API operations
- `graph/` - Graph operations (fetchNodes, etc.)
- `schemas/types.ts` - TypeScript types and Zod schemas

**Patterns Used:**

```typescript
// Phase-based workflow
console.log("\n🎯 [Step 1/15] Selecting genre");
const genre = await fetchGenreForToday();

console.log("\n📄 [Step 2/15] Fetching data");
const data = await fetchData();

// Always log before LLM calls
console.log("⏳ Waiting for LLM response...");
const result = await openai.chat.completions.create(...);

Database Operations Pattern:


// From saveAllDataToDB.ts
const { data: examResponse, error: examError } = await supabase
    .from("exam_papers")
    .insert([examData])
    .select();

if (examError) throw new Error(`Exam Insert: ${examError.message}`);
console.log("📄 [DB Save] Exam Paper metadata saved");

Configuration Files Used

services/config/supabase.ts - Supabase client
services/config/openai.ts - OpenAI client
services/config/core_metric_reasoning_map_v1.0.json - Metric mappings
services/config/user_core_metrics_definition_v1.json - Metric definitions

Edge Function Pattern

Location: supabase/functions/daily-content/index.ts


import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { runDailyContent } from "./bundled.ts"

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const payload = await req.json()
    const result = await runDailyContent()

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (err) {
    console.error("❌ error:", err)
    return new Response(JSON.stringify({
      error: "Failed",
      details: err instanceof Error ? err.message : String(err)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})


Database Schema Reference

Critical Tables for This System

practice_sessions

Purpose: Session header with aggregate outcomes


Relevant Columns:


id uuid PRIMARY KEY
user_id uuid NOT NULL
session_type character varying ('practice', 'timed_test', 'daily_challenge_rc', etc.)
mode character varying ('tutor', 'test', 'adaptive')
time_spent_seconds integer DEFAULT 0
total_questions integer DEFAULT 0
correct_answers integer DEFAULT 0
score_percentage numeric
status character varying ('in_progress', 'completed', 'abandoned', 'paused')
completed_at timestamp with time zone
is_analysed boolean DEFAULT false  -- OUR IDEMPOTENCE SENTINEL
created_at timestamp with time zone DEFAULT now()
updated_at timestamp with time zone DEFAULT now()

Key: is_analysed is the field name (NOT analysis_status)


question_attempts

Purpose: Atomic attempt records (the source of truth)


Relevant Columns:


id uuid PRIMARY KEY
user_id uuid NOT NULL
session_id uuid NOT NULL
question_id uuid NOT NULL
passage_id uuid
user_answer jsonb
is_correct boolean NOT NULL
time_spent_seconds integer NOT NULL
confidence_level integer (1-5)
eliminated_options text[]
ai_grading_score numeric
ai_feedback text
created_at timestamp with time zone DEFAULT now()

Important: No reasoning_steps[] or error_patterns[] columns exist directly on this table.


questions

Purpose: Question metadata


Relevant Columns:


id uuid PRIMARY KEY
passage_id uuid
question_text text NOT NULL
question_type character varying ('rc_question', 'inference', 'tone', 'para_jumble', etc.)
options jsonb
correct_answer jsonb NOT NULL
tags text[]  -- LIKELY CONTAINS REASONING NODE IDs (UUIDs)
paper_id uuid
created_at timestamp with time zone
updated_at timestamp with time zone

Critical: tags[] likely contains graph node UUIDs for reasoning steps


passages

Purpose: Passage content and metadata


Relevant Columns:


id uuid PRIMARY KEY
content text NOT NULL
word_count integer NOT NULL
genre character varying NOT NULL
difficulty character varying ('easy', 'medium', 'hard')

graph_nodes

Purpose: Reasoning graph nodes


Columns:


id uuid PRIMARY KEY
label text UNIQUE
type text  -- e.g., 'ReasoningStep', 'Concept', 'ErrorPattern'

Registry Tables (Validation Sources)

core_metrics

key text PRIMARY KEY  -- e.g., 'inference_accuracy'
description text NOT NULL
version text DEFAULT 'v1.0'
is_active boolean DEFAULT true
mapping_logic text NOT NULL
created_at timestamp with time zone DEFAULT now()

genres

id uuid PRIMARY KEY
name text NOT NULL UNIQUE  -- e.g., 'Philosophy', 'Economics'
description text
is_active boolean DEFAULT true

question_types

key text PRIMARY KEY  -- e.g., 'rc_question', 'para_jumble'
description text NOT NULL
is_active boolean DEFAULT true
created_at timestamp with time zone DEFAULT now()

reasoning_steps

key text PRIMARY KEY
label text NOT NULL
is_active boolean DEFAULT true
created_at timestamp with time zone DEFAULT now()

Note: The mapping JSON uses graph_nodes.id (UUIDs), not reasoning_steps.key


error_patterns

key text PRIMARY KEY  -- e.g., 'scope_shift', 'extreme_option'
description text NOT NULL
severity integer (1-5)
is_active boolean DEFAULT true
created_at timestamp with time zone DEFAULT now()

Output Tables (Where We Write)

user_metric_proficiency

Purpose: Atomic proficiency storage per dimension


Columns:


id uuid PRIMARY KEY
user_id uuid NOT NULL
dimension_type text CHECK (dimension_type IN ('core_metric', 'genre', 'question_type', 'reasoning_step', 'error_pattern'))
dimension_key text NOT NULL
proficiency_score integer CHECK (0 <= proficiency_score <= 100)
confidence_score numeric CHECK (0 <= confidence_score <= 1)
total_attempts integer DEFAULT 0
correct_attempts integer DEFAULT 0
last_session_id uuid
trend text CHECK (trend IN ('improving', 'declining', 'stagnant'))
updated_at timestamp with time zone DEFAULT now()
created_at timestamp with time zone DEFAULT now()

Unique Constraint: Should logically be on (user_id, dimension_type, dimension_key) but check schema


user_proficiency_signals

Purpose: Denormalized summary snapshot for UI


Columns:


id uuid PRIMARY KEY
user_id uuid NOT NULL UNIQUE
overall_percentile integer (0-100)
estimated_cat_percentile integer (0-100)
genre_strengths jsonb  -- e.g., {"Philosophy": 78, "Economics": 62}
inference_skill integer (0-100)
tone_analysis_skill integer (0-100)
main_idea_skill integer (0-100)
detail_comprehension_skill integer (0-100)
recommended_difficulty character varying
weak_topics text[]  -- e.g., ["Economics", "Science"]
weak_question_types text[]  -- e.g., ["para_jumble", "inference"]
calculated_at timestamp with time zone DEFAULT now()
data_points_count integer
created_at timestamp with time zone DEFAULT now()
updated_at timestamp with time zone DEFAULT now()


Configuration Files & Mappings

Core Metric Reasoning Map

File: services/config/core_metric_reasoning_map_v1.0.json


Structure:


{
  "version": "v1.0",
  "mapping_philosophy": "ReasoningStep-driven, batch-processed, deterministic",
  "metrics": {
    "inference_accuracy": {
      "metric_key": "inference_accuracy",
      "reasoning_steps": [
        {
          "node_id": "b1a9eb29-76f8-528b-a165-ce27a2a1dea0",
          "label": "Make inferences from text",
          "justification": "..."
        },
        ...
      ]
    },
    ...
  }
}

Usage:


Each metric_key maps to an array of reasoning_steps
Each reasoning step has a node_id (UUID) that matches graph_nodes.id
Build two indexes:
metricKeyToNodeIds: Map<string, Set<string>>
nodeIdToMetricKeys: Map<string, Set<string>>

Implementation:


// Load and index the mapping
function loadMetricMapping(json: any): {
  metricToNodes: Map<string, Set<string>>;
  nodeToMetrics: Map<string, Set<string>>;
} {
  const metricToNodes = new Map<string, Set<string>>();
  const nodeToMetrics = new Map<string, Set<string>>();

  for (const [metricKey, metricData] of Object.entries(json.metrics)) {
    const nodeIds = new Set<string>();

    for (const step of (metricData as any).reasoning_steps) {
      nodeIds.add(step.node_id);

      if (!nodeToMetrics.has(step.node_id)) {
        nodeToMetrics.set(step.node_id, new Set<string>());
      }
      nodeToMetrics.get(step.node_id)!.add(metricKey);
    }

    metricToNodes.set(metricKey, nodeIds);
  }

  return { metricToNodes, nodeToMetrics };
}

Core Metrics Definition

File: services/config/user_core_metrics_definition_v1.json


Structure:


{
  "version": "v1.0",
  "philosophy": "Metrics are cognition-first, exam-agnostic, and graph-derived",
  "metrics": [
    {
      "metric_key": "inference_accuracy",
      "derived_from": "Skill, Concept, ReasoningStep",
      "description": "Measures the ability to draw correct implicit conclusions...",
      "mapping_logic": "Aggregates performance on reasoning steps involving..."
    },
    ...
  ]
}

Usage:


Reference for metric definitions
Can be used for validation


Architecture & File Structure

New Files to Create

services/workers/varc-analytics/
├── runVarcAnalytics.ts              # Main orchestrator (exports main function)
├── types.ts                         # TypeScript types and Zod schemas
├── phases/
│   ├── phaseA_fetchSessionData.ts   # DB reads + dataset construction
│   ├── phaseB_computeSurfaceStats.ts # Quantitative aggregation
│   ├── phaseC_llmDiagnostics.ts     # LLM diagnostics for incorrect attempts
│   ├── phaseD_updateProficiency.ts  # Atomic proficiency updates
│   └── phaseE_rollupSignals.ts      # Summary rollup
├── utils/
│   ├── mapping.ts                   # Load & index metric mapping
│   ├── scoring.ts                   # Smoothing equations, confidence, trend
│   └── db.ts                        # Shared DB helpers if needed
└── README.md                        # Worker documentation

Bundle Script Update

Update services/scripts/bundle-edge-function.js to support multiple workers:


Add command-line argument for which worker to bundle
Or create bundle-varc-analytics.js as a copy


Pipeline Implementation (Phases A-E)

Phase A — Data Collection

File: services/workers/varc-analytics/phases/phaseA_fetchSessionData.ts


Purpose: Fetch all required data and construct in-memory dataset


Inputs:


session_id: string
user_id: string

Database Calls (in order):


Fetch and lock session row (idempotence check)

// NOTE: Supabase JS doesn't support SELECT FOR UPDATE directly
// Option 1: Use RPC function
// Option 2: Read + check is_analysed + use transaction semantics

const { data: session, error: sessionError } = await supabase
  .from('practice_sessions')
  .select('*')
  .eq('id', session_id)
  .eq('user_id', user_id)
  .single();

if (sessionError) throw new Error(`Session fetch failed: ${sessionError.message}`);

// Critical idempotence check
if (session.is_analysed) {
  console.log('⚠️ [Phase A] Session already analysed, skipping');
  return { alreadyAnalysed: true };
}

// Verify session is completed
if (session.status !== 'completed') {
  throw new Error(`Session status is '${session.status}', expected 'completed'`);
}

Fetch all attempts for this session

const { data: attempts, error: attemptsError } = await supabase
  .from('question_attempts')
  .select('*')
  .eq('session_id', session_id)
  .eq('user_id', user_id);

if (attemptsError) throw new Error(`Attempts fetch failed: ${attemptsError.message}`);

console.log(`📊 [Phase A] Fetched ${attempts.length} attempts`);

Fetch question metadata

const questionIds = [...new Set(attempts.map(a => a.question_id))];

const { data: questions, error: questionsError } = await supabase
  .from('questions')
  .select('id, question_type, tags, passage_id, question_text, options, correct_answer')
  .in('id', questionIds);

if (questionsError) throw new Error(`Questions fetch failed: ${questionsError.message}`);

// Build question lookup map
const questionMap = new Map(questions.map(q => [q.id, q]));

Fetch passage metadata (for genre)

const passageIds = [...new Set(attempts.map(a => a.passage_id).filter(Boolean))];

const { data: passages, error: passagesError } = await supabase
  .from('passages')
  .select('id, genre, word_count')
  .in('id', passageIds);

if (passagesError) throw new Error(`Passages fetch failed: ${passagesError.message}`);

// Build passage lookup map
const passageMap = new Map(passages.map(p => [p.id, p]));

Construct normalized dataset

type AttemptDatum = {
  attempt_id: string;
  question_id: string;
  passage_id: string | null;

  question_type: string;
  genre: string | null;

  correct: boolean;
  time_spent_seconds: number;
  confidence_level: number | null;

  eliminated_options: string[] | null;

  // Critical: reasoning step node IDs from question.tags
  reasoning_node_ids: string[];

  // For LLM diagnostics (Phase C)
  user_answer: any;
  question_text?: string;
  options?: any;
  correct_answer?: any;
};

const dataset: AttemptDatum[] = attempts.map(attempt => {
  const question = questionMap.get(attempt.question_id);
  const passage = attempt.passage_id ? passageMap.get(attempt.passage_id) : null;

  if (!question) {
    throw new Error(`Question ${attempt.question_id} not found`);
  }

  return {
    attempt_id: attempt.id,
    question_id: attempt.question_id,
    passage_id: attempt.passage_id,

    question_type: question.question_type,
    genre: passage?.genre || null,

    correct: attempt.is_correct,
    time_spent_seconds: attempt.time_spent_seconds,
    confidence_level: attempt.confidence_level,

    eliminated_options: attempt.eliminated_options,

    // Extract reasoning node IDs from question tags
    // ASSUMPTION: tags contains UUID strings matching graph_nodes.id
    reasoning_node_ids: question.tags || [],

    // For Phase C
    user_answer: attempt.user_answer,
    question_text: question.question_text,
    options: question.options,
    correct_answer: question.correct_answer,
  };
});

console.log(`✅ [Phase A] Constructed dataset with ${dataset.length} attempts`);

Outputs:


return {
  alreadyAnalysed: false,
  session,
  dataset,
  // Optional: pass along for context
  sessionMetadata: {
    session_id,
    user_id,
    completed_at: session.completed_at,
    session_type: session.session_type,
  }
};


Phase B — Quantitative Aggregation

File: services/workers/varc-analytics/phases/phaseB_computeSurfaceStats.ts


Purpose: Compute deterministic surface statistics per dimension


Inputs:


dataset: AttemptDatum[]
metricMapping: { metricToNodes, nodeToMetrics } (from utils/mapping.ts)

Implementation:


type DimensionStats = {
  attempts: number;
  correct: number;
  accuracy: number;
  avg_time: number;
  score_0_100: number;
};

type SurfaceStats = {
  core_metric: Map<string, DimensionStats>;
  genre: Map<string, DimensionStats>;
  question_type: Map<string, DimensionStats>;
  reasoning_step: Map<string, DimensionStats>;
};

export function computeSurfaceStats(
  dataset: AttemptDatum[],
  nodeToMetrics: Map<string, Set<string>>
): SurfaceStats {

  console.log('📊 [Phase B] Computing surface statistics');

  const stats: SurfaceStats = {
    core_metric: new Map(),
    genre: new Map(),
    question_type: new Map(),
    reasoning_step: new Map(),
  };

  // Helper to update stats
  function updateStats(map: Map<string, DimensionStats>, key: string, attempt: AttemptDatum) {
    if (!map.has(key)) {
      map.set(key, { attempts: 0, correct: 0, accuracy: 0, avg_time: 0, score_0_100: 0 });
    }
    const s = map.get(key)!;
    s.attempts += 1;
    s.correct += attempt.correct ? 1 : 0;
    s.avg_time += attempt.time_spent_seconds;
  }

  // Process each attempt
  for (const attempt of dataset) {

    // 1. Core metrics (via reasoning node mapping)
    for (const nodeId of attempt.reasoning_node_ids) {
      const metricKeys = nodeToMetrics.get(nodeId);
      if (metricKeys) {
        for (const metricKey of metricKeys) {
          updateStats(stats.core_metric, metricKey, attempt);
        }
      }
    }

    // 2. Genre
    if (attempt.genre) {
      updateStats(stats.genre, attempt.genre, attempt);
    }

    // 3. Question type
    updateStats(stats.question_type, attempt.question_type, attempt);

    // 4. Reasoning step (direct node ID)
    for (const nodeId of attempt.reasoning_node_ids) {
      updateStats(stats.reasoning_step, nodeId, attempt);
    }
  }

  // Finalize averages and scores
  function finalizeStats(map: Map<string, DimensionStats>) {
    for (const [key, s] of map.entries()) {
      if (s.attempts > 0) {
        s.accuracy = s.correct / s.attempts;
        s.avg_time = s.avg_time / s.attempts;
        s.score_0_100 = Math.round(s.accuracy * 100);
      }
    }
  }

  finalizeStats(stats.core_metric);
  finalizeStats(stats.genre);
  finalizeStats(stats.question_type);
  finalizeStats(stats.reasoning_step);

  console.log(`✅ [Phase B] Computed stats for:`);
  console.log(`   - Core metrics: ${stats.core_metric.size}`);
  console.log(`   - Genres: ${stats.genre.size}`);
  console.log(`   - Question types: ${stats.question_type.size}`);
  console.log(`   - Reasoning steps: ${stats.reasoning_step.size}`);

  return stats;
}

Outputs:


SurfaceStats object with all computed statistics


Phase C — LLM Diagnostics

File: services/workers/varc-analytics/phases/phaseC_llmDiagnostics.ts


Purpose: Use LLM to diagnose WHY incorrect attempts failed (qualitative analysis)


Inputs:


dataset: AttemptDatum[] (only incorrect ones)

Critical Constraints:


✅ LLM is ONLY used for diagnostics, NOT for scoring
✅ Process only incorrect attempts (attempt.correct === false)
✅ Return structured JSON output
✅ Store results in practice_sessions.session_data jsonb field

Implementation:


import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const client = new OpenAI();
const MODEL = "gpt-4o-mini";

// Define output schema
const DiagnosticResultSchema = z.object({
  attempt_id: z.string(),
  dominant_reasoning_failures: z.array(z.object({
    reasoning_node_id: z.string(),
    failure_description: z.string(),
  })),
  error_pattern_keys: z.array(z.string()),
  trap_analysis: z.string().optional(),
});

const DiagnosticsOutputSchema = z.object({
  diagnostics: z.array(DiagnosticResultSchema),
});

export async function runLLMDiagnostics(
  incorrectAttempts: AttemptDatum[]
): Promise<z.infer<typeof DiagnosticsOutputSchema>> {

  if (incorrectAttempts.length === 0) {
    console.log('ℹ️ [Phase C] No incorrect attempts to diagnose');
    return { diagnostics: [] };
  }

  console.log(`🧠 [Phase C] Diagnosing ${incorrectAttempts.length} incorrect attempts`);

  // Batch diagnostics (or process individually if needed)
  const prompt = `You are a CAT VARC diagnostic expert analyzing why a student got questions wrong.

For each incorrect attempt below, identify:
1. Which reasoning step(s) failed (use the reasoning_node_ids provided)
2. What error patterns were present (e.g., scope_shift, extreme_option, missed_negation)
3. A brief trap analysis

Output STRICT JSON only. Do NOT explain your reasoning, just output the structured analysis.

INCORRECT ATTEMPTS:
${JSON.stringify(incorrectAttempts.map(a => ({
  attempt_id: a.attempt_id,
  question_text: a.question_text,
  options: a.options,
  correct_answer: a.correct_answer,
  user_answer: a.user_answer,
  reasoning_node_ids: a.reasoning_node_ids,
  eliminated_options: a.eliminated_options,
})), null, 2)}

Return your analysis as a JSON object with a 'diagnostics' array.`;

  console.log('⏳ [Phase C] Waiting for LLM response (diagnostics)...');

  try {
    const completion = await client.chat.completions.parse({
      model: MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a diagnostic analyzer. You output only structured JSON with failure analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: zodResponseFormat(DiagnosticsOutputSchema, "diagnostics"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed) {
      throw new Error("LLM diagnostics parsing failed");
    }

    console.log(`✅ [Phase C] Generated diagnostics for ${parsed.diagnostics.length} attempts`);

    return parsed;

  } catch (error) {
    console.error('❌ [Phase C] LLM diagnostics failed:', error);
    // Return empty diagnostics on failure (don't block pipeline)
    return { diagnostics: [] };
  }
}

Storage of Diagnostics:
Store in practice_sessions.session_data under a consistent namespace:


// In main orchestrator after Phase C
const diagnosticsPayload = {
  varc_analytics: {
    version: 'v1.0',
    analyzed_at: new Date().toISOString(),
    diagnostics: diagnosticsResult.diagnostics,
  }
};

// Merge into existing session_data
const { error: updateError } = await supabase
  .from('practice_sessions')
  .update({
    session_data: {
      ...session.session_data,
      ...diagnosticsPayload,
    }
  })
  .eq('id', session_id);


Phase D — Proficiency Engine

File: services/workers/varc-analytics/phases/phaseD_updateProficiency.ts


Purpose: Update atomic proficiency scores using exponential smoothing


Inputs:


user_id: string
session_id: string
surfaceStats: SurfaceStats

Mathematical Formulas:


// Constants
const ALPHA = 0.2; // Base learning rate
const CONFIDENCE_THRESHOLD = 9; // Attempts needed for full confidence
const TREND_DELTA_THRESHOLD = 3; // Points for trend classification

// Confidence calculation
function calculateConfidence(attempts: number): number {
  return Math.min(1.0, Math.sqrt(attempts / CONFIDENCE_THRESHOLD));
}

// Proficiency smoothing
function calculateNewProficiency(
  oldProficiency: number,
  surfaceScore: number,
  confidence: number
): number {
  const learningWeight = ALPHA * confidence;
  const newProficiency =
    oldProficiency * (1 - learningWeight) +
    surfaceScore * learningWeight;

  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, Math.round(newProficiency)));
}

// Trend determination
function calculateTrend(
  oldProficiency: number,
  newProficiency: number
): 'improving' | 'declining' | 'stagnant' {
  const delta = newProficiency - oldProficiency;

  if (delta > TREND_DELTA_THRESHOLD) return 'improving';
  if (delta < -TREND_DELTA_THRESHOLD) return 'declining';
  return 'stagnant';
}

Implementation:


export async function updateProficiency(
  supabase: any,
  user_id: string,
  session_id: string,
  surfaceStats: SurfaceStats
) {

  console.log('🧮 [Phase D] Updating user_metric_proficiency');

  // Process each dimension type
  const dimensionTypes = [
    { type: 'core_metric', statsMap: surfaceStats.core_metric },
    { type: 'genre', statsMap: surfaceStats.genre },
    { type: 'question_type', statsMap: surfaceStats.question_type },
    { type: 'reasoning_step', statsMap: surfaceStats.reasoning_step },
  ];

  let updateCount = 0;

  for (const { type, statsMap } of dimensionTypes) {

    for (const [dimensionKey, stats] of statsMap.entries()) {

      // Fetch existing proficiency record
      const { data: existing, error: fetchError } = await supabase
        .from('user_metric_proficiency')
        .select('*')
        .eq('user_id', user_id)
        .eq('dimension_type', type)
        .eq('dimension_key', dimensionKey)
        .maybeSingle();

      if (fetchError) {
        console.error(`❌ [Phase D] Error fetching proficiency for ${type}:${dimensionKey}:`, fetchError);
        continue;
      }

      // Calculate confidence
      const totalAttempts = existing
        ? existing.total_attempts + stats.attempts
        : stats.attempts;

      const confidence = calculateConfidence(totalAttempts);

      // Calculate new proficiency
      const oldProficiency = existing ? existing.proficiency_score : 50; // Default 50 for new
      const newProficiency = calculateNewProficiency(
        oldProficiency,
        stats.score_0_100,
        confidence
      );

      // Calculate trend
      const trend = calculateTrend(oldProficiency, newProficiency);

      // Prepare update data
      const updateData = {
        user_id,
        dimension_type: type,
        dimension_key: dimensionKey,
        proficiency_score: newProficiency,
        confidence_score: confidence,
        total_attempts: totalAttempts,
        correct_attempts: (existing?.correct_attempts || 0) + stats.correct,
        last_session_id: session_id,
        trend,
        updated_at: new Date().toISOString(),
      };

      // Upsert (prefer upsert if unique constraint exists on user_id, dimension_type, dimension_key)
      const { error: upsertError } = await supabase
        .from('user_metric_proficiency')
        .upsert(updateData, {
          onConflict: 'user_id,dimension_type,dimension_key',
        });

      if (upsertError) {
        console.error(`❌ [Phase D] Error upserting proficiency for ${type}:${dimensionKey}:`, upsertError);
        continue;
      }

      updateCount++;
    }
  }

  console.log(`✅ [Phase D] Updated ${updateCount} proficiency records`);
}

Important Notes:


Unique Constraint: The code assumes a unique constraint on (user_id, dimension_type, dimension_key). If it doesn't exist in the DB, the upsert will fail. Alternative: use conditional insert/update logic.

Idempotence: Check last_session_id to prevent double-counting:


// Add this check before updating
if (existing && existing.last_session_id === session_id) {
  console.log(`⚠️ [Phase D] ${type}:${dimensionKey} already updated for this session, skipping`);
  continue;
}


Phase E — Summary Rollup

File: services/workers/varc-analytics/phases/phaseE_rollupSignals.ts


Purpose: Create denormalized summary in user_proficiency_signals


Inputs:


user_id: string
Reads from user_metric_proficiency

Implementation:


export async function rollupSignals(
  supabase: any,
  user_id: string
) {

  console.log('📦 [Phase E] Rolling up user_proficiency_signals');

  // Fetch all proficiency records for this user
  const { data: proficiencies, error: fetchError } = await supabase
    .from('user_metric_proficiency')
    .select('*')
    .eq('user_id', user_id);

  if (fetchError) {
    throw new Error(`Error fetching proficiencies: ${fetchError.message}`);
  }

  console.log(`📊 [Phase E] Processing ${proficiencies.length} proficiency records`);

  // Group by dimension_type
  const byType = {
    core_metric: proficiencies.filter(p => p.dimension_type === 'core_metric'),
    genre: proficiencies.filter(p => p.dimension_type === 'genre'),
    question_type: proficiencies.filter(p => p.dimension_type === 'question_type'),
  };

  // 1. Build genre_strengths JSON
  const genre_strengths: Record<string, number> = {};
  for (const g of byType.genre) {
    genre_strengths[g.dimension_key] = g.proficiency_score;
  }

  // 2. Find weak topics (bottom 3 genres by score)
  const weak_topics = byType.genre
    .sort((a, b) => a.proficiency_score - b.proficiency_score)
    .slice(0, 3)
    .map(g => g.dimension_key);

  // 3. Find weak question types
  const weak_question_types = byType.question_type
    .sort((a, b) => a.proficiency_score - b.proficiency_score)
    .slice(0, 3)
    .map(q => q.dimension_key);

  // 4. Map core metrics to specific skills
  const coreMetricMap: Record<string, string> = {
    'inference_accuracy': 'inference_skill',
    'tone_and_intent_sensitivity': 'tone_analysis_skill',
    'detail_vs_structure_balance': 'main_idea_skill',
    'evidence_evaluation': 'detail_comprehension_skill',
  };

  const skillScores: Record<string, number> = {};
  for (const cm of byType.core_metric) {
    const skillKey = coreMetricMap[cm.dimension_key];
    if (skillKey) {
      skillScores[skillKey] = cm.proficiency_score;
    }
  }

  // 5. Calculate overall proficiency (average of core metrics)
  const overall = byType.core_metric.length > 0
    ? Math.round(
        byType.core_metric.reduce((sum, cm) => sum + cm.proficiency_score, 0) /
        byType.core_metric.length
      )
    : null;

  // 6. Determine recommended difficulty
  let recommended_difficulty = 'medium';
  if (overall !== null) {
    if (overall >= 75) recommended_difficulty = 'hard';
    else if (overall >= 50) recommended_difficulty = 'medium';
    else recommended_difficulty = 'easy';
  }

  // 7. Prepare summary record
  const signalData = {
    user_id,
    overall_percentile: null, // TODO: requires population comparison
    estimated_cat_percentile: null, // TODO: requires calibration model
    genre_strengths: genre_strengths,
    inference_skill: skillScores['inference_skill'] || null,
    tone_analysis_skill: skillScores['tone_analysis_skill'] || null,
    main_idea_skill: skillScores['main_idea_skill'] || null,
    detail_comprehension_skill: skillScores['detail_comprehension_skill'] || null,
    recommended_difficulty,
    weak_topics,
    weak_question_types,
    calculated_at: new Date().toISOString(),
    data_points_count: proficiencies.length,
    updated_at: new Date().toISOString(),
  };

  // 8. Upsert into user_proficiency_signals
  const { error: upsertError } = await supabase
    .from('user_proficiency_signals')
    .upsert(signalData, {
      onConflict: 'user_id',
    });

  if (upsertError) {
    throw new Error(`Error upserting proficiency signals: ${upsertError.message}`);
  }

  console.log('✅ [Phase E] Proficiency signals updated successfully');
  console.log(`   - Overall: ${overall}`);
  console.log(`   - Recommended difficulty: ${recommended_difficulty}`);
  console.log(`   - Weak topics: ${weak_topics.join(', ')}`);
}


Main Orchestrator

File: services/workers/varc-analytics/runVarcAnalytics.ts


Purpose: Main entry point that orchestrates all phases


Implementation:


import { supabase } from "../../config/supabase";
import { phaseA_fetchSessionData } from "./phases/phaseA_fetchSessionData";
import { phaseB_computeSurfaceStats } from "./phases/phaseB_computeSurfaceStats";
import { phaseC_llmDiagnostics } from "./phases/phaseC_llmDiagnostics";
import { phaseD_updateProficiency } from "./phases/phaseD_updateProficiency";
import { phaseE_rollupSignals } from "./phases/phaseE_rollupSignals";
import { loadMetricMapping } from "./utils/mapping";

// Import mapping JSON
import metricMappingJson from "../../config/core_metric_reasoning_map_v1.0.json";

export async function runVarcAnalytics(params: {
  session_id: string;
  user_id: string;
}) {

  const { session_id, user_id } = params;

  console.log("🚀 [START] VARC Analytics session analysis");
  console.log(`   Session ID: ${session_id}`);
  console.log(`   User ID: ${user_id}`);

  try {

    // --- PHASE A: DATA COLLECTION ---
    console.log("\n📥 [Phase A/5] Fetching session data");
    const phaseAResult = await phaseA_fetchSessionData(supabase, session_id, user_id);

    // Check if already analysed
    if (phaseAResult.alreadyAnalysed) {
      console.log("✅ [COMPLETE] Session already analysed, no action needed");
      return { success: true, message: "Already analysed" };
    }

    const { dataset, session } = phaseAResult;
    console.log(`   - Dataset size: ${dataset.length} attempts`);

    // Load metric mapping
    const metricMapping = loadMetricMapping(metricMappingJson);
    console.log(`   - Loaded mapping: ${metricMapping.metricToNodes.size} metrics`);

    // --- PHASE B: QUANTITATIVE AGGREGATION ---
    console.log("\n📊 [Phase B/5] Computing surface statistics");
    const surfaceStats = phaseB_computeSurfaceStats(dataset, metricMapping.nodeToMetrics);

    // --- PHASE C: LLM DIAGNOSTICS ---
    console.log("\n🧠 [Phase C/5] Running LLM diagnostics on incorrect attempts");
    const incorrectAttempts = dataset.filter(a => !a.correct);
    console.log(`   - Incorrect attempts: ${incorrectAttempts.length}`);

    const diagnostics = await phaseC_llmDiagnostics(incorrectAttempts);

    // Store diagnostics in session_data
    if (diagnostics.diagnostics.length > 0) {
      const { error: diagError } = await supabase
        .from('practice_sessions')
        .update({
          session_data: {
            ...(session.session_data || {}),
            varc_analytics: {
              version: 'v1.0',
              analyzed_at: new Date().toISOString(),
              diagnostics: diagnostics.diagnostics,
            }
          }
        })
        .eq('id', session_id);

      if (diagError) {
        console.error('⚠️ [Phase C] Failed to store diagnostics:', diagError.message);
        // Don't fail pipeline
      } else {
        console.log('   - Diagnostics stored in session_data');
      }
    }

    // --- PHASE D: PROFICIENCY ENGINE ---
    console.log("\n🧮 [Phase D/5] Updating atomic proficiency scores");
    await phaseD_updateProficiency(supabase, user_id, session_id, surfaceStats);

    // --- PHASE E: SUMMARY ROLLUP ---
    console.log("\n📦 [Phase E/5] Rolling up proficiency signals");
    await phaseE_rollupSignals(supabase, user_id);

    // --- FINALIZATION: MARK AS ANALYSED ---
    console.log("\n🔒 [Finalization] Marking session as analysed");
    const { error: finalError } = await supabase
      .from('practice_sessions')
      .update({
        is_analysed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (finalError) {
      throw new Error(`Failed to mark session as analysed: ${finalError.message}`);
    }

    console.log("\n✅ [COMPLETE] VARC Analytics finished successfully");
    console.log(`   - Total attempts processed: ${dataset.length}`);
    console.log(`   - Core metrics updated: ${surfaceStats.core_metric.size}`);
    console.log(`   - Genres updated: ${surfaceStats.genre.size}`);
    console.log(`   - Question types updated: ${surfaceStats.question_type.size}`);

    return {
      success: true,
      session_id,
      user_id,
      stats: {
        total_attempts: dataset.length,
        correct_attempts: dataset.filter(a => a.correct).length,
        dimensions_updated: {
          core_metrics: surfaceStats.core_metric.size,
          genres: surfaceStats.genre.size,
          question_types: surfaceStats.question_type.size,
        }
      }
    };

  } catch (error) {
    console.error("\n❌ [ERROR] VARC Analytics failed:");
    console.error(error);
    throw error;
  }
}


Idempotence & Error Handling

Idempotence Strategy

Multiple layers of protection:


Trigger-side filter (database trigger)

Only fires when status = 'completed' AND is_analysed = false
Edge function early return (Phase A)

Re-checks is_analysed after fetching session
Returns immediately if already analysed
Session-level sentinel (Finalization)

Only set is_analysed = true after ALL phases succeed
Atomic update at the very end
Dimension-level sentinel (Phase D)

Check last_session_id before updating proficiency
Skip if already updated for this session

Error Handling Rules

Phase C (LLM) failures:


✅ Do NOT block pipeline
✅ Log error and continue
✅ Store empty diagnostics
Rationale: Quantitative analysis is more critical

Phase D/E (DB) failures:


❌ DO block pipeline
❌ Do NOT mark is_analysed = true
❌ Throw error and allow retry
Rationale: Proficiency data must be consistent

Partial completion:
If any critical phase fails, the session remains is_analysed = false and can be retried.



Logging Standards

Follow Daily-Content Pattern

Use emoji prefixes:


🚀 START/END markers
📥 Data fetching
📊 Computation/stats
🧠 LLM operations
🧮 Proficiency calculations
📦 Rollup/aggregation
🔒 Locks/idempotence checks
✅ Success
❌ Errors
⚠️ Warnings
⏳ Waiting (especially before LLM calls)

Examples:


console.log("🚀 [START] VARC Analytics session analysis");
console.log("📥 [Phase A] Fetching session data");
console.log("⏳ [Phase C] Waiting for LLM response (diagnostics)...");
console.log("🧮 [Phase D] Updating user_metric_proficiency");
console.log("✅ [COMPLETE] VARC Analytics finished successfully");
console.log("❌ [ERROR] Phase D failed: " + error.message);


Testing & Validation

Essential Tests Before Deployment

Unit Tests (Math Functions)

✓ calculateConfidence(9) === 1.0
✓ calculateConfidence(4) ≈ 0.67
✓ calculateNewProficiency(50, 80, 1.0) === 56
✓ calculateTrend(50, 54) === 'improving'

Integration Test (Full Pipeline)

✓ Run on completed session
✓ Verify is_analysed set to true
✓ Check user_metric_proficiency records created/updated
✓ Check user_proficiency_signals updated
✓ Verify diagnostics stored in session_data
✓ Run again on same session → should skip (idempotent)
```
