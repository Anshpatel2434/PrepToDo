-- ============================================================
-- PrepToDo Database Cleanup Script
-- Purpose: Remove unused tables from the public schema
-- Run this in Neon SQL Editor
-- ============================================================
-- 
-- TABLES BEING KEPT (16 tables used by app or DB functions):
--   articles, embeddings, exam_generation_state, exam_papers, 
--   genres, graph_edges, graph_nodes, passages, practice_sessions,
--   question_attempts, questions, theory_chunks, user_analytics,
--   user_metric_proficiency, user_proficiency_signals, user_profiles
--
-- TABLES BEING DELETED (19 unused tables):
--   content_appeals, content_review_queue, core_metrics, 
--   daily_challenges, error_patterns, feature_flags, 
--   generation_cache, group_chat_messages, leaderboard_entries, 
--   peer_challenges, question_types, reasoning_steps, 
--   social_activity_feed, study_group_members, study_groups, 
--   system_metrics, user_vocab_progress, vocab_entries
-- ============================================================

-- STEP 1: Disable triggers to avoid constraint issues during deletion
SET session_replication_role = 'replica';

-- STEP 2: Drop tables in order (respecting foreign key dependencies)
-- Note: CASCADE ensures dependent objects are also dropped

-- Independent tables (no dependencies)
DROP TABLE IF EXISTS public.content_review_queue CASCADE;
DROP TABLE IF EXISTS public.daily_challenges CASCADE;
DROP TABLE IF EXISTS public.error_patterns CASCADE;
DROP TABLE IF EXISTS public.feature_flags CASCADE;
DROP TABLE IF EXISTS public.generation_cache CASCADE;
DROP TABLE IF EXISTS public.reasoning_steps CASCADE;
DROP TABLE IF EXISTS public.system_metrics CASCADE;

-- Social feature tables (study groups have members → messages chain)
DROP TABLE IF EXISTS public.group_chat_messages CASCADE;
DROP TABLE IF EXISTS public.social_activity_feed CASCADE;
DROP TABLE IF EXISTS public.study_group_members CASCADE;
DROP TABLE IF EXISTS public.study_groups CASCADE;

-- Challenge/leaderboard tables
DROP TABLE IF EXISTS public.peer_challenges CASCADE;
DROP TABLE IF EXISTS public.leaderboard_entries CASCADE;

-- Content appeal system
DROP TABLE IF EXISTS public.content_appeals CASCADE;

-- Vocabulary system (user_vocab_progress depends on vocab_entries)
DROP TABLE IF EXISTS public.user_vocab_progress CASCADE;
DROP TABLE IF EXISTS public.vocab_entries CASCADE;

-- STEP 3: Re-enable triggers
SET session_replication_role = 'origin';

-- STEP 4: Verify remaining tables (should show 16 tables)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected output:
-- articles
-- embeddings
-- exam_generation_state
-- exam_papers
-- genres
-- graph_edges
-- graph_nodes
-- passages
-- practice_sessions
-- question_attempts
-- questions
-- theory_chunks
-- user_analytics
-- user_metric_proficiency
-- user_proficiency_signals
-- user_profiles
