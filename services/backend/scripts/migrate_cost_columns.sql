-- Migration script to update cost tracking columns from Cents to USD
-- Run this in your SQL client (e.g., Neon Console, DBeaver, psql)

BEGIN;

--------------------------------------------------------------------------------
-- 1. Update admin_ai_cost_log
-- Rename column and update type to DECIMAL(14, 9) for high precision
-- Note: Existing data was likely already in dollars (due to bug), so no value conversion needed, just type update.
--------------------------------------------------------------------------------
ALTER TABLE "admin_ai_cost_log" 
    RENAME COLUMN "cost_cents" TO "cost_usd";

ALTER TABLE "admin_ai_cost_log" 
    ALTER COLUMN "cost_usd" TYPE DECIMAL(14, 9);

--------------------------------------------------------------------------------
-- 2. Update admin_platform_metrics_daily
-- Rename columns and update types to DECIMAL(14, 9)
--------------------------------------------------------------------------------
ALTER TABLE "admin_platform_metrics_daily" 
    RENAME COLUMN "ai_cost_today_cents" TO "ai_cost_today_usd";

ALTER TABLE "admin_platform_metrics_daily" 
    ALTER COLUMN "ai_cost_today_usd" TYPE DECIMAL(14, 9);

ALTER TABLE "admin_platform_metrics_daily" 
    RENAME COLUMN "ai_cost_cumulative_cents" TO "ai_cost_cumulative_usd";

ALTER TABLE "admin_platform_metrics_daily" 
    ALTER COLUMN "ai_cost_cumulative_usd" TYPE DECIMAL(14, 9);

--------------------------------------------------------------------------------
-- 3. Update passages
-- Rename column and update to DECIMAL(14, 9)
-- Since this was an INTEGER column storing cents, we divide by 100 to get dollars.
--------------------------------------------------------------------------------
ALTER TABLE "passages" 
    RENAME COLUMN "generation_cost_cents" TO "generation_cost_usd";

ALTER TABLE "passages" 
    ALTER COLUMN "generation_cost_usd" TYPE DECIMAL(14, 9) 
    USING ("generation_cost_usd"::DECIMAL(14, 9) / 100);

COMMIT;
