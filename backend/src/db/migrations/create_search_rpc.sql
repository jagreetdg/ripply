DROP FUNCTION IF EXISTS search_voice_notes(TEXT);

CREATE OR REPLACE FUNCTION search_voice_notes(search_term TEXT, current_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    audio_url TEXT,
    waveform_data JSON,
    is_private BOOLEAN,
    created_at TIMESTAMPTZ,
    duration_seconds NUMERIC,
    users JSON,
    tags JSON,
    likes_count BIGINT,
    comments_count BIGINT,
    plays_count BIGINT,
    shares_count BIGINT,
    user_has_liked BOOLEAN,
    user_has_shared BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH voice_note_search AS (
    SELECT DISTINCT vn.id
    FROM voice_notes AS vn
    LEFT JOIN voice_note_tags AS vnt ON vn.id = vnt.voice_note_id
    WHERE
      vn.title ILIKE '%' || search_term || '%' OR
      vnt.tag_name ILIKE '%' || search_term || '%'
  )
  SELECT
    vn.id,
    vn.user_id,
    vn.title,
    vn.audio_url,
    vn.waveform_data,
    vn.is_private,
    vn.created_at,
    vn.duration_seconds,
    json_build_object(
      'id', u.id,
      'username', u.username,
      'display_name', u.display_name,
      'avatar_url', u.avatar_url,
      'is_verified', u.is_verified
    ) AS users,
    (
      SELECT json_agg(t.tag_name)
      FROM voice_note_tags t
      WHERE t.voice_note_id = vn.id
    ) AS tags,
    (SELECT COUNT(*) FROM voice_note_likes l WHERE l.voice_note_id = vn.id) AS likes_count,
    (SELECT COUNT(*) FROM voice_note_comments c WHERE c.voice_note_id = vn.id) AS comments_count,
    (SELECT COUNT(*) FROM voice_note_plays p WHERE p.voice_note_id = vn.id) AS plays_count,
    (SELECT COUNT(*) FROM voice_note_shares s WHERE s.voice_note_id = vn.id) AS shares_count,
    EXISTS(SELECT 1 FROM voice_note_likes l WHERE l.voice_note_id = vn.id AND l.user_id = search_voice_notes.current_user_id) AS user_has_liked,
    EXISTS(SELECT 1 FROM voice_note_shares s WHERE s.voice_note_id = vn.id AND s.user_id = search_voice_notes.current_user_id) AS user_has_shared
  FROM
    voice_notes AS vn
  JOIN
    users AS u ON vn.user_id = u.id
  WHERE
    vn.id IN (SELECT id FROM voice_note_search);
END;
$$ LANGUAGE plpgsql; 