-- =============================================================================
-- Phase 3: Persona Forum — Schema Migration
-- =============================================================================
-- IDEMPOTENT: Safe to run multiple times.
-- NOTE: User runs this manually — NOT auto-executed.
--
-- Creates:
--   1. forum_threads — topic sessions for forum posts
--   2. forum_posts — AEO-optimized micro-articles from the persona
--   3. persona_state — single-row heartbeat-managed persona state
-- =============================================================================

-- 1. Forum threads (topic sessions)
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    seo_description TEXT,
    schema_type VARCHAR(50) DEFAULT 'BlogPosting',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Forum posts (AEO-optimized micro-articles)
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood VARCHAR(100),
    answer_summary TEXT,
    tags TEXT[],
    target_query TEXT,
    persona_state_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Persona state (single row, heartbeat-managed)
CREATE TABLE IF NOT EXISTS persona_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_mood VARCHAR(100) DEFAULT 'caffeinated',
    mood_history JSONB DEFAULT '[]'::jsonb,
    topics_covered TEXT[] DEFAULT '{}',
    last_heartbeat_at TIMESTAMPTZ,
    heartbeat_count INTEGER DEFAULT 0,
    creative_seed INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Forum posts by thread (for loading thread posts)
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_id
ON forum_posts (thread_id);

-- Forum posts by creation date (for feed ordering)
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at
ON forum_posts (created_at DESC);

-- Forum posts by mood (for filtering)
CREATE INDEX IF NOT EXISTS idx_forum_posts_mood
ON forum_posts (mood);

-- Forum threads by slug (for URL lookups)
CREATE INDEX IF NOT EXISTS idx_forum_threads_slug
ON forum_threads (slug);

-- Forum posts target_query for dedup checks
CREATE INDEX IF NOT EXISTS idx_forum_posts_target_query
ON forum_posts USING hash (target_query);

-- =============================================================================
-- Seed persona_state with initial row
-- =============================================================================
INSERT INTO persona_state (id, current_mood, heartbeat_count, creative_seed)
SELECT gen_random_uuid(), 'caffeinated', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM persona_state LIMIT 1);
