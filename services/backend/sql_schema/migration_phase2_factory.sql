-- =============================================================================
-- Phase 2: Reasoning Intelligence (The Factory) — Migration Script
-- =============================================================================
-- Run this script in the Supabase SQL Editor.
-- It is idempotent: safe to run multiple times without side effects.
--
-- Purpose:
--   1. Add a tracking column to questions for reasoning extraction
--   2. Create indexes for efficient graph edge traversal
--   3. Add composite indexes for hard-cap enforcement queries
-- =============================================================================

-- 1. Add reasoning_summary_extracted_at to questions for dedup tracking.
--    This prevents the same rationale from being re-analyzed by the
--    extractReasoningSummaries pipeline.
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS reasoning_summary_extracted_at TIMESTAMP WITH TIME ZONE;

-- 2. Index for efficient edge traversal by relationship type
--    Used by createErrorPatternEdges and enforceGraphCaps.
CREATE INDEX IF NOT EXISTS idx_graph_edges_relationship
ON graph_edges (relationship);

-- 3. Composite index for edge cap enforcement queries
--    Allows fast "count edges per source node by relationship" queries.
CREATE INDEX IF NOT EXISTS idx_graph_edges_source_relationship
ON graph_edges (source_node_id, relationship);

-- 4. Index for graph_nodes type filtering
--    Used by extractReasoningSummaries to find existing ReasoningStep nodes.
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type
ON graph_nodes (type);

-- 5. Index for tracking which questions have been processed
CREATE INDEX IF NOT EXISTS idx_questions_reasoning_extracted
ON questions (reasoning_summary_extracted_at)
WHERE reasoning_summary_extracted_at IS NULL;

-- 6. Index for error pattern analysis (wrong answers grouped by question)
CREATE INDEX IF NOT EXISTS idx_question_attempts_incorrect
ON question_attempts (question_id, is_correct)
WHERE is_correct = false;

-- =============================================================================
-- Migration Complete.
-- Next: Run `npx tsc --noEmit` in services/backend/ to verify Drizzle types.
-- =============================================================================
