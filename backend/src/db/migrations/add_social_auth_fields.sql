-- Migration to add social authentication fields to the users table

-- Add google_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;

-- Add apple_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id);

-- Add unique constraints to prevent duplicate social accounts
-- Note: These are conditional to allow NULL values
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_apple_id_unique ON users(apple_id) WHERE apple_id IS NOT NULL;
