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
      
      // Create a test user
      const createUserResult = await client.query(`
        INSERT INTO users (username, display_name, email, bio)
        VALUES ('testuser', 'Test User', 'test@example.com', 'This is a test user account')
        RETURNING id;
      `);
      
      const userId = createUserResult.rows[0].id;
      
      // Create a test voice note
      await client.query(`
        INSERT INTO voice_notes (user_id, title, duration, audio_url)
        VALUES ($1, 'My First Voice Note', 60, 'https://example.com/audio/sample.mp3');
      `, [userId]);
      
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
