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
    -- Handle both INSERT and UPDATE scenarios
    IF (TG_OP = 'INSERT' AND NEW.status = 'completed' AND NEW.is_analysed = false) OR
       (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.is_analysed = false) OR
       (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.is_analysed = true AND NEW.is_analysed = false) THEN
        
        -- IMPORTANT: Update these values with your actual Supabase URL and service role key
        -- Option 1: Use runtime settings (recommended for security)
        -- You must set these via: ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
        function_url := current_setting('app.supabase_url', true) || '/functions/v1/user-analytics';
        service_key := current_setting('app.supabase_service_role_key', true);
        
        -- Option 2: Hardcode for testing (NOT recommended for production)
        -- function_url := 'https://your-project.supabase.co/functions/v1/user-analytics';
        -- service_key := 'your-service-role-key';
        
        -- Make async HTTP POST request to edge function
        -- This uses pg_net which queues the request asynchronously
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
            timeout_milliseconds := 30000  -- 30 second timeout
        );
        
        -- Log the request (optional, for debugging)
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

-- -- Schedule daily at 00:05 UTC to process all active users
-- SELECT cron.schedule(
--     'daily-streak-update',
--     '5 0 * * *',  -- Every day at 00:05 UTC
--     $$
--     SELECT net.http_post(
--         url := current_setting('app.supabase_url', true) || '/functions/v1/user-analytics',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
--         ),
--         body := jsonb_build_object(
--             'user_id', u.id::text,
--             'trigger_type', 'day_change'
--         )
--     )
--     FROM (
--         SELECT DISTINCT user_id as id
--         FROM practice_sessions
--         WHERE updated_at >= NOW() - INTERVAL '7 days'
--           AND status = 'completed'
--     ) u;
--     $$
-- );

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
