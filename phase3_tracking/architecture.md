# Phase 3: Architecture & Safety Design

## System Data Flow

```
Cron Job → POST /api/persona-forum/heartbeat (admin auth)
    → runPersonaHeartbeat.ts
        → [WAKE]  SELECT * FROM persona_state LIMIT 1
        → [CHECK]  Read topics_covered, heartbeat_count, creative_seed
        → [REASON] moodEngine.generateMoodProfile(seed, date) → MoodProfile
                    topicEngine.selectTopic(seed, count, covered, season) → TopicSelection
        → [ACT]    gatherStudentContext() → StudentContext (anonymous aggregate SQL)
                    buildPersonaPrompt(mood, topic, context) → { systemMessage, userMessage, temperature }
                    openai.chat.completions.create(GPT-4o-mini) → JSON response
        → [MAINTAIN] INSERT forum_post, UPDATE persona_state, APPEND daily log .md
        → [SLEEP]  Log HEARTBEAT_OK, return { success, postId }
```

## Cost Safety Analysis

| Concern | Safeguard | Location |
|---|---|---|
| Runaway token costs | `max_tokens: 1500` hard cap per call | `runPersonaHeartbeat.ts:119` |
| Rapid-fire calls | 15-minute cooldown between heartbeats | `runPersonaHeartbeat.ts:72-79` |
| Daily cost explosion | Max 10 posts per day hard cap | `runPersonaHeartbeat.ts:82-90` |
| Multiple calls per heartbeat | Only 1 GPT call per heartbeat — no retries, no loops | `runPersonaHeartbeat.ts` (single await) |
| Accidental infinite cron | Heartbeat is stateless fire-and-forget + cooldown rejects duplicates | `runPersonaHeartbeat.ts` |
| Mood history memory leak | `mood_history` capped at last 50 entries via `.slice(-50)` | `runPersonaHeartbeat.ts` |
| Topics memory growth | `topics_covered` grows linearly (one string per heartbeat). At 1 post/day = 365 entries/year = negligible | `topicEngine.ts` |
| Missing DB tables | All optional queries wrapped in try/catch with fallback defaults | `gatherStudentContext.ts` |
| GPT returns garbage | `response_format: { type: 'json_object' }` enforces valid JSON. Parse error caught in outer try/catch | `runPersonaHeartbeat.ts` |
| No persona_state row | Throws descriptive error "Run the Phase 3 migration first" | `runPersonaHeartbeat.ts` |
| Hardcoded template repetition | Templates REMOVED — LLM generates behaviors freely from SOUL.md + behavior category | `moodEngine.ts`, `buildPersonaPrompt.ts` |

## Key Invariants
1. **One GPT call per heartbeat** — never more, never looped
2. **One heartbeat per endpoint hit** — no internal scheduling, no setInterval
3. **No student PII in outputs** — enforced in SOUL.md, prompt instructions, and context layer
4. **Topics never repeat** until bank exhausted (60+ queries = 2+ months at daily pace)
5. **CJS module system** — all files use `process.cwd()` not `import.meta.url`

## File Dependency Graph
```
index.ts
  └── features/persona-forum/persona-forum.routes.ts
        └── workers/persona-forum/runPersonaHeartbeat.ts
              ├── prompts/moodEngine.ts (pure, no I/O)
              ├── prompts/topicEngine.ts (pure, no I/O)
              ├── prompts/buildPersonaPrompt.ts (reads SOUL.md, MEMORY.md from disk)
              ├── context/gatherStudentContext.ts (DB queries only)
              ├── config/openai.ts (shared singleton)
              └── db/tables.ts (Drizzle schema)
```

## DB Schema Quick Reference
```sql
forum_threads: id UUID, title, slug UNIQUE, category, seo_description, schema_type, created_at
forum_posts: id UUID, thread_id FK, content, mood, answer_summary, tags[], target_query, persona_state_snapshot JSONB, created_at
persona_state: id UUID, current_mood, mood_history JSONB, topics_covered TEXT[], last_heartbeat_at, heartbeat_count INT, creative_seed INT, updated_at
```

## Important Gotchas for Future Developers
1. `tables.ts` uses `ps.jsonb()` (aliased postgres schema) not `jsonb()` directly
2. The project is CommonJS — `tsconfig.json` compiles to CJS. Do NOT use ESM features
3. `forumThreads.slug` is `varchar(255)` with a UNIQUE constraint — thread slugs must be unique
4. `gatherStudentContext` returns fallback zeros if DB queries fail — posts will still generate
5. The `creative_seed` is just a counter (0, 1, 2, ...) — used with prime multipliers in moodEngine for pseudo-random selection. It's NOT a random seed
6. Daily log files are written to `{cwd}/src/workers/persona-forum/memory/daily/YYYY-MM-DD.md` with append mode
