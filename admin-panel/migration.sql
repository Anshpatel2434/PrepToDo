-- =============================================================================
-- Admin Panel — Database Migration Script
-- =============================================================================
-- Run this AFTER reviewing the implementation plan.
-- These are NEW tables only — no existing tables are modified.
-- =============================================================================

-- 1. AI Cost Log: persists every AI API call for cost tracking
CREATE TABLE admin_ai_cost_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_type text NOT NULL,
    function_name text NOT NULL,
    model_name text NOT NULL DEFAULT 'gpt-4o-mini',
    input_tokens integer NOT NULL DEFAULT 0,
    output_tokens integer NOT NULL DEFAULT 0,
    cost_cents numeric(10,4) NOT NULL DEFAULT 0,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    exam_id uuid REFERENCES exam_papers(id) ON DELETE SET NULL,
    session_id uuid REFERENCES practice_sessions(id) ON DELETE SET NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_cost_log_worker ON admin_ai_cost_log(worker_type);
CREATE INDEX idx_cost_log_user ON admin_ai_cost_log(user_id);
CREATE INDEX idx_cost_log_created ON admin_ai_cost_log(created_at);
CREATE INDEX idx_cost_log_model ON admin_ai_cost_log(model_name);

-- 2. Platform Metrics Daily: aggregated daily snapshots for dashboard charts
CREATE TABLE admin_platform_metrics_daily (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    total_users integer DEFAULT 0,
    new_users_today integer DEFAULT 0,
    active_users_today integer DEFAULT 0,
    total_sessions integer DEFAULT 0,
    sessions_today integer DEFAULT 0,
    total_questions_attempted integer DEFAULT 0,
    questions_attempted_today integer DEFAULT 0,
    total_passages_generated integer DEFAULT 0,
    passages_generated_today integer DEFAULT 0,
    total_exams_generated integer DEFAULT 0,
    exams_generated_today integer DEFAULT 0,
    ai_cost_today_cents numeric(10,4) DEFAULT 0,
    ai_cost_cumulative_cents numeric(12,4) DEFAULT 0,
    avg_session_duration_seconds integer DEFAULT 0,
    avg_accuracy_percentage numeric(5,2),
    revenue_today_cents integer DEFAULT 0,
    revenue_cumulative_cents integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_platform_metrics_date ON admin_platform_metrics_daily(date);

-- 3. User Activity Log: tracks significant events for admin visibility
CREATE TABLE admin_user_activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_activity_user ON admin_user_activity_log(user_id);
CREATE INDEX idx_activity_type ON admin_user_activity_log(event_type);
CREATE INDEX idx_activity_created ON admin_user_activity_log(created_at);
