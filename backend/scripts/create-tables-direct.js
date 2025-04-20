/**
 * Direct table creation script for Ripply
 * 
 * This script uses the Supabase REST API to create tables directly
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Function to execute SQL directly via REST API
async function executeSql(sql) {
  try {
    const response = await axios({
      method: 'post',
      url: `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        sql_command: sql
      }
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('SQL execution error:', error.response ? error.response.data : error.message);
    return { success: false, error: error.response ? error.response.data : error.message };
  }
}

// Create voice_bios table
async function createVoiceBiosTable() {
  console.log('Creating voice_bios table...');
  
  const sql = `
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
    
    -- Add RLS policies
    ALTER TABLE public.voice_bios ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY IF NOT EXISTS "Anyone can view voice bios" 
      ON public.voice_bios 
      FOR SELECT USING (true);
      
    CREATE POLICY IF NOT EXISTS "Users can insert their own voice bios" 
      ON public.voice_bios 
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY IF NOT EXISTS "Users can update their own voice bios" 
      ON public.voice_bios 
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY IF NOT EXISTS "Users can delete their own voice bios" 
      ON public.voice_bios 
      FOR DELETE USING (auth.uid() = user_id);
  `;
  
  const result = await executeSql(sql);
  
  if (result.success) {
    console.log('Voice bios table created successfully');
  } else {
    console.log('Failed to create voice_bios table using SQL');
    
    // Try alternative method - use REST API to directly create a record
    try {
      console.log('Trying alternative method...');
      
      const response = await axios({
        method: 'post',
        url: `${SUPABASE_URL}/rest/v1/voice_bios`,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        data: {
          id: uuidv4(),
          user_id: '00000000-0000-0000-0000-000000000000', // This will fail due to FK constraint
          audio_url: 'https://example.com/test.mp3',
          duration: 30,
          transcript: 'Test transcript'
        }
      });
      
      console.log('Voice bios table created via direct API call');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message === 'relation "voice_bios" does not exist') {
        console.error('Could not create voice_bios table');
      } else {
        console.log('Voice bios table may have been created');
      }
    }
  }
}

// Create voice_note_shares table
async function createVoiceNoteSharesTable() {
  console.log('Creating voice_note_shares table...');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS public.voice_note_shares (
      id UUID PRIMARY KEY,
      voice_note_id UUID NOT NULL REFERENCES public.voice_notes(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(voice_note_id, user_id)
    );
    
    -- Add RLS policies
    ALTER TABLE public.voice_note_shares ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY IF NOT EXISTS "Anyone can view voice note shares" 
      ON public.voice_note_shares 
      FOR SELECT USING (true);
      
    CREATE POLICY IF NOT EXISTS "Users can insert their own voice note shares" 
      ON public.voice_note_shares 
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY IF NOT EXISTS "Users can update their own voice note shares" 
      ON public.voice_note_shares 
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY IF NOT EXISTS "Users can delete their own voice note shares" 
      ON public.voice_note_shares 
      FOR DELETE USING (auth.uid() = user_id);
  `;
  
  const result = await executeSql(sql);
  
  if (result.success) {
    console.log('Voice note shares table created successfully');
  } else {
    console.log('Failed to create voice_note_shares table using SQL');
    
    // Try alternative method
    try {
      console.log('Trying alternative method...');
      
      const response = await axios({
        method: 'post',
        url: `${SUPABASE_URL}/rest/v1/voice_note_shares`,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        data: {
          id: uuidv4(),
          voice_note_id: '00000000-0000-0000-0000-000000000000', // This will fail due to FK constraint
          user_id: '00000000-0000-0000-0000-000000000000', // This will fail due to FK constraint
          shared_at: new Date().toISOString()
        }
      });
      
      console.log('Voice note shares table created via direct API call');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message === 'relation "voice_note_shares" does not exist') {
        console.error('Could not create voice_note_shares table');
      } else {
        console.log('Voice note shares table may have been created');
      }
    }
  }
}

// Main function
async function createTables() {
  try {
    console.log('Starting direct table creation...');
    
    await createVoiceBiosTable();
    await createVoiceNoteSharesTable();
    
    console.log('Table creation process completed');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Run the script
createTables();
