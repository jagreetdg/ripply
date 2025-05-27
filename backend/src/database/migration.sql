-- Add shares column to voice_notes table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                 WHERE table_name='voice_notes' AND column_name='shares') THEN
        ALTER TABLE voice_notes ADD COLUMN shares INT DEFAULT 0;
    END IF;
END $$; 