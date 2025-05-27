-- Setup script for Ripply database

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

-- Create follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    followee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, followee_id)
);

-- Create voice_note_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_note_comments (
    id UUID PRIMARY KEY,
    voice_note_id UUID NOT NULL REFERENCES public.voice_notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voice_note_plays table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_note_plays (
    id UUID PRIMARY KEY,
    voice_note_id UUID NOT NULL REFERENCES public.voice_notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voice_note_tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_note_tags (
    id UUID PRIMARY KEY,
    voice_note_id UUID NOT NULL REFERENCES public.voice_notes(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voice_note_id, tag)
);

-- Add RLS policies
ALTER TABLE public.voice_bios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_note_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_note_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_note_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for selecting
CREATE POLICY IF NOT EXISTS "Anyone can view voice bios" ON public.voice_bios FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can view voice note shares" ON public.voice_note_shares FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can view voice note comments" ON public.voice_note_comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can view voice note plays" ON public.voice_note_plays FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can view voice note tags" ON public.voice_note_tags FOR SELECT USING (true);

-- Create policies for inserting
CREATE POLICY IF NOT EXISTS "Authenticated users can insert voice bios" ON public.voice_bios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert voice note shares" ON public.voice_note_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert voice note comments" ON public.voice_note_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert voice note plays" ON public.voice_note_plays FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert voice note tags" ON public.voice_note_tags FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.voice_notes WHERE id = voice_note_id));

-- Create policies for updating
CREATE POLICY IF NOT EXISTS "Users can update their own voice bios" ON public.voice_bios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own voice note shares" ON public.voice_note_shares FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own follows" ON public.follows FOR UPDATE USING (auth.uid() = follower_id);
CREATE POLICY IF NOT EXISTS "Users can update their own voice note comments" ON public.voice_note_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own voice note plays" ON public.voice_note_plays FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own voice note tags" ON public.voice_note_tags FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.voice_notes WHERE id = voice_note_id));

-- Create policies for deleting
CREATE POLICY IF NOT EXISTS "Users can delete their own voice bios" ON public.voice_bios FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own voice note shares" ON public.voice_note_shares FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own voice note comments" ON public.voice_note_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own voice note plays" ON public.voice_note_plays FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own voice note tags" ON public.voice_note_tags FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.voice_notes WHERE id = voice_note_id));
