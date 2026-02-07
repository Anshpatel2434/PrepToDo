-- =============================================================================
-- Authentication Database Schema Updates for Rate Limiting
-- Run this script in your Neon DB console
-- =============================================================================

-- Add rate limiting columns to auth_pending_signups table
-- These columns enable OTP send count tracking and temporary bans

ALTER TABLE auth_pending_signups
ADD COLUMN IF NOT EXISTS otp_send_count INTEGER DEFAULT 1;

ALTER TABLE auth_pending_signups
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE;

-- Add an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_pending_signups_email 
ON auth_pending_signups(email);

-- Add an index on banned_until for efficient ban checks
CREATE INDEX IF NOT EXISTS idx_auth_pending_signups_banned_until 
ON auth_pending_signups(banned_until) 
WHERE banned_until IS NOT NULL;

-- =============================================================================
-- Verification Query
-- Run this to confirm the columns were added successfully
-- =============================================================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'auth_pending_signups';
