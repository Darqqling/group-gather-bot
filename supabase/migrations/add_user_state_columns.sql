
-- Add columns to telegram_users table for handling user state in multi-step commands
ALTER TABLE telegram_users 
ADD COLUMN IF NOT EXISTS current_state TEXT,
ADD COLUMN IF NOT EXISTS state_data JSONB;
