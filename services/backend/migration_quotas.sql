-- Migration: Add user quota fields
-- Run this script in the Neon DB console

-- Add quota columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_insights_remaining INTEGER DEFAULT 20;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customized_mocks_remaining INTEGER DEFAULT 2;

-- Set defaults for existing users
UPDATE users SET ai_insights_remaining = 20 WHERE ai_insights_remaining IS NULL;
UPDATE users SET customized_mocks_remaining = 2 WHERE customized_mocks_remaining IS NULL;
