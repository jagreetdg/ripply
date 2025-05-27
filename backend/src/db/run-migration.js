/**
 * Script to run SQL migrations against the Supabase database
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

// Get the migration file path from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Please provide a migration file path');
  process.exit(1);
}

const fullPath = path.resolve(__dirname, 'migrations', migrationFile);

if (!fs.existsSync(fullPath)) {
  console.error(`Migration file not found: ${fullPath}`);
  process.exit(1);
}

// Read the SQL migration file
const sql = fs.readFileSync(fullPath, 'utf8');

// Run the migration against the Supabase database
async function runMigration() {
  try {
    console.log(`Running migration: ${migrationFile}`);
    
    // Execute the SQL statements
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
