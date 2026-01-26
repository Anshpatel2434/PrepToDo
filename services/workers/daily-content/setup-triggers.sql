-- ============================================================================
-- Daily Content Generation Triggers Setup
-- ============================================================================
-- This file contains SQL procedures and scheduler to automatically generate
-- daily CAT VARC content every day at midnight (00:00 UTC).
--
-- The pipeline consists of 8 edge functions:
-- 1. daily-content-init       - Initialize and select genre/article
-- 2. daily-content-passage     - Generate CAT-style passage
-- 3. daily-content-rc-questions - Generate RC questions
-- 4. daily-content-rc-answers   - Select RC answers
-- 5. daily-content-va-questions - Generate VA questions
-- 6. daily-content-va-answers   - Select VA answers
-- 7. daily-content-rc-rationales - Generate RC rationales with reasoning graph
-- 8. daily-content-va-rationales - Generate VA rationales with reasoning graph
--
-- Prerequisites:
-- - pg_net extension must be enabled: CREATE EXTENSION IF NOT EXISTS pg_net;
-- - pg_cron extension must be enabled: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- - Set Supabase URL and service role key in database Vault
--
-- Installation:
-- Run this SQL in your Supabase SQL editor or via migration
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- FUNCTION: get_daily_content_params
-- ============================================================================
-- Returns a stable set of daily content generation parameters
-- ============================================================================
CREATE OR REPLACE FUNCTION get_daily_content_params()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'genre_target', 'Philosophy', -- Default genre
        'time_limit_minutes', 30,
        'generation_type', 'daily'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PROCEDURE: process_daily_content_generation
-- ============================================================================
-- This procedure triggers the daily-content-init edge function to start
-- the 8-step pipeline. It should be called via cron at midnight.
-- ============================================================================
CREATE OR REPLACE PROCEDURE process_daily_content_generation()
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    function_url TEXT;
    service_key TEXT;
    request_id BIGINT;
    params JSONB;
    exam_id UUID;
BEGIN
    -- Generate a new exam_id for this daily generation
    exam_id := gen_random_uuid();
    
    -- 1. Fetch credentials from Supabase Vault
    -- Note: Ensure these names match exactly what you saved in the Vault UI
    SELECT decrypted_secret INTO function_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'SUPABASE_URL' LIMIT 1;

    SELECT decrypted_secret INTO service_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

    -- 2. Validate secrets exist
    IF function_url IS NULL OR service_key IS NULL THEN
        RAISE EXCEPTION 'Vault secrets not found. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY names.';
    END IF;

    -- 3. Get daily content parameters
    params := get_daily_content_params();

    -- 4. Log the start of daily generation
    RAISE NOTICE 'Starting daily content generation: %', exam_id;
    RAISE NOTICE 'Target genre: %', params->>'genre_target';

    -- 5. Make async HTTP POST request to daily-content-init via pg_net
    -- This starts the 8-step pipeline
    SELECT INTO request_id net.http_post(
        url := function_url || '/functions/v1/daily-content-init',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object(
            'date', CURRENT_DATE::text,
            'exam_id', exam_id::text
        ),
        timeout_milliseconds := 30000
    );
    
    RAISE NOTICE 'Daily content generation triggered, exam_id: %, request_id: %', exam_id, request_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to trigger daily content generation: %', SQLERRM;
END;
$$;

-- ============================================================================
-- SCHEDULER: Daily Content Generation at Midnight UTC
-- ============================================================================
-- This schedules the daily content generation to run at midnight UTC every day
-- ============================================================================

-- First, unschedule any existing version to avoid duplicates
DO $$
BEGIN
    PERFORM cron.unschedule('daily-content-generation');
EXCEPTION
    WHEN undefined_function THEN
        -- pg_cron extension might not be installed
        RAISE NOTICE 'pg_cron extension not found. Skipping unschedule.';
END $$;

-- Schedule the new version
DO $$
DECLARE
    schedule_result TEXT;
BEGIN
    schedule_result := cron.schedule(
        'daily-content-generation',
        '0 0 * * *',  -- Every day at 00:00 UTC (midnight)
        'CALL process_daily_content_generation();'
    );
    RAISE NOTICE 'Daily content generation scheduled: %', schedule_result;
EXCEPTION
    WHEN undefined_function THEN
        -- pg_cron extension might not be installed
        RAISE NOTICE 'pg_cron extension not installed. Manual trigger required.';
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to schedule daily content: %', SQLERRM;
END $$;

-- ============================================================================
-- HELPER FUNCTION: Manually trigger daily content generation
-- ============================================================================
-- This function can be called manually to test the pipeline
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_daily_content_manual(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
BEGIN
    CALL process_daily_content_generation();
    RETURN json_build_object(
        'success', true,
        'message', 'Daily content generation triggered',
        'target_date', target_date
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MONITORING VIEWS
-- ============================================================================
-- Helpful queries to monitor daily content generation
-- ============================================================================

-- View recent daily content exams
CREATE OR REPLACE VIEW daily_content_monitoring AS
SELECT 
    id,
    name,
    genre,
    generation_status,
    created_at,
    updated_at
FROM exam_papers
WHERE generated_by_user_id = 'system'
ORDER BY created_at DESC
LIMIT 20;

-- View the status of cron job
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active
FROM cron.job
WHERE command LIKE '%daily_content_generation%'
ORDER BY jobid;

-- View recent runs of the daily content generation
CREATE OR REPLACE VIEW daily_content_runs AS
SELECT 
    start_time,
    end_time,
    status,
    return_message
FROM cron.job_run_details 
WHERE command LIKE '%daily_content_generation%'
ORDER BY start_time DESC
LIMIT 10;

-- ============================================================================
-- TESTING QUERIES (Uncomment to use)
-- ============================================================================

-- Test manual trigger (call this to manually start daily content generation):
-- SELECT trigger_daily_content_manual(CURRENT_DATE);

-- View recent daily content:
-- SELECT * FROM daily_content_monitoring;

-- Check cron job status:
-- SELECT * FROM cron_job_status;

-- Check recent runs:
-- SELECT * FROM daily_content_runs;

-- ============================================================================
-- MONITORING INSTRUCTIONS
-- ============================================================================
-- After running this SQL, you can monitor the daily content generation:
--
-- 1. Check if the cron job was created:
--    SELECT * FROM cron.job WHERE command LIKE '%daily_content_generation%';
--
-- 2. View recent job runs:
--    SELECT * FROM cron.job_run_details 
--    WHERE command LIKE '%daily_content_generation%'
--    ORDER BY start_time DESC;
--
-- 3. Check pg_net request queue for API calls:
--    SELECT * FROM net._http_response 
--    WHERE url LIKE '%/functions/v1/daily-content%'
--    ORDER BY created_at DESC;
--
-- 4. Monitor exam generation progress:
--    SELECT * FROM exam_generation_state 
--    ORDER BY updated_at DESC 
--    LIMIT 10;
--
-- 5. Check daily content results:
--    SELECT * FROM exam_papers 
--    WHERE generated_by_user_id = 'system'
--    ORDER BY created_at DESC;
-- ============================================================================