-- Function to add shares column to voice_notes if not exists
CREATE OR REPLACE FUNCTION add_shares_column_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the shares column exists in voice_notes table
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'voice_notes'
    AND column_name = 'shares'
  ) THEN
    -- Add the shares column
    EXECUTE 'ALTER TABLE voice_notes ADD COLUMN shares INT DEFAULT 0';
    
    -- Update shares count for all voice notes based on voice_note_shares table
    UPDATE voice_notes vn
    SET shares = share_count.count
    FROM (
      SELECT voice_note_id, COUNT(*) as count
      FROM voice_note_shares
      GROUP BY voice_note_id
    ) AS share_count
    WHERE vn.id = share_count.voice_note_id;
  END IF;
END;
$$ LANGUAGE plpgsql; 