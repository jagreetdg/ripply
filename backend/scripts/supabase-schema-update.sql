-- Ripply Database Structure Update Script
-- Run this in the Supabase SQL Editor to apply all schema fixes and improvements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, drop or replace any views that depend on the voice_bio_url column
DROP VIEW IF EXISTS public.user_profiles CASCADE;

-- Update users table structure
DO $$
BEGIN
    -- Add profile_photos column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'profile_photos'
    ) THEN
        ALTER TABLE public.users ADD COLUMN profile_photos JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Remove voice_bio_url column if it exists (redundant with voice_bios table)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'voice_bio_url'
    ) THEN
        -- First migrate any existing data to voice_bios table
        INSERT INTO public.voice_bios (
            id, 
            user_id, 
            audio_url, 
            duration, 
            created_at, 
            updated_at
        )
        SELECT 
            uuid_generate_v4(), 
            id, 
            voice_bio_url, 
            30, -- Default duration of 30 seconds
            created_at, 
            updated_at
        FROM 
            public.users
        WHERE 
            voice_bio_url IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM public.voice_bios WHERE user_id = users.id
        );
        
        -- Then drop the column
        ALTER TABLE public.users DROP COLUMN voice_bio_url;
    END IF;
END $$;

-- Create voice_bios table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_bios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    duration INTEGER NOT NULL,
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create voice_note_shares table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_note_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voice_note_id UUID NOT NULL REFERENCES public.voice_notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voice_note_id, user_id)
);

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_voice_notes_user_id ON public.voice_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_likes_voice_note_id ON public.voice_note_likes(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_likes_user_id ON public.voice_note_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_comments_voice_note_id ON public.voice_note_comments(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_plays_voice_note_id ON public.voice_note_plays(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_tags_voice_note_id ON public.voice_note_tags(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_tags_tag_name ON public.voice_note_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_voice_bios_user_id ON public.voice_bios(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_shares_voice_note_id ON public.voice_note_shares(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_shares_user_id ON public.voice_note_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_shares_shared_at ON public.voice_note_shares(shared_at);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.voice_bios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_note_shares ENABLE ROW LEVEL SECURITY;

-- Create or replace views for easier querying
CREATE OR REPLACE VIEW public.voice_notes_with_stats AS
SELECT 
  vn.*,
  COUNT(DISTINCT vnl.id) AS likes_count,
  COUNT(DISTINCT vnc.id) AS comments_count,
  COUNT(DISTINCT vnp.id) AS plays_count,
  COUNT(DISTINCT vns.id) AS shares_count
FROM 
  public.voice_notes vn
LEFT JOIN 
  public.voice_note_likes vnl ON vn.id = vnl.voice_note_id
LEFT JOIN 
  public.voice_note_comments vnc ON vn.id = vnc.voice_note_id
LEFT JOIN 
  public.voice_note_plays vnp ON vn.id = vnp.voice_note_id
LEFT JOIN 
  public.voice_note_shares vns ON vn.id = vns.voice_note_id
GROUP BY 
  vn.id;

-- User profiles with counts
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  u.*,
  COUNT(DISTINCT vn.id) AS voice_notes_count,
  COUNT(DISTINCT f1.id) AS followers_count,
  COUNT(DISTINCT f2.id) AS following_count,
  vb.id IS NOT NULL AS has_voice_bio
FROM 
  public.users u
LEFT JOIN 
  public.voice_notes vn ON u.id = vn.user_id
LEFT JOIN 
  public.follows f1 ON u.id = f1.following_id
LEFT JOIN 
  public.follows f2 ON u.id = f2.follower_id
LEFT JOIN
  public.voice_bios vb ON u.id = vb.user_id
GROUP BY 
  u.id, vb.id;

-- Function to check if a user has liked a voice note
CREATE OR REPLACE FUNCTION public.has_user_liked_voice_note(user_uuid UUID, voice_note_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.voice_note_likes
    WHERE user_id = user_uuid AND voice_note_id = voice_note_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user has shared a voice note
CREATE OR REPLACE FUNCTION public.has_user_shared_voice_note(user_uuid UUID, voice_note_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.voice_note_shares
    WHERE user_id = user_uuid AND voice_note_id = voice_note_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Voice bios RLS policies
DROP POLICY IF EXISTS "Anyone can view voice bios" ON public.voice_bios;
CREATE POLICY "Anyone can view voice bios" ON public.voice_bios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own voice bios" ON public.voice_bios;
CREATE POLICY "Users can create their own voice bios" ON public.voice_bios FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own voice bios" ON public.voice_bios;
CREATE POLICY "Users can update their own voice bios" ON public.voice_bios FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own voice bios" ON public.voice_bios;
CREATE POLICY "Users can delete their own voice bios" ON public.voice_bios FOR DELETE USING (auth.uid() = user_id);

-- Voice note shares RLS policies
DROP POLICY IF EXISTS "Anyone can view voice note shares" ON public.voice_note_shares;
CREATE POLICY "Anyone can view voice note shares" ON public.voice_note_shares FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own voice note shares" ON public.voice_note_shares;
CREATE POLICY "Users can insert their own voice note shares" ON public.voice_note_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own voice note shares" ON public.voice_note_shares;
CREATE POLICY "Users can update their own voice note shares" ON public.voice_note_shares FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own voice note shares" ON public.voice_note_shares;
CREATE POLICY "Users can delete their own voice note shares" ON public.voice_note_shares FOR DELETE USING (auth.uid() = user_id);

-- Output success message
SELECT 'Database structure updated successfully' as result;
