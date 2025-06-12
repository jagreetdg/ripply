-- Schema fixes for Ripply Database
-- This file adds missing tables and fields identified in the comprehensive test

-- First, add missing password field to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
        ALTER TABLE users ADD COLUMN password TEXT;
    END IF;
END $$;

-- Password resets table (missing - causing 500 errors)
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verifications table (missing - causing 500 errors)
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Add RLS policies for the new tables
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Password resets RLS policies
DROP POLICY IF EXISTS "Anyone can view password resets" ON password_resets;
CREATE POLICY "Anyone can view password resets" ON password_resets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can insert password resets" ON password_resets;
CREATE POLICY "Service can insert password resets" ON password_resets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service can update password resets" ON password_resets;
CREATE POLICY "Service can update password resets" ON password_resets FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Service can delete password resets" ON password_resets;
CREATE POLICY "Service can delete password resets" ON password_resets FOR DELETE USING (true);

-- Email verifications RLS policies
DROP POLICY IF EXISTS "Anyone can view email verifications" ON email_verifications;
CREATE POLICY "Anyone can view email verifications" ON email_verifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can insert email verifications" ON email_verifications;
CREATE POLICY "Service can insert email verifications" ON email_verifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service can update email verifications" ON email_verifications;
CREATE POLICY "Service can update email verifications" ON email_verifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Service can delete email verifications" ON email_verifications;
CREATE POLICY "Service can delete email verifications" ON email_verifications FOR DELETE USING (true);

-- Clean up expired tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_resets WHERE expires_at < NOW();
  DELETE FROM email_verifications WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean up expired tokens daily
-- (This would be better as a cron job in production)
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_tokens()
RETURNS trigger AS $$
BEGIN
  PERFORM cleanup_expired_tokens();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql; 