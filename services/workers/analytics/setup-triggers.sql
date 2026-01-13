-- ============================================================================
-- User Analytics Triggers Setup
-- ============================================================================
-- This file contains SQL triggers to automatically call the user-analytics
-- edge function when:
-- 1. A practice session is completed (status = 'completed')
-- 2. A new session is inserted with status = 'completed'
--
-- Prerequisites:
-- - pg_net extension must be enabled: CREATE EXTENSION IF NOT EXISTS pg_net;
-- - Set Supabase URL and service role key in database settings or use direct values
--
-- Installation:
-- Run this SQL in your Supabase SQL editor or via migration
-- ============================================================================

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- TRIGGER FUNCTION: Call user-analytics edge function
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_user_analytics()
RETURNS TRIGGER AS $$
DECLARE
    function_url TEXT;
    service_key TEXT;
    request_id BIGINT;
BEGIN
    -- Only trigger when session is completed and not yet analyzed
    IF (TG_OP = 'INSERT' AND NEW.status = 'completed' AND NEW.is_analysed = false) OR
       (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.is_analysed = false) THEN
        
        -- 1. Fetch credentials from Supabase Vault
        -- Note: Ensure these names match exactly what you saved in the Vault UI
        SELECT decrypted_secret INTO function_url 
        FROM vault.decrypted_secrets 
        WHERE name = 'SUPABASE_URL' LIMIT 1;

        SELECT decrypted_secret INTO service_key 
        FROM vault.decrypted_secrets 
        WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

        -- 2. Build the full Edge Function path
        function_url := function_url || '/functions/v1/user-analytics';
        
        -- 3. Make async HTTP POST request via pg_net
        SELECT INTO request_id net.http_post(
            url := function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || service_key
            ),
            body := jsonb_build_object(
                'user_id', NEW.user_id::text,
                'trigger_type', 'session_completed'
            ),
            timeout_milliseconds := 30000
        );
        
        RAISE NOTICE 'Analytics trigger queued for user %, request_id: %', NEW.user_id, request_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: After session INSERT
-- ============================================================================
DROP TRIGGER IF EXISTS after_session_insert ON practice_sessions;
CREATE TRIGGER after_session_insert
AFTER INSERT ON practice_sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_user_analytics();

-- ============================================================================
-- TRIGGER: After session UPDATE
-- ============================================================================
DROP TRIGGER IF EXISTS after_session_update ON practice_sessions;
CREATE TRIGGER after_session_update
AFTER UPDATE ON practice_sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_user_analytics();

-- ============================================================================
-- Optional: Daily Streak Update Scheduler
-- ============================================================================
-- This requires pg_cron extension
-- Uncomment and configure if you want automated daily streak updates

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE PROCEDURE process_daily_streaks()
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    function_url TEXT;
    service_key TEXT;
    user_record RECORD;
BEGIN
    -- 1. Fetch credentials from Vault
    SELECT decrypted_secret INTO function_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
    SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

    -- 2. Validate secrets exist
    IF function_url IS NULL OR service_key IS NULL THEN
        RAISE EXCEPTION 'Vault secrets not found. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY names.';
    END IF;

    -- 3. Loop through active users and trigger the edge function
    FOR user_record IN (
        SELECT DISTINCT user_id
        FROM practice_sessions
        WHERE updated_at >= NOW() - INTERVAL '7 days'
          AND status = 'completed'
    ) LOOP
        PERFORM net.http_post(
            url := function_url || '/functions/v1/user-analytics',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || service_key
            ),
            body := jsonb_build_object(
                'user_id', user_record.user_id::text,
                'trigger_type', 'day_change'
            )
        );
    END LOOP;
END;
$$;

-- First, unschedule any existing version to avoid duplicates
SELECT cron.unschedule('daily-streak-update');

-- Schedule the new version
SELECT cron.schedule(
    'daily-streak-update',
    '5 0 * * *',  -- Every day at 00:05 UTC
    'CALL process_daily_streaks();'
);

-- TO GET ALL THE PROCEDURES DECLARED IN THE PUBLIC SCHEMA :
-- 
-- SELECT n.nspname as schema, p.proname as name
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE p.prokind = 'p' -- 'p' stands for Procedure
-- AND n.nspname = 'public';

-- TO CHECK IF THE CRON JOBS ARE CREATED AND IF THEY ARE WORKING PERFECTLY ? : 
-- SELECT jobid, schedule, command, nodename, nodeport, database, username 
-- FROM cron.job;

-- SELECT 
--     jobid, 
--     start_time, 
--     end_time, 
--     status, 
--     return_message 
-- FROM cron.job_run_details 
-- ORDER BY start_time DESC 
-- LIMIT 10;


-- ============================================================================
-- Configuration Instructions
-- ============================================================================
-- 
-- After running this SQL, you need to set the database configuration:
--
-- 1. Set Supabase URL:
--    ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
--
-- 2. Set Service Role Key:
--    ALTER DATABASE postgres SET app.supabase_service_role_key = 'your-service-role-key';
--
-- 3. Reload configuration:
--    SELECT pg_reload_conf();
--
-- Alternative: Modify the trigger function to use hardcoded values (less secure)
--
-- To test the trigger:
-- UPDATE practice_sessions 
-- SET status = 'completed', is_analysed = false
-- WHERE id = 'some-session-id';
--
-- Check pg_net queue:
-- SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 10;
-- ============================================================================
