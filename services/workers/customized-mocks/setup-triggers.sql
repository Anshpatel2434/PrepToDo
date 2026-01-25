-- ============================================================================
-- Customized Mocks Generation State Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS exam_generation_state (
    exam_id UUID PRIMARY KEY REFERENCES exam_papers(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN (
        'initializing',
        'generating_passages',
        'generating_rc_questions',
        'generating_va_questions',
        'selecting_answers',
        'generating_rc_rationales',
        'generating_va_rationales',
        'completed',
        'failed'
    )),
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 7,
    
    -- Intermediate data storage
    articles_data JSONB,
    passages_ids TEXT[],
    rc_question_ids TEXT[],
    va_question_ids TEXT[],
    
    -- Reference data for question generation
    reference_passages_content TEXT[],
    reference_data_rc JSONB,
    reference_data_va JSONB,
    
    -- Metadata
    user_id UUID NOT NULL,
    params JSONB NOT NULL,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_generation_state_status 
    ON exam_generation_state(status);
    
CREATE INDEX IF NOT EXISTS idx_exam_generation_state_user_id 
    ON exam_generation_state(user_id);
    
CREATE INDEX IF NOT EXISTS idx_exam_generation_state_created_at 
    ON exam_generation_state(created_at DESC);

-- ============================================================================
-- Update exam_papers table
-- ============================================================================

ALTER TABLE exam_papers 
ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'completed'
CHECK (generation_status IN ('initializing', 'generating', 'completed', 'failed'));

-- ============================================================================
-- Auto-update timestamp trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_exam_generation_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_exam_generation_state_timestamp 
    ON exam_generation_state;
    
CREATE TRIGGER trigger_update_exam_generation_state_timestamp
    BEFORE UPDATE ON exam_generation_state
    FOR EACH ROW
    EXECUTE FUNCTION update_exam_generation_state_timestamp();

-- ============================================================================
-- Cleanup old generation states (optional - run periodically)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_generation_states()
RETURNS void AS $$
BEGIN
    DELETE FROM exam_generation_state
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND status IN ('completed', 'failed');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE exam_generation_state IS 
    'Tracks the state of customized mock generation across 7 chained edge functions';
    
COMMENT ON COLUMN exam_generation_state.status IS 
    'Current step in the generation pipeline';
    
COMMENT ON COLUMN exam_generation_state.articles_data IS 
    'Stores fetched articles to pass between functions';
    
COMMENT ON COLUMN exam_generation_state.passages_ids IS 
    'Array of passage IDs created in step 2';
    
COMMENT ON COLUMN exam_generation_state.rc_question_ids IS 
    'Array of RC question IDs created in step 3';
    
COMMENT ON COLUMN exam_generation_state.va_question_ids IS 
    'Array of VA question IDs created in step 4';
