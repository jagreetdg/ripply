/**
 * Ripply Remote Database Schema Update Script
 * 
 * This script applies the schema updates to the remote Supabase database.
 * It reads the SQL file and executes the commands against the Supabase database.
 * 
 * Usage:
 * 1. Make sure your .env file has the correct Supabase credentials
 * 2. Run: node scripts/update-remote-schema.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabase = require('../src/config/supabase');

async function updateRemoteSchema() {
  try {
    console.log('Starting remote database schema update...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'supabase-schema-update.sql');
    const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL file into individual commands
    // This is a simple split by semicolon and might not work for all SQL commands
    const commands = sqlCommands
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    console.log(`Found ${commands.length} SQL commands to execute.`);
    
    // Execute each command
    for (const command of commands) {
      console.log(`Executing SQL command: ${command.substring(0, 50)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_command: command });
        
        if (error) {
          console.error('Error executing SQL command:', error);
          console.error('Command was:', command);
        } else {
          console.log('Command executed successfully.');
        }
      } catch (cmdError) {
        console.error('Error executing command:', cmdError);
        console.error('Command was:', command);
        // Continue with next command
      }
    }
    
    console.log('Remote database schema update completed!');
  } catch (error) {
    console.error('Error updating remote database schema:', error);
    process.exit(1);
  }
}

// Run the update function
updateRemoteSchema();
