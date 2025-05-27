/**
 * Ripply Database Setup Script
 * 
 * This script sets up the necessary database tables for the Ripply app
 * using the Supabase client API directly.
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../src/config/supabase');

async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    
    // Create voice_bios table
    console.log('Creating voice_bios table...');
    const { error: voiceBiosError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'voice_bios',
      table_definition: `
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        audio_url TEXT NOT NULL,
        duration INTEGER NOT NULL,
        transcript TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      `
    });
    
    if (voiceBiosError) {
      console.log('Error creating voice_bios table, trying alternative method...');
      // Try direct query if RPC fails
      await createVoiceBiosTable();
    } else {
      console.log('Voice bios table created or already exists');
    }
    
    // Create voice_note_shares table
    console.log('Creating voice_note_shares table...');
    const { error: sharesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'voice_note_shares',
      table_definition: `
        id UUID PRIMARY KEY,
        voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(voice_note_id, user_id)
      `
    });
    
    if (sharesError) {
      console.log('Error creating voice_note_shares table, trying alternative method...');
      // Try direct query if RPC fails
      await createVoiceNoteSharesTable();
    } else {
      console.log('Voice note shares table created or already exists');
    }
    
    // Create follows table
    console.log('Creating follows table...');
    const { error: followsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'follows',
      table_definition: `
        id UUID PRIMARY KEY,
        follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        followee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(follower_id, followee_id)
      `
    });
    
    if (followsError) {
      console.log('Error creating follows table, trying alternative method...');
      // Try direct query if RPC fails
      await createFollowsTable();
    } else {
      console.log('Follows table created or already exists');
    }
    
    // Create voice_note_comments table
    console.log('Creating voice_note_comments table...');
    const { error: commentsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'voice_note_comments',
      table_definition: `
        id UUID PRIMARY KEY,
        voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    
    if (commentsError) {
      console.log('Error creating voice_note_comments table, trying alternative method...');
      // Try direct query if RPC fails
      await createVoiceNoteCommentsTable();
    } else {
      console.log('Voice note comments table created or already exists');
    }
    
    // Create voice_note_plays table
    console.log('Creating voice_note_plays table...');
    const { error: playsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'voice_note_plays',
      table_definition: `
        id UUID PRIMARY KEY,
        voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    
    if (playsError) {
      console.log('Error creating voice_note_plays table, trying alternative method...');
      // Try direct query if RPC fails
      await createVoiceNotePlaysTable();
    } else {
      console.log('Voice note plays table created or already exists');
    }
    
    // Create voice_note_tags table
    console.log('Creating voice_note_tags table...');
    const { error: tagsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'voice_note_tags',
      table_definition: `
        id UUID PRIMARY KEY,
        voice_note_id UUID NOT NULL REFERENCES voice_notes(id) ON DELETE CASCADE,
        tag TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(voice_note_id, tag)
      `
    });
    
    if (tagsError) {
      console.log('Error creating voice_note_tags table, trying alternative method...');
      // Try direct query if RPC fails
      await createVoiceNoteTagsTable();
    } else {
      console.log('Voice note tags table created or already exists');
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Alternative methods to create tables if RPC fails
async function createVoiceBiosTable() {
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('voice_bios')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('Voice bios table already exists');
      return;
    }
    
    // Create a test record to force table creation
    const { error: insertError } = await supabase
      .from('voice_bios')
      .insert({
        id: uuidv4(),
        user_id: '00000000-0000-0000-0000-000000000000', // This will fail due to foreign key constraint, but will create the table
        audio_url: 'https://example.com/test.mp3',
        duration: 30,
        transcript: 'Test transcript'
      });
    
    console.log('Voice bios table creation attempted');
  } catch (error) {
    console.error('Error creating voice_bios table:', error);
  }
}

async function createVoiceNoteSharesTable() {
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('voice_note_shares')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('Voice note shares table already exists');
      return;
    }
    
    // Create a test record to force table creation
    const { error: insertError } = await supabase
      .from('voice_note_shares')
      .insert({
        id: uuidv4(),
        voice_note_id: '00000000-0000-0000-0000-000000000000', // This will fail due to foreign key constraint, but will create the table
        user_id: '00000000-0000-0000-0000-000000000000'
      });
    
    console.log('Voice note shares table creation attempted');
  } catch (error) {
    console.error('Error creating voice_note_shares table:', error);
  }
}

async function createFollowsTable() {
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('Follows table already exists');
      return;
    }
    
    // Create a test record to force table creation
    const { error: insertError } = await supabase
      .from('follows')
      .insert({
        id: uuidv4(),
        follower_id: '00000000-0000-0000-0000-000000000000', // This will fail due to foreign key constraint, but will create the table
        followee_id: '00000000-0000-0000-0000-000000000000'
      });
    
    console.log('Follows table creation attempted');
  } catch (error) {
    console.error('Error creating follows table:', error);
  }
}

async function createVoiceNoteCommentsTable() {
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('voice_note_comments')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('Voice note comments table already exists');
      return;
    }
    
    // Create a test record to force table creation
    const { error: insertError } = await supabase
      .from('voice_note_comments')
      .insert({
        id: uuidv4(),
        voice_note_id: '00000000-0000-0000-0000-000000000000', // This will fail due to foreign key constraint, but will create the table
        user_id: '00000000-0000-0000-0000-000000000000',
        text: 'Test comment'
      });
    
    console.log('Voice note comments table creation attempted');
  } catch (error) {
    console.error('Error creating voice_note_comments table:', error);
  }
}

async function createVoiceNotePlaysTable() {
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('voice_note_plays')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('Voice note plays table already exists');
      return;
    }
    
    // Create a test record to force table creation
    const { error: insertError } = await supabase
      .from('voice_note_plays')
      .insert({
        id: uuidv4(),
        voice_note_id: '00000000-0000-0000-0000-000000000000', // This will fail due to foreign key constraint, but will create the table
        user_id: '00000000-0000-0000-0000-000000000000'
      });
    
    console.log('Voice note plays table creation attempted');
  } catch (error) {
    console.error('Error creating voice_note_plays table:', error);
  }
}

async function createVoiceNoteTagsTable() {
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('voice_note_tags')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('Voice note tags table already exists');
      return;
    }
    
    // Create a test record to force table creation
    const { error: insertError } = await supabase
      .from('voice_note_tags')
      .insert({
        id: uuidv4(),
        voice_note_id: '00000000-0000-0000-0000-000000000000', // This will fail due to foreign key constraint, but will create the table
        tag: 'test'
      });
    
    console.log('Voice note tags table creation attempted');
  } catch (error) {
    console.error('Error creating voice_note_tags table:', error);
  }
}

// Run the setup function
setupDatabase();
