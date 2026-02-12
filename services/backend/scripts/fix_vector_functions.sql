-- =============================================================================
-- Fix Vector Dimensions for Search Functions
-- =============================================================================
-- This script updates the vector search functions to robustly handle possible
-- mixed-dimension vectors by using a MATERIALIZED CTE to filter before
-- distance calculation. It also includes a check query at the end.

-- 0. Ensure the vector extension is available
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Drop old functions to avoid conflicts
DROP FUNCTION IF EXISTS search_passage_embeddings(vector, int);
DROP FUNCTION IF EXISTS search_passage_embeddings(vector(384), int);
DROP FUNCTION IF EXISTS search_passage_embeddings(vector(1536), int);

DROP FUNCTION IF EXISTS search_question_embeddings_by_type(vector, int);
DROP FUNCTION IF EXISTS search_question_embeddings_by_type(vector(384), int);
DROP FUNCTION IF EXISTS search_question_embeddings_by_type(vector(1536), int);


-- 2. search_passage_embeddings (Using MATERIALIZED CTE to force filtering order)
CREATE OR REPLACE FUNCTION search_passage_embeddings(
    query_embedding vector(1536),
    match_count int
)
RETURNS TABLE (
    passage_id uuid,
    score double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_embeddings AS MATERIALIZED (
        SELECT
            e.passage_id,
            e.embedding
        FROM embeddings e
        WHERE e.passage_id IS NOT NULL
          AND vector_dims(e.embedding) = 1536
    )
    SELECT
        fe.passage_id,
        (fe.embedding <-> query_embedding) AS score
    FROM filtered_embeddings fe
    ORDER BY fe.embedding <-> query_embedding
    LIMIT match_count;
END;
$$;

-- 3. search_question_embeddings_by_type (Using MATERIALIZED CTE)
CREATE OR REPLACE FUNCTION search_question_embeddings_by_type(
    query_embedding vector(1536),
    match_per_type int
)
RETURNS TABLE (
    question_type varchar,
    question_id uuid,
    score double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_embeddings AS MATERIALIZED (
        SELECT
            e.question_id,
            e.embedding
        FROM embeddings e
        WHERE e.question_id IS NOT NULL
          AND vector_dims(e.embedding) = 1536
    ),
    ranked_questions AS (
        SELECT
            q.question_type,
            q.id AS question_id,
            (fe.embedding <-> query_embedding) AS score,
            ROW_NUMBER() OVER (
                PARTITION BY q.question_type
                ORDER BY fe.embedding <-> query_embedding
            ) AS rn
        FROM filtered_embeddings fe
        JOIN questions q ON q.id = fe.question_id
        WHERE q.question_type IN (
            'para_summary',
            'para_completion',
            'para_jumble',
            'odd_one_out'
          )
    )
    SELECT
        rq.question_type::varchar,
        rq.question_id,
        rq.score
    FROM ranked_questions rq
    WHERE rq.rn <= match_per_type
    ORDER BY rq.question_type, rq.score;
END;
$$;

-- 4. Diagnostic Query: Check for mis-dimensioned vectors
-- Run this manually if you suspect data corruption.
-- SELECT count(*) as bad_dimension_count, vector_dims(embedding) as dims FROM embeddings GROUP BY vector_dims(embedding);
