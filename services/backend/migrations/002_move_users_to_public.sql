-- =============================================================================
-- COMPLETE MIGRATION: Move to single public schema for auth
-- Run this in Neon SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 1: Create the new users table in public schema
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    
    -- Provider info (email, google, etc.)
    provider VARCHAR(50) DEFAULT 'email',
    google_id VARCHAR(255),
    
    -- Metadata
    raw_app_meta_data TEXT,
    raw_user_meta_data TEXT,
    is_sso_user BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for the users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);

-- =============================================================================
-- STEP 2: Create auth-related tables (if not exist)
-- =============================================================================

-- Auth Sessions
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON public.auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON public.auth_sessions(expires_at);

-- Pending Signups (for OTP flow)
CREATE TABLE IF NOT EXISTS public.auth_pending_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    attempts VARCHAR(10) DEFAULT '0',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_pending_signups_email ON public.auth_pending_signups(email);
CREATE INDEX IF NOT EXISTS idx_auth_pending_signups_expires_at ON public.auth_pending_signups(expires_at);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS public.auth_password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_password_reset_tokens_user_id ON public.auth_password_reset_tokens(user_id);

-- =============================================================================
-- STEP 3: Update foreign key constraints for auth tables
-- =============================================================================

-- Auth Sessions
ALTER TABLE public.auth_sessions 
    DROP CONSTRAINT IF EXISTS auth_sessions_user_id_fkey;
ALTER TABLE public.auth_sessions
    ADD CONSTRAINT auth_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Password Reset Tokens
ALTER TABLE public.auth_password_reset_tokens 
    DROP CONSTRAINT IF EXISTS auth_password_reset_tokens_user_id_fkey;
ALTER TABLE public.auth_password_reset_tokens
    ADD CONSTRAINT auth_password_reset_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 4: Update foreign key constraints for app tables
-- =============================================================================

-- practice_sessions.user_id -> public.users(id)
ALTER TABLE public.practice_sessions 
    DROP CONSTRAINT IF EXISTS practice_sessions_user_id_fkey;
ALTER TABLE public.practice_sessions
    ADD CONSTRAINT practice_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- question_attempts.user_id -> public.users(id)
ALTER TABLE public.question_attempts 
    DROP CONSTRAINT IF EXISTS question_attempts_user_id_fkey;
ALTER TABLE public.question_attempts
    ADD CONSTRAINT question_attempts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- user_analytics.user_id -> public.users(id)
ALTER TABLE public.user_analytics 
    DROP CONSTRAINT IF EXISTS user_analytics_user_id_fkey;
ALTER TABLE public.user_analytics
    ADD CONSTRAINT user_analytics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- user_metric_proficiency.user_id -> public.users(id)
ALTER TABLE public.user_metric_proficiency 
    DROP CONSTRAINT IF EXISTS user_metric_proficiency_user_id_fkey;
ALTER TABLE public.user_metric_proficiency
    ADD CONSTRAINT user_metric_proficiency_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- user_proficiency_signals.user_id -> public.users(id)
ALTER TABLE public.user_proficiency_signals 
    DROP CONSTRAINT IF EXISTS user_proficiency_signals_user_id_fkey;
ALTER TABLE public.user_proficiency_signals
    ADD CONSTRAINT user_proficiency_signals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- user_profiles.id -> public.users(id) (same ID as the user)
ALTER TABLE public.user_profiles 
    DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

-- exam_generation_state.user_id -> public.users(id)
ALTER TABLE public.exam_generation_state 
    DROP CONSTRAINT IF EXISTS exam_generation_state_user_id_fkey;
ALTER TABLE public.exam_generation_state
    ADD CONSTRAINT exam_generation_state_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- exam_papers.generated_by_user_id -> public.users(id)
ALTER TABLE public.exam_papers 
    DROP CONSTRAINT IF EXISTS exam_papers_generated_by_user_id_fkey;
ALTER TABLE public.exam_papers
    ADD CONSTRAINT exam_papers_generated_by_user_id_fkey 
    FOREIGN KEY (generated_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- =============================================================================
-- SUMMARY: All tables now use public.users
-- =============================================================================
-- Tables with user_id foreign keys updated:
-- 1. public.auth_sessions
-- 2. public.auth_password_reset_tokens
-- 3. public.practice_sessions
-- 4. public.question_attempts
-- 5. public.user_analytics
-- 6. public.user_metric_proficiency
-- 7. public.user_proficiency_signals
-- 8. public.user_profiles (id is the FK)
-- 9. public.exam_generation_state
-- 10. public.exam_papers (generated_by_user_id)
-- =============================================================================
