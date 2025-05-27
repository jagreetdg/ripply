/**
 * Script to add password column to users table in Supabase
 */
const supabase = require('../src/config/supabase');
require('dotenv').config();

async function addPasswordColumn() {
  try {
    console.log('Adding password column to users table...');
    
    // Check if the column already exists
    const { data: columns, error: columnsError } = await supabase.rpc(
      'get_columns',
      { table_name: 'users' }
    );
    
    if (columnsError) {
      // If the RPC function doesn't exist, we'll use a direct SQL query
      console.log('Using direct SQL query to check for password column...');
      
      // Execute SQL to add the password column if it doesn't exist
      const { error } = await supabase.rpc(
        'execute_sql',
        {
          query: `
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'password'
              ) THEN
                ALTER TABLE users ADD COLUMN password TEXT;
              END IF;
            END
            $$;
          `
        }
      );
      
      if (error) {
        console.error('Error executing SQL:', error);
        
        // If the RPC function doesn't exist, we need to create it first
        console.log('Creating execute_sql function...');
        
        // Note: This requires admin privileges on the database
        console.log('Please run the following SQL in the Supabase SQL Editor:');
        console.log(`
          -- Add password column to users table
          ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
          
          -- Create index on email for faster lookups during login
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          
          -- Create index on username for faster lookups
          CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        `);
        
        return;
      }
      
      console.log('Password column added successfully!');
      return;
    }
    
    // If we got the columns, check if password exists
    const hasPasswordColumn = columns.some(col => col.column_name === 'password');
    
    if (hasPasswordColumn) {
      console.log('Password column already exists.');
      return;
    }
    
    // Add the password column
    const { error } = await supabase.rpc(
      'execute_sql',
      {
        query: 'ALTER TABLE users ADD COLUMN password TEXT;'
      }
    );
    
    if (error) {
      console.error('Error adding password column:', error);
      return;
    }
    
    console.log('Password column added successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
addPasswordColumn().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
