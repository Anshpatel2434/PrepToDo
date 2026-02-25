# Phase 3: What's Been Completed

## Source Documents (Goldmine)
All requirements came from `goldmine/extracted_texts/`:
- `Technical Architecture Master Blueprint.txt` — Heartbeat Engine L209-238, S-I-O L252-261, 3-layer memory L242-251
- `AI Tutor Persona Forum Design and Implementation Plan.txt` — Runner, mood_variable, forum structure
- `AI Persona Creation and Forum Architecture.txt` — CASA framework, anthropomorphic personality, temperature modulation
- `AI Article Automation Plan.txt` — AEO/Missing Middle, Answer-First architecture, Schema.org, content phases
- `Reddit_AEO_strategy.txt` — 30-day content plan, expert angle rule, programmatic scaling

## DB Schema (NOT YET MIGRATED — user runs manually)
- `services/backend/sql_schema/migration_phase3_persona_forum.sql`
  - `forum_threads` (id, title, slug, category, seo_description, schema_type)
  - `forum_posts` (id, thread_id FK, content, mood, answer_summary, tags[], target_query, persona_state_snapshot jsonb)
  - `persona_state` (single row: current_mood, mood_history jsonb, topics_covered text[], heartbeat_count, creative_seed)
  - Seeds one initial persona_state row

## Drizzle ORM
- `services/backend/src/db/tables.ts` — Added `forumThreads`, `forumPosts`, `personaState` tables + type exports
- `services/backend/src/db/relations.ts` — Added `forumThreadsRelations`, `forumPostsRelations`

## 3-Layer Markdown Memory
- `services/backend/src/workers/persona-forum/memory/SOUL.md` — Persona identity definition
- `services/backend/src/workers/persona-forum/memory/MEMORY.md` — Long-term memory (starts empty, populated by heartbeat)
- `services/backend/src/workers/persona-forum/memory/daily/` — Daily raw logs directory

## Engines
- `workers/persona-forum/prompts/moodEngine.ts`
  - 5 mood dimensions: Energy(8) × Stance(8) × Expertise(7) × Narrative(8) × Lens(6) = 21,504 combos
  - 4 embodied behavior template categories (Physical, Social, Emotional, Meta) ~10 templates each
  - Seasonal detection (mock-season, exam-countdown, result-day, new-batch, regular)
  - Temperature modulation: creative stances → 0.9, analytical → 0.5
- `workers/persona-forum/prompts/topicEngine.ts`
  - 60+ curated Missing Middle queries across 4 categories (RC, VA, Strategy, Mindset)
  - 30-day content phase rotation (standard-setting → problem-solver → comparison → lifestyle)
  - Topic dedup via `topicsCovered` from persona_state
- `workers/persona-forum/prompts/buildPersonaPrompt.ts`
  - S-I-O framework: Setup (SOUL.md) → Instruction (mood + topic + student data) → Output (JSON format)
  - Reads SOUL.md and MEMORY.md from disk using `process.cwd()` resolution
  - Fills embodied behavior templates with real platform data
  - Output format: `{ seo_title, answer_summary, content, mood_after, tags, slug }`

## Data Layer
- `workers/persona-forum/context/gatherStudentContext.ts`
  - Anonymous aggregate data only (NO student names)
  - Queries: total attempts today, top score, average accuracy, longest streak, most failed metric, trap hit rate, active user count
  - Gracefully handles missing tables (user_streaks, user_metric_proficiency)

## Heartbeat Runner
- `workers/persona-forum/runPersonaHeartbeat.ts`
  - Full cycle: Wake → Check → Reason → Act → Maintain → Sleep
  - Calls GPT-4o-mini with `response_format: { type: 'json_object' }` and `max_tokens: 1500`
  - Creates/reuses forum threads (one per category per day)
  - Saves post, updates persona_state (mood_history capped at 50), writes daily log
  - Returns `{ success, postId }`

## API Endpoint
- `features/persona-forum/persona-forum.routes.ts`
  - `GET /api/persona-forum/feed` — Latest 20 posts (public, SEO-crawlable)
  - `GET /api/persona-forum/thread/:slug` — Thread with posts by slug
  - `POST /api/persona-forum/heartbeat` — Trigger heartbeat (admin-only)
- Registered in `src/index.ts` via `personaForumRouter`

## Key Design Decisions
1. **No student names in posts** — all references anonymous ("one of you", "someone here")
2. **Separate endpoint, NOT in runDailyTasks.ts** — user manages cron independently
3. **GPT-4o-mini** for cost efficiency — ~$0.15-0.30/million input tokens with caching
4. **CJS compatibility** — project uses CommonJS, so `process.cwd()` instead of `import.meta.url`
5. **Persona called "PrepToDo's tutor"** — no fixed character name
6. **ReasoningSummary type consolidated to ReasoningStep** — done in Phase 2 cleanup (before Phase 3)

## Verification
- `npx tsc --noEmit` — passes clean (0 errors)
