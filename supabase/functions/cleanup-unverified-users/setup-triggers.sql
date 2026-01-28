-- ============================================================================
-- Unverified User Cleanup - Cron Job Setup
-- ============================================================================
-- Cleans up auth.users entries that were never verified (OTP not completed)
-- Runs every 2 hours, deletes users unverified for > 30 minutes
--
-- Prerequisites:
-- - pg_cron extension must be enabled
-- - pg_net extension for HTTP requests
-- - Service role key stored in vault
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- PROCEDURE: Cleanup unverified users via Edge Function
-- ============================================================================
CREATE OR REPLACE PROCEDURE cleanup_unverified_users()
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    function_url TEXT;
    service_key TEXT;
    request_id BIGINT;
BEGIN
    -- 1. Fetch credentials from Vault
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

    -- 3. Call the cleanup edge function
    SELECT INTO request_id net.http_post(
        url := function_url || '/functions/v1/cleanup-unverified-users',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object('trigger_type', 'scheduled_cleanup'),
        timeout_milliseconds := 60000
    );
    
    RAISE NOTICE 'Cleanup triggered, request_id: %', request_id;
END;
$$;

-- ============================================================================
-- CRON JOB: Run cleanup every 2 hours
-- ============================================================================

-- Unschedule existing job if present (prevents duplicates)
SELECT cron.unschedule('cleanup-unverified-users');

-- Schedule the cleanup job to run every 2 hours at minute 0
SELECT cron.schedule(
    'cleanup-unverified-users',
    '0 */2 * * *',  -- Every 2 hours at minute 0
    'CALL cleanup_unverified_users();'
);

-- ============================================================================
-- Verification Queries (run these to check the setup)
-- ============================================================================
-- 
-- Check if job is scheduled:
-- SELECT * FROM cron.job WHERE jobname = 'cleanup-unverified-users';
--
-- Check recent job runs:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-unverified-users')
-- ORDER BY start_time DESC LIMIT 5;
--
-- Manually trigger the cleanup for testing:
-- CALL cleanup_unverified_users();
--
-- Check pg_net request status:
-- SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 10;
-- ============================================================================
