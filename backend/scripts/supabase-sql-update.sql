-- Ripply Database Structure Update Script
-- Run this in the Supabase SQL Editor to set up all necessary tables and columns

-- Create voice_bios table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_bios (
    id UUID PRIMARY KEY,
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
    id UUID PRIMARY KEY,
    voice_note_id UUID NOT NULL REFERENCES public.voice_notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voice_note_id, user_id)
);

-- Add is_verified boolean column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add profile_photos JSON array column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'profile_photos'
    ) THEN
        ALTER TABLE public.users ADD COLUMN profile_photos JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.voice_bios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_note_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for voice_bios table
CREATE POLICY "Anyone can view voice bios" 
ON public.voice_bios 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own voice bios" 
ON public.voice_bios 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice bios" 
ON public.voice_bios 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice bios" 
ON public.voice_bios 
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for voice_note_shares table
CREATE POLICY "Anyone can view voice note shares" 
ON public.voice_note_shares 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own voice note shares" 
ON public.voice_note_shares 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice note shares" 
ON public.voice_note_shares 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice note shares" 
ON public.voice_note_shares 
FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_bios_user_id ON public.voice_bios(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_shares_voice_note_id ON public.voice_note_shares(voice_note_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_shares_user_id ON public.voice_note_shares(user_id);

-- Output success message
SELECT 'Database structure updated successfully' as result;
