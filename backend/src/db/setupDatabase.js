// Script to set up the database schema in Supabase
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  // Get the database connection string from environment variables
  const connectionString = process.env.SUPABASE_URL;
  
  if (!connectionString) {
    console.error('Missing database connection string. Please check your .env file.');
    process.exit(1);
  }
  
  // Create a connection pool
  const pool = new Pool({
    connectionString,
  });
  
  try {
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('Executing schema...');
      // Execute the schema SQL
      await client.query(schemaSql);
      console.log('Database schema created successfully!');
      
      // Create some sample data for testing
      console.log('Creating sample data...');
      
      // Create multiple users with profile pictures
      console.log('Creating users...');
      
      // User 1 - Regular user with profile picture
      const createUser1Result = await client.query(`
        INSERT INTO users (username, display_name, email, bio, avatar_url)
        VALUES ('user1', 'John Smith', 'john@example.com', 'Music lover and podcast enthusiast', 'https://randomuser.me/api/portraits/men/1.jpg')
        RETURNING id;
      `);
      
      // User 2 - Regular user with profile picture
      const createUser2Result = await client.query(`
        INSERT INTO users (username, display_name, email, bio, avatar_url)
        VALUES ('user2', 'Sarah Johnson', 'sarah@example.com', 'Voice artist and content creator', 'https://randomuser.me/api/portraits/women/2.jpg')
        RETURNING id;
      `);
      
      // User 3 - Regular user with profile picture
      const createUser3Result = await client.query(`
        INSERT INTO users (username, display_name, email, bio, avatar_url)
        VALUES ('user3', 'Alex Chen', 'alex@example.com', 'Tech enthusiast and audio engineer', 'https://randomuser.me/api/portraits/men/3.jpg')
        RETURNING id;
      `);
      
      // User 4 - Prometheus User WITHOUT profile picture
      const createUser4Result = await client.query(`
        INSERT INTO users (username, display_name, email, bio, avatar_url)
        VALUES ('prometheus', 'Prometheus User', 'prometheus@example.com', 'Bringing knowledge to humanity', NULL)
        RETURNING id;
      `);
      
      // Store user IDs
      const user1Id = createUser1Result.rows[0].id;
      const user2Id = createUser2Result.rows[0].id;
      const user3Id = createUser3Result.rows[0].id;
      const user4Id = createUser4Result.rows[0].id;
      
      // Create voice notes for each user
      console.log('Creating voice notes...');
      
      // Voice notes for User 1
      await client.query(`
        INSERT INTO voice_notes (user_id, title, duration, audio_url, background_image)
        VALUES ($1, 'Morning Thoughts', 45, 'https://example.com/audio/morning.mp3', 'https://source.unsplash.com/random/800x600/?morning');
      `, [user1Id]);
      
      await client.query(`
        INSERT INTO voice_notes (user_id, title, duration, audio_url)
        VALUES ($1, 'Jazz Review', 120, 'https://example.com/audio/jazz.mp3');
      `, [user1Id]);
      
      // Voice notes for User 2
      await client.query(`
        INSERT INTO voice_notes (user_id, title, duration, audio_url, background_image)
        VALUES ($1, 'Meditation Guide', 300, 'https://example.com/audio/meditation.mp3', 'https://source.unsplash.com/random/800x600/?meditation');
      `, [user2Id]);
      
      // Voice notes for User 3
      await client.query(`
        INSERT INTO voice_notes (user_id, title, duration, audio_url, background_image)
        VALUES ($1, 'Tech News Recap', 180, 'https://example.com/audio/tech.mp3', 'https://source.unsplash.com/random/800x600/?technology');
      `, [user3Id]);
      
      // Voice notes for User 4 (Prometheus User)
      await client.query(`
        INSERT INTO voice_notes (user_id, title, duration, audio_url, background_image)
        VALUES ($1, 'The Gift of Knowledge', 240, 'https://example.com/audio/knowledge.mp3', 'https://source.unsplash.com/random/800x600/?knowledge');
      `, [user4Id]);
      
      await client.query(`
        INSERT INTO voice_notes (user_id, title, duration, audio_url)
        VALUES ($1, 'Wisdom of the Ages', 180, 'https://example.com/audio/wisdom.mp3');
      `, [user4Id]);
      
      // Add some comments to voice notes
      console.log('Creating comments...');
      
      // Comments on User 1's voice note
      await client.query(`
        INSERT INTO voice_note_comments (voice_note_id, user_id, content)
        SELECT id, $2, 'Great insights! I really enjoyed this.'
        FROM voice_notes WHERE user_id = $1 LIMIT 1;
      `, [user1Id, user2Id]);
      
      await client.query(`
        INSERT INTO voice_note_comments (voice_note_id, user_id, content)
        SELECT id, $2, 'Thanks for sharing your thoughts!'
        FROM voice_notes WHERE user_id = $1 LIMIT 1;
      `, [user1Id, user3Id]);
      
      // Comments on Prometheus User's voice note
      await client.query(`
        INSERT INTO voice_note_comments (voice_note_id, user_id, content)
        SELECT id, $2, 'This changed my perspective. Thank you!'
        FROM voice_notes WHERE user_id = $1 LIMIT 1;
      `, [user4Id, user1Id]);
      
      await client.query(`
        INSERT INTO voice_note_comments (voice_note_id, user_id, content)
        SELECT id, $2, 'Profound wisdom. Please share more.'
        FROM voice_notes WHERE user_id = $1 LIMIT 1;
      `, [user4Id, user2Id]);
      
      console.log('Sample data created successfully!');
      
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the setup function
setupDatabase().catch(console.error);
