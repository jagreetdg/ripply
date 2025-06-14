-- Create a stored function to handle voice note shares
-- This function uses SECURITY DEFINER to bypass RLS policies

CREATE OR REPLACE FUNCTION create_voice_note_share(
    p_voice_note_id UUID,
    p_user_id UUID
)
RETURNS TABLE(
    id UUID,
    voice_note_id UUID,
    user_id UUID,
    shared_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
    -- Check if already shared (optional, can be handled by unique constraint)
    IF EXISTS (
        SELECT 1 FROM voice_note_shares 
        WHERE voice_note_shares.voice_note_id = p_voice_note_id 
        AND voice_note_shares.user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Voice note already shared by this user';
    END IF;

    -- Insert the share record and return it
    RETURN QUERY
    INSERT INTO voice_note_shares (voice_note_id, user_id)
    VALUES (p_voice_note_id, p_user_id)
    RETURNING 
        voice_note_shares.id,
        voice_note_shares.voice_note_id,
        voice_note_shares.user_id,
        voice_note_shares.shared_at,
        voice_note_shares.created_at,
        voice_note_shares.updated_at;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_voice_note_share(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_voice_note_share(UUID, UUID) TO anon;

-- Create a comment for documentation
COMMENT ON FUNCTION create_voice_note_share(UUID, UUID) IS 'Creates a voice note share record, bypassing RLS policies'; 