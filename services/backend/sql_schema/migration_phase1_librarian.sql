-- =============================================================================
-- Phase 1: Knowledge Foundation (The Librarian) — Migration Script
-- =============================================================================
-- Run this script in the Supabase SQL Editor.
-- It is idempotent: safe to run multiple times without side effects.
-- =============================================================================

-- 1. Add semantic_hash column to theory_chunks for deduplication
--    Mirrors the existing articles.semantic_hash pattern.
ALTER TABLE theory_chunks
ADD COLUMN IF NOT EXISTS semantic_hash TEXT;

-- 2. Create unique index on semantic_hash for fast dedup lookups
--    Partial index: only indexes non-null hashes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_theory_chunks_semantic_hash
ON theory_chunks (semantic_hash)
WHERE semantic_hash IS NOT NULL;

-- 3. Ensure topic/sub_topic indexes exist for efficient ontology queries
CREATE INDEX IF NOT EXISTS idx_theory_chunks_topic
ON theory_chunks (topic);

CREATE INDEX IF NOT EXISTS idx_theory_chunks_sub_topic
ON theory_chunks (sub_topic);

-- 4. Add graph_nodes type constraint to enforce canonical ontology types
--    Types per Blueprint: Concept, Skill, Strategy, ReasoningStep, ErrorPattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'graph_nodes_type_check'
  ) THEN
    ALTER TABLE graph_nodes
    ADD CONSTRAINT graph_nodes_type_check
    CHECK (type IN (
      'Concept', 'Skill', 'Strategy',
      'ReasoningStep', 'ErrorPattern'
    ));
  END IF;
END $$;

-- 5. Verify existing constraints are intact
-- The embeddings table should already have the one_target_only constraint.
-- This SELECT will fail silently if it doesn't exist (informational only).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'one_target_only'
  ) THEN
    RAISE NOTICE 'WARNING: one_target_only constraint missing on embeddings table!';
    RAISE NOTICE 'Expected: CHECK (((theory_id IS NOT NULL)::int + (passage_id IS NOT NULL)::int + (question_id IS NOT NULL)::int) = 1)';
  ELSE
    RAISE NOTICE 'OK: one_target_only constraint verified on embeddings table.';
  END IF;
END $$;

-- =============================================================================
-- Migration Complete. 
-- Next: Run `npx tsc --noEmit` in services/backend/ to verify Drizzle types.
-- =============================================================================
