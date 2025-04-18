// Script to export the schema for Supabase
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function exportSchema() {
  try {
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('='.repeat(80));
    console.log('SUPABASE SCHEMA SQL');
    console.log('='.repeat(80));
    console.log('Copy and paste the following SQL into the Supabase SQL Editor:');
    console.log('='.repeat(80));
    console.log(schemaSql);
    console.log('='.repeat(80));
    
    // Also save to a file for easy access
    const outputPath = path.join(__dirname, 'supabase-schema-export.sql');
    fs.writeFileSync(outputPath, schemaSql);
    console.log(`Schema also saved to: ${outputPath}`);
    console.log('After executing this schema in Supabase, run setupSupabase.js to create sample data.');
    
  } catch (error) {
    console.error('Error exporting schema:', error);
  }
}

// Run the export function
exportSchema();
