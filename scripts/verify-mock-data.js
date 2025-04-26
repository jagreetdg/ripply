const { Pool } = require('pg');
require('dotenv').config({ path: '../backend/.env' });

async function verifyMockData() {
  // Create a connection to the database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    
    // Check if the users table exists and has the expected users
    const usersResult = await pool.query(`
      SELECT id, username, display_name, avatar_url 
      FROM users 
      ORDER BY username
    `);
    
    console.log('\n--- Users in Database ---');
    usersResult.rows.forEach(user => {
      console.log(`${user.username} (${user.display_name}): ${user.avatar_url ? 'Has profile picture' : 'NO profile picture'}`);
    });
    
    // Check if the Prometheus User exists and has no profile picture
    const prometheusUser = usersResult.rows.find(user => user.username === 'prometheus');
    if (prometheusUser) {
      console.log('\n--- Prometheus User Check ---');
      console.log(`Found: ${prometheusUser.display_name}`);
      console.log(`Profile Picture: ${prometheusUser.avatar_url ? 'Has profile picture (INCORRECT)' : 'No profile picture (CORRECT)'}`);
    } else {
      console.log('\nERROR: Prometheus User not found in database');
    }
    
    // Check voice notes
    const voiceNotesResult = await pool.query(`
      SELECT vn.id, vn.title, u.username, u.display_name
      FROM voice_notes vn
      JOIN users u ON vn.user_id = u.id
      ORDER BY u.username
    `);
    
    console.log('\n--- Voice Notes in Database ---');
    voiceNotesResult.rows.forEach(note => {
      console.log(`"${note.title}" by ${note.display_name} (${note.username})`);
    });
    
    // Check comments
    const commentsResult = await pool.query(`
      SELECT 
        c.id, 
        c.content, 
        u.username AS commenter_username,
        vn.title AS voice_note_title,
        vnu.username AS voice_note_owner
      FROM voice_note_comments c
      JOIN users u ON c.user_id = u.id
      JOIN voice_notes vn ON c.voice_note_id = vn.id
      JOIN users vnu ON vn.user_id = vnu.id
      ORDER BY c.id
    `);
    
    console.log('\n--- Comments in Database ---');
    commentsResult.rows.forEach(comment => {
      console.log(`Comment on "${comment.voice_note_title}" by ${comment.voice_note_owner}: "${comment.content}" (from ${comment.commenter_username})`);
    });

  } catch (error) {
    console.error('Error verifying mock data:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

verifyMockData();
