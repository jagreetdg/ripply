// Script to get voice notes from Supabase
const supabase = require('../config/supabase');
require('dotenv').config();

async function getVoiceNotes() {
  try {
    console.log(`Connecting to Supabase at: ${process.env.SUPABASE_URL}`);
    
    // Get all voice notes
    const { data: voiceNotes, error } = await supabase
      .from('voice_notes')
      .select('*');
    
    if (error) {
      console.error('Error fetching voice notes:', error);
      return;
    }
    
    console.log('Voice notes in database:');
    console.log(JSON.stringify(voiceNotes, null, 2));
    
    // Check if we need to create sample voice notes
    if (voiceNotes.length === 0) {
      console.log('No voice notes found. Creating sample voice notes...');
      await createSampleVoiceNotes();
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function createSampleVoiceNotes() {
  try {
    // Get users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, display_name');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    // Create voice notes for each user
    const voiceNotesData = [];
    for (const user of users) {
      voiceNotesData.push({
        user_id: user.id,
        title: `${user.display_name}'s Voice Note`,
        duration: Math.floor(Math.random() * 180) + 30, // 30-210 seconds
        audio_url: `https://example.com/audio/${user.username}_sample.mp3`,
        background_image: `https://example.com/images/${user.username}_bg.jpg`
      });
    }
    
    const { data: voiceNotes, error: voiceNotesError } = await supabase
      .from('voice_notes')
      .insert(voiceNotesData)
      .select();
    
    if (voiceNotesError) {
      console.error('Error creating voice notes:', voiceNotesError);
      return;
    }
    
    console.log(`Created ${voiceNotes.length} voice notes.`);
    console.log(JSON.stringify(voiceNotes, null, 2));
    
  } catch (error) {
    console.error('Error creating sample voice notes:', error);
  }
}

// Run the function
getVoiceNotes();
