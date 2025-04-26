// Script to add mock users to the existing Supabase database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/.env' });

async function addMockUsers() {
  // Check for Supabase URL and key
  const supabaseUrl = process.env.SUPABASE_URL || 'https://gnphvflakmyisimwnyai.supabase.co';
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseKey) {
    console.error('Missing Supabase key. Please check your .env file.');
    process.exit(1);
  }
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Connected to Supabase at:', supabaseUrl);
  
  try {
    // Add mock users
    console.log('Adding mock users...');
    
    // Check if users already exist
    const { data: existingUsers, error: userCheckError } = await supabase
      .from('users')
      .select('username')
      .in('username', ['user1', 'user2', 'user3', 'prometheus']);
    
    if (userCheckError) {
      console.error('Error checking existing users:', userCheckError);
      return;
    }
    
    const existingUsernames = existingUsers.map(user => user.username);
    console.log('Existing users:', existingUsernames.join(', ') || 'None');
    
    // Add new users
    const usersToAdd = [];
    
    // User 1 - Regular user with profile picture
    if (!existingUsernames.includes('user1')) {
      usersToAdd.push({
        username: 'user1',
        display_name: 'John Smith',
        email: 'john@example.com',
        bio: 'Music lover and podcast enthusiast',
        avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg'
      });
    }
    
    // User 2 - Regular user with profile picture
    if (!existingUsernames.includes('user2')) {
      usersToAdd.push({
        username: 'user2',
        display_name: 'Sarah Johnson',
        email: 'sarah@example.com',
        bio: 'Voice artist and content creator',
        avatar_url: 'https://randomuser.me/api/portraits/women/2.jpg'
      });
    }
    
    // User 3 - Regular user with profile picture
    if (!existingUsernames.includes('user3')) {
      usersToAdd.push({
        username: 'user3',
        display_name: 'Alex Chen',
        email: 'alex@example.com',
        bio: 'Tech enthusiast and audio engineer',
        avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg'
      });
    }
    
    // User 4 - Prometheus User WITHOUT profile picture
    if (!existingUsernames.includes('prometheus')) {
      usersToAdd.push({
        username: 'prometheus',
        display_name: 'Prometheus User',
        email: 'prometheus@example.com',
        bio: 'Bringing knowledge to humanity',
        avatar_url: null
      });
    }
    
    // Add users if there are any to add
    if (usersToAdd.length > 0) {
      const { data: newUsers, error: insertError } = await supabase
        .from('users')
        .insert(usersToAdd)
        .select();
      
      if (insertError) {
        console.error('Error adding users:', insertError);
      } else {
        console.log(`Added ${newUsers.length} new users:`);
        newUsers.forEach(user => {
          console.log(`- ${user.username} (${user.display_name}): ${user.avatar_url ? 'Has profile picture' : 'NO profile picture'}`);
        });
      }
    } else {
      console.log('No new users to add.');
    }
    
    // Now add some voice notes for each user
    console.log('\nAdding voice notes...');
    
    // Get user IDs
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .in('username', ['user1', 'user2', 'user3', 'prometheus']);
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    // Map usernames to IDs
    const userIdMap = {};
    users.forEach(user => {
      userIdMap[user.username] = user.id;
    });
    
    // Check existing voice notes
    const { data: existingNotes, error: noteCheckError } = await supabase
      .from('voice_notes')
      .select('title, user_id');
    
    if (noteCheckError) {
      console.error('Error checking existing voice notes:', noteCheckError);
      return;
    }
    
    // Create a set of existing note keys (title + user_id)
    const existingNoteKeys = new Set();
    existingNotes.forEach(note => {
      existingNoteKeys.add(`${note.title}-${note.user_id}`);
    });
    
    // Prepare voice notes to add
    const voiceNotesToAdd = [];
    
    // Voice notes for User 1
    if (userIdMap.user1) {
      const user1Id = userIdMap.user1;
      
      if (!existingNoteKeys.has(`Morning Thoughts-${user1Id}`)) {
        voiceNotesToAdd.push({
          user_id: user1Id,
          title: 'Morning Thoughts',
          duration: 45,
          audio_url: 'https://example.com/audio/morning.mp3',
          background_image: 'https://source.unsplash.com/random/800x600/?morning'
        });
      }
      
      if (!existingNoteKeys.has(`Jazz Review-${user1Id}`)) {
        voiceNotesToAdd.push({
          user_id: user1Id,
          title: 'Jazz Review',
          duration: 120,
          audio_url: 'https://example.com/audio/jazz.mp3'
        });
      }
    }
    
    // Voice notes for User 2
    if (userIdMap.user2) {
      const user2Id = userIdMap.user2;
      
      if (!existingNoteKeys.has(`Meditation Guide-${user2Id}`)) {
        voiceNotesToAdd.push({
          user_id: user2Id,
          title: 'Meditation Guide',
          duration: 300,
          audio_url: 'https://example.com/audio/meditation.mp3',
          background_image: 'https://source.unsplash.com/random/800x600/?meditation'
        });
      }
    }
    
    // Voice notes for User 3
    if (userIdMap.user3) {
      const user3Id = userIdMap.user3;
      
      if (!existingNoteKeys.has(`Tech News Recap-${user3Id}`)) {
        voiceNotesToAdd.push({
          user_id: user3Id,
          title: 'Tech News Recap',
          duration: 180,
          audio_url: 'https://example.com/audio/tech.mp3',
          background_image: 'https://source.unsplash.com/random/800x600/?technology'
        });
      }
    }
    
    // Voice notes for Prometheus User
    if (userIdMap.prometheus) {
      const prometheusId = userIdMap.prometheus;
      
      if (!existingNoteKeys.has(`The Gift of Knowledge-${prometheusId}`)) {
        voiceNotesToAdd.push({
          user_id: prometheusId,
          title: 'The Gift of Knowledge',
          duration: 240,
          audio_url: 'https://example.com/audio/knowledge.mp3',
          background_image: 'https://source.unsplash.com/random/800x600/?knowledge'
        });
      }
      
      if (!existingNoteKeys.has(`Wisdom of the Ages-${prometheusId}`)) {
        voiceNotesToAdd.push({
          user_id: prometheusId,
          title: 'Wisdom of the Ages',
          duration: 180,
          audio_url: 'https://example.com/audio/wisdom.mp3'
        });
      }
    }
    
    // Add voice notes if there are any to add
    if (voiceNotesToAdd.length > 0) {
      const { data: newNotes, error: insertNoteError } = await supabase
        .from('voice_notes')
        .insert(voiceNotesToAdd)
        .select();
      
      if (insertNoteError) {
        console.error('Error adding voice notes:', insertNoteError);
      } else {
        console.log(`Added ${newNotes.length} new voice notes:`);
        newNotes.forEach(note => {
          const username = Object.keys(userIdMap).find(key => userIdMap[key] === note.user_id);
          console.log(`- "${note.title}" by ${username}`);
        });
      }
    } else {
      console.log('No new voice notes to add.');
    }
    
    console.log('\nMock data setup complete!');
    
  } catch (error) {
    console.error('Error setting up mock data:', error);
  }
}

addMockUsers();
