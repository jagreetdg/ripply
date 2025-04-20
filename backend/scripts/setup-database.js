/**
 * Ripply Database Setup Script
 * 
 * This script sets up the necessary database tables and functions for the Ripply app.
 * It reads the SQL file and executes the commands against the Supabase database.
 * 
 * Usage:
 * 1. Make sure your .env file has the correct Supabase credentials
 * 2. Run: node scripts/setup-database.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabase = require('../src/config/supabase');

async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'setup-database.sql');
    const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL file into individual commands
    // This is a simple split by semicolon and might not work for all SQL commands
    const commands = sqlCommands
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    // Execute each command
    for (const command of commands) {
      console.log(`Executing SQL command: ${command.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_command: command });
      
      if (error) {
        console.error('Error executing SQL command:', error);
        console.error('Command was:', command);
      }
    }
    
    // Execute the functions to create tables if they don't exist
    console.log('Creating voice_note_shares table if it doesn\'t exist...');
    await supabase.rpc('create_voice_note_shares_table_if_not_exists');
    
    console.log('Creating voice_bios table if it doesn\'t exist...');
    await supabase.rpc('create_voice_bios_table_if_not_exists');
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup function
setupDatabase();
