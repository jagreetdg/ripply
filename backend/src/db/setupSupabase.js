// Script to set up the Supabase database schema and sample data
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');
require('dotenv').config();

async function setupSupabaseSchema() {
  try {
    console.log(`Connecting to Supabase at: ${process.env.SUPABASE_URL}`);
    
    // Since we can't create tables directly through the JavaScript client,
    // we'll check if tables exist and insert sample data if they do
    
    // Check if users table exists
    console.log('Checking if database schema exists...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      if (usersError.code === '42P01') {
        console.error('\x1b[31mERROR: Database schema is not set up in Supabase.\x1b[0m');
        console.error('\x1b[33mPlease follow these steps to set up the schema:\x1b[0m');
        console.error('1. Go to the Supabase dashboard: https://app.supabase.com');
        console.error('2. Select your project');
        console.error('3. Go to the SQL Editor');
        console.error('4. Create a new query');
        console.error('5. Copy and paste the SQL from the file below:');
        console.error(`   ${path.join(__dirname, 'supabase-schema-export.sql')}`);
        console.error('6. Execute the SQL query');
        console.error('7. Run this setup script again to create sample data');
        console.error('\nYou can also run the exportSchema.js script to see the SQL:');
        console.error('   node src/db/exportSchema.js');
        return;
      } else {
        console.error('\x1b[31mError checking database schema:\x1b[0m', usersError);
        console.error('\x1b[33mPlease check your Supabase credentials in the .env file.\x1b[0m');
        return;
      }
    }
    
    console.log('\x1b[32mDatabase schema exists in Supabase. Proceeding with sample data creation...\x1b[0m');
    
    // Check if we already have sample data
    const { data: existingUsers, error: existingUsersError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', 'testuser')
      .limit(1);
    
    if (existingUsersError) {
      console.error('\x1b[31mError checking for existing users:\x1b[0m', existingUsersError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('\x1b[33mSample data already exists. Skipping sample data creation.\x1b[0m');
      console.log('\x1b[32mYour Supabase database is ready to use!\x1b[0m');
      return;
    }
    
    // Create sample data
    await createSampleData();
    
  } catch (error) {
    console.error('Error setting up Supabase schema:', error);
  }
}

async function createSampleData() {
  try {
    console.log('Creating sample data...');
    
    // Create test users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          username: 'testuser',
          display_name: 'Test User',
          email: 'test@example.com',
          bio: 'This is a test user account'
        },
        {
          username: 'jane_doe',
          display_name: 'Jane Doe',
          email: 'jane@example.com',
          bio: 'Voice note enthusiast'
        },
        {
          username: 'john_smith',
          display_name: 'John Smith',
          email: 'john@example.com',
          bio: 'Audio creator'
        }
      ])
      .select();
    
    if (usersError) {
      console.error('Error creating test users:', usersError);
      return;
    }
    
    console.log(`Created ${users.length} test users`);
    
    // Create test voice notes
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
      console.error('Error creating test voice notes:', voiceNotesError);
      return;
    }
    
    console.log(`Created ${voiceNotes.length} test voice notes`);
    
    // Add tags to voice notes
    const tagsData = [];
    const sampleTags = ['music', 'podcast', 'story', 'news', 'comedy', 'education'];
    
    for (const note of voiceNotes) {
      // Add 2-3 random tags to each voice note
      const numTags = Math.floor(Math.random() * 2) + 2;
      const noteTags = [...sampleTags].sort(() => 0.5 - Math.random()).slice(0, numTags);
      
      for (const tag of noteTags) {
        tagsData.push({
          voice_note_id: note.id,
          tag_name: tag
        });
      }
    }
    
    const { error: tagsError } = await supabase
      .from('voice_note_tags')
      .insert(tagsData);
    
    if (tagsError) {
      console.error('Error adding tags:', tagsError);
    } else {
      console.log(`Added ${tagsData.length} tags to voice notes`);
    }
    
    // Create follow relationships
    const followsData = [];
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < users.length; j++) {
        if (i !== j) { // Don't follow yourself
          followsData.push({
            follower_id: users[i].id,
            following_id: users[j].id
          });
        }
      }
    }
    
    const { error: followsError } = await supabase
      .from('follows')
      .insert(followsData);
    
    if (followsError) {
      console.error('Error creating follow relationships:', followsError);
    } else {
      console.log(`Created ${followsData.length} follow relationships`);
    }
    
    // Add some likes to voice notes
    const likesData = [];
    for (const note of voiceNotes) {
      for (const user of users) {
        // 50% chance of liking each note
        if (Math.random() > 0.5) {
          likesData.push({
            voice_note_id: note.id,
            user_id: user.id
          });
        }
      }
    }
    
    const { error: likesError } = await supabase
      .from('voice_note_likes')
      .insert(likesData);
    
    if (likesError) {
      console.error('Error adding likes:', likesError);
    } else {
      console.log(`Added ${likesData.length} likes to voice notes`);
    }
    
    // Add some comments to voice notes
    const commentsData = [];
    const sampleComments = [
      'Great voice note!',
      'I enjoyed listening to this.',
      'Very informative, thanks for sharing!',
      'Could you make more like this?',
      'This was really helpful.'
    ];
    
    for (const note of voiceNotes) {
      for (const user of users) {
        // 30% chance of commenting on each note
        if (Math.random() > 0.7) {
          commentsData.push({
            voice_note_id: note.id,
            user_id: user.id,
            content: sampleComments[Math.floor(Math.random() * sampleComments.length)]
          });
        }
      }
    }
    
    const { error: commentsError } = await supabase
      .from('voice_note_comments')
      .insert(commentsData);
    
    if (commentsError) {
      console.error('Error adding comments:', commentsError);
    } else {
      console.log(`Added ${commentsData.length} comments to voice notes`);
    }
    
    // Add play counts to voice notes
    const playsData = [];
    for (const note of voiceNotes) {
      // Add 5-20 plays for each note
      const numPlays = Math.floor(Math.random() * 16) + 5;
      
      for (let i = 0; i < numPlays; i++) {
        // 70% chance of plays being from a logged-in user
        const user = Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : null;
        
        playsData.push({
          voice_note_id: note.id,
          user_id: user ? user.id : null
        });
      }
    }
    
    const { error: playsError } = await supabase
      .from('voice_note_plays')
      .insert(playsData);
    
    if (playsError) {
      console.error('Error adding play counts:', playsError);
    } else {
      console.log(`Added ${playsData.length} plays to voice notes`);
    }
    
    console.log('Sample data created successfully!');
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Run the setup function
setupSupabaseSchema()
  .then(() => {
    console.log('\x1b[32mSetup process completed!\x1b[0m');
  })
  .catch(error => {
    console.error('\x1b[31mUnexpected error during setup:\x1b[0m', error);
  });
