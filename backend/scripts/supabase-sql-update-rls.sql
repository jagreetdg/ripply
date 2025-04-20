-- Update RLS policies to be more permissive for testing purposes

-- Drop existing RLS policies for voice_bios table
DROP POLICY IF EXISTS "Anyone can view voice bios" ON public.voice_bios;
DROP POLICY IF EXISTS "Users can insert their own voice bios" ON public.voice_bios;
DROP POLICY IF EXISTS "Users can update their own voice bios" ON public.voice_bios;
DROP POLICY IF EXISTS "Users can delete their own voice bios" ON public.voice_bios;

-- Create more permissive RLS policies for voice_bios table
CREATE POLICY "Allow all operations on voice_bios" 
ON public.voice_bios 
FOR ALL USING (true);

-- Drop existing RLS policies for voice_note_shares table
DROP POLICY IF EXISTS "Anyone can view voice note shares" ON public.voice_note_shares;
DROP POLICY IF EXISTS "Users can insert their own voice note shares" ON public.voice_note_shares;
DROP POLICY IF EXISTS "Users can update their own voice note shares" ON public.voice_note_shares;
DROP POLICY IF EXISTS "Users can delete their own voice note shares" ON public.voice_note_shares;

-- Create more permissive RLS policies for voice_note_shares table
CREATE POLICY "Allow all operations on voice_note_shares" 
ON public.voice_note_shares 
FOR ALL USING (true);

-- Output success message
SELECT 'RLS policies updated successfully' as result;
