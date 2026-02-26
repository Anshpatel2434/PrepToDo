-- =============================================================================
-- Phase 4.5: Forum Reactions + DB Logs Migration
-- =============================================================================
-- IDEMPOTENT: Safe to run multiple times.
-- Run AFTER migration_phase3_persona_forum.sql
-- =============================================================================

-- 1. Add likes/dislikes counters to forum_posts
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- 2. Add post_type to forum_posts (blog/faq/howto)
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(20) DEFAULT 'blog';

-- 3. Forum reactions table (one reaction per user per post)
CREATE TABLE IF NOT EXISTS forum_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction VARCHAR(10) NOT NULL CHECK (reaction IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_reactions_post_id ON forum_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_user_id ON forum_reactions(user_id);

-- 4. Add daily_logs JSONB column to persona_state (replaces filesystem logs)
ALTER TABLE persona_state ADD COLUMN IF NOT EXISTS daily_logs JSONB DEFAULT '[]';
