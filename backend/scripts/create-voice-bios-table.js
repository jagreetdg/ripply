/**
 * Script to create the voice_bios table in Supabase
 */

require('dotenv').config();
const supabase = require('../src/config/supabase');

async function createVoiceBiosTable() {
  try {
    console.log('Creating voice_bios table...');
    
    // First, check if the table exists by attempting to query it
    const { data, error } = await supabase
      .from('voice_bios')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('Voice bios table already exists');
      return;
    }
    
    // Table doesn't exist, create it using raw SQL
    const { error: createError } = await supabase.rpc('create_table', {
      table_sql: `
        CREATE TABLE IF NOT EXISTS public.voice_bios (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          audio_url TEXT NOT NULL,
          duration INTEGER NOT NULL,
          transcript TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `
    });
    
    if (createError) {
      console.error('Error creating voice_bios table with RPC:', createError);
      
      // Try an alternative approach - use REST API to execute SQL
      console.log('Trying alternative approach...');
      
      // Create a simple test record to force table creation
      const testRecord = {
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000', // This will fail due to foreign key constraint
        audio_url: 'https://example.com/test.mp3',
        duration: 30,
        transcript: 'Test transcript'
      };
      
      const { error: insertError } = await supabase
        .from('voice_bios')
        .insert([testRecord]);
      
      if (insertError && insertError.code === '42P01') {
        console.error('Could not create voice_bios table automatically');
        console.log('Please create the table manually using the SQL in the setup-database.sql file');
      } else {
        console.log('Voice bios table creation attempted');
      }
    } else {
      console.log('Voice bios table created successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createVoiceBiosTable();
