CREATE OR REPLACE FUNCTION search_voice_notes(search_term TEXT)
RETURNS SETOF voice_notes AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT vn.*
  FROM voice_notes vn
  LEFT JOIN voice_note_tags vnt ON vn.id = vnt.voice_note_id
  WHERE
    vn.title ILIKE '%' || search_term || '%' OR
    vnt.tag_name ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql; 