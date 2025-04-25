-- Ripply Database Schema for Supabase

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,                  -- Primary profile image
  cover_photo_url TEXT,             -- Cover photo/banner
  bio TEXT,                         -- Text bio
  is_verified BOOLEAN DEFAULT FALSE, -- Verified status flag
  profile_photos JSONB DEFAULT '[]'::jsonb, -- Array of additional profile photos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice notes table
CREATE TABLE IF NOT EXISTS voice_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL, -- Duration in seconds
  audio_url TEXT NOT NULL,
  background_image TEXT, -- URL to background image (optional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice note likes
CREATE TABLE IF NOT EXISTS voice_note_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voice_note_id, user_id) -- Prevent duplicate likes
);

-- Voice note comments
CREATE TABLE IF NOT EXISTS voice_note_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice note plays (listens)
CREATE TABLE IF NOT EXISTS voice_note_plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be anonymous
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice note tags
CREATE TABLE IF NOT EXISTS voice_note_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voice_note_id, tag_name) -- Prevent duplicate tags on the same voice note
);

-- User follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id) -- Prevent duplicate follows
);

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_voice_notes_user_id ON voice_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_likes_voice_note_id ON voice_note_likes(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_likes_user_id ON voice_note_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_comments_voice_note_id ON voice_note_comments(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_plays_voice_note_id ON voice_note_plays(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_tags_voice_note_id ON voice_note_tags(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_tags_tag_name ON voice_note_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Create views for easier querying

-- Voice notes with counts
CREATE OR REPLACE VIEW voice_notes_with_stats AS
SELECT 
  vn.*,
  COUNT(DISTINCT vnl.id) AS likes_count,
  COUNT(DISTINCT vnc.id) AS comments_count,
  COUNT(DISTINCT vnp.id) AS plays_count,
  COUNT(DISTINCT vns.id) AS shares_count
FROM 
  voice_notes vn
LEFT JOIN 
  voice_note_likes vnl ON vn.id = vnl.voice_note_id
LEFT JOIN 
  voice_note_comments vnc ON vn.id = vnc.voice_note_id
LEFT JOIN 
  voice_note_plays vnp ON vn.id = vnp.voice_note_id
LEFT JOIN 
  voice_note_shares vns ON vn.id = vns.voice_note_id
GROUP BY 
  vn.id;

-- User profiles with counts
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  u.*,
  COUNT(DISTINCT vn.id) AS voice_notes_count,
  COUNT(DISTINCT f1.id) AS followers_count,
  COUNT(DISTINCT f2.id) AS following_count,
  vb.id IS NOT NULL AS has_voice_bio
FROM 
  users u
LEFT JOIN 
  voice_notes vn ON u.id = vn.user_id
LEFT JOIN 
  follows f1 ON u.id = f1.following_id
LEFT JOIN 
  follows f2 ON u.id = f2.follower_id
LEFT JOIN
  voice_bios vb ON u.id = vb.user_id
GROUP BY 
  u.id, vb.id;

-- Function to check if a user has liked a voice note
CREATE OR REPLACE FUNCTION has_user_liked_voice_note(user_uuid UUID, voice_note_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM voice_note_likes
    WHERE user_id = user_uuid AND voice_note_id = voice_note_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user has shared a voice note
CREATE OR REPLACE FUNCTION has_user_shared_voice_note(user_uuid UUID, voice_note_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM voice_note_shares
    WHERE user_id = user_uuid AND voice_note_id = voice_note_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Voice bios table
CREATE TABLE IF NOT EXISTS voice_bios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Voice note shares table
CREATE TABLE IF NOT EXISTS voice_note_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voice_note_id, user_id)
);

-- Create indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_voice_bios_user_id ON voice_bios(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_shares_voice_note_id ON voice_note_shares(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_shares_user_id ON voice_note_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_shares_shared_at ON voice_note_shares(shared_at);

-- Add RLS policies for the tables
ALTER TABLE voice_bios ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_note_shares ENABLE ROW LEVEL SECURITY;

-- Voice bios RLS policies
DROP POLICY IF EXISTS "Anyone can view voice bios" ON voice_bios;
CREATE POLICY "Anyone can view voice bios" ON voice_bios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own voice bios" ON voice_bios;
CREATE POLICY "Users can create their own voice bios" ON voice_bios FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own voice bios" ON voice_bios;
CREATE POLICY "Users can update their own voice bios" ON voice_bios FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own voice bios" ON voice_bios;
CREATE POLICY "Users can delete their own voice bios" ON voice_bios FOR DELETE USING (auth.uid() = user_id);

-- Voice note shares RLS policies
DROP POLICY IF EXISTS "Anyone can view voice note shares" ON voice_note_shares;
CREATE POLICY "Anyone can view voice note shares" ON voice_note_shares FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own voice note shares" ON voice_note_shares;
CREATE POLICY "Users can insert their own voice note shares" ON voice_note_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own voice note shares" ON voice_note_shares;
CREATE POLICY "Users can update their own voice note shares" ON voice_note_shares FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own voice note shares" ON voice_note_shares;
CREATE POLICY "Users can delete their own voice note shares" ON voice_note_shares FOR DELETE USING (auth.uid() = user_id);
