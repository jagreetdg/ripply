-- Ripply Database Schema for Supabase

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  cover_photo_url TEXT,         -- New: cover photo/banner
  bio TEXT,
  voice_bio_url TEXT,           -- New: voice note bio (audio file)
  is_verified BOOLEAN DEFAULT FALSE, -- New: verified status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice notes table
CREATE TABLE voice_notes (
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
CREATE TABLE voice_note_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voice_note_id, user_id) -- Prevent duplicate likes
);

-- Voice note comments
CREATE TABLE voice_note_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice note plays (listens)
CREATE TABLE voice_note_plays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be anonymous
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice note tags
CREATE TABLE voice_note_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voice_note_id, tag_name) -- Prevent duplicate tags on the same voice note
);

-- User follows
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id) -- Prevent duplicate follows
);

-- Create indexes for better performance
CREATE INDEX idx_voice_notes_user_id ON voice_notes(user_id);
CREATE INDEX idx_voice_note_likes_voice_note_id ON voice_note_likes(voice_note_id);
CREATE INDEX idx_voice_note_likes_user_id ON voice_note_likes(user_id);
CREATE INDEX idx_voice_note_comments_voice_note_id ON voice_note_comments(voice_note_id);
CREATE INDEX idx_voice_note_plays_voice_note_id ON voice_note_plays(voice_note_id);
CREATE INDEX idx_voice_note_tags_voice_note_id ON voice_note_tags(voice_note_id);
CREATE INDEX idx_voice_note_tags_tag_name ON voice_note_tags(tag_name);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- Create views for easier querying

-- Voice notes with counts
CREATE VIEW voice_notes_with_stats AS
SELECT 
  vn.*,
  COUNT(DISTINCT vnl.id) AS likes_count,
  COUNT(DISTINCT vnc.id) AS comments_count,
  COUNT(DISTINCT vnp.id) AS plays_count
FROM 
  voice_notes vn
LEFT JOIN 
  voice_note_likes vnl ON vn.id = vnl.voice_note_id
LEFT JOIN 
  voice_note_comments vnc ON vn.id = vnc.voice_note_id
LEFT JOIN 
  voice_note_plays vnp ON vn.id = vnp.voice_note_id
GROUP BY 
  vn.id;

-- User profiles with counts
CREATE VIEW user_profiles AS
SELECT 
  u.*,
  COUNT(DISTINCT vn.id) AS voice_notes_count,
  COUNT(DISTINCT f1.id) AS followers_count,
  COUNT(DISTINCT f2.id) AS following_count
FROM 
  users u
LEFT JOIN 
  voice_notes vn ON u.id = vn.user_id
LEFT JOIN 
  follows f1 ON u.id = f1.following_id
LEFT JOIN 
  follows f2 ON u.id = f2.follower_id
GROUP BY 
  u.id;

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
