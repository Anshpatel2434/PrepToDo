-- =============================================================================
-- Auth Tables for Custom Backend
-- Run this in Neon SQL Editor
-- =============================================================================

-- 1. Auth Sessions (for JWT session tracking)
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON public.auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON public.auth_sessions(expires_at);

-- 2. Auth Pending Signups (for OTP flow - solves refresh bug)
CREATE TABLE IF NOT EXISTS public.auth_pending_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    attempts VARCHAR(10) DEFAULT '0',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_auth_pending_signups_email ON public.auth_pending_signups(email);
CREATE INDEX IF NOT EXISTS idx_auth_pending_signups_expires_at ON public.auth_pending_signups(expires_at);

-- 3. Auth Password Reset Tokens
CREATE TABLE IF NOT EXISTS public.auth_password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_password_reset_tokens_user_id ON public.auth_password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_password_reset_tokens_expires_at ON public.auth_password_reset_tokens(expires_at);

-- 4. Add custom columns to auth.users (if not already present)
-- These are optional and only needed if you want to track provider/googleId
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'provider') THEN
        ALTER TABLE auth.users ADD COLUMN provider VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'google_id') THEN
        ALTER TABLE auth.users ADD COLUMN google_id VARCHAR(255);
    END IF;
END $$;
