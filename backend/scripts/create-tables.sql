-- Create voice_note_shares table if it doesn't exist
CREATE OR REPLACE FUNCTION create_voice_note_shares_table_if_not_exists()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'voice_note_shares'
    ) THEN
        CREATE TABLE public.voice_note_shares (
            id UUID PRIMARY KEY,
            voice_note_id UUID NOT NULL REFERENCES public.voice_notes(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(voice_note_id, user_id)
        );
        
        -- Add RLS policies
        ALTER TABLE public.voice_note_shares ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for selecting
        CREATE POLICY "Anyone can view voice note shares" 
        ON public.voice_note_shares FOR SELECT 
        USING (true);
        
        -- Create policy for inserting
        CREATE POLICY "Authenticated users can create voice note shares" 
        ON public.voice_note_shares FOR INSERT 
        WITH CHECK (true);
        
        -- Create policy for updating
        CREATE POLICY "Users can update their own voice note shares" 
        ON public.voice_note_shares FOR UPDATE 
        USING (auth.uid() = user_id);
        
        -- Create policy for deleting
        CREATE POLICY "Users can delete their own voice note shares" 
        ON public.voice_note_shares FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create voice_bios table if it doesn't exist
CREATE OR REPLACE FUNCTION create_voice_bios_table_if_not_exists()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'voice_bios'
    ) THEN
        CREATE TABLE public.voice_bios (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            audio_url TEXT NOT NULL,
            duration INTEGER NOT NULL,
            transcript TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        
        -- Add RLS policies
        ALTER TABLE public.voice_bios ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for selecting
        CREATE POLICY "Anyone can view voice bios" 
        ON public.voice_bios FOR SELECT 
        USING (true);
        
        -- Create policy for inserting
        CREATE POLICY "Users can create their own voice bios" 
        ON public.voice_bios FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        
        -- Create policy for updating
        CREATE POLICY "Users can update their own voice bios" 
        ON public.voice_bios FOR UPDATE 
        USING (auth.uid() = user_id);
        
        -- Create policy for deleting
        CREATE POLICY "Users can delete their own voice bios" 
        ON public.voice_bios FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END;
$$ LANGUAGE plpgsql;
