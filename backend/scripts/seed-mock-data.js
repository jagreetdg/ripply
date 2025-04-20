/**
 * Ripply Mock Data Seeding Script
 * 
 * This script populates the Supabase database with realistic mock data for testing.
 * It creates users, voice notes, follows, likes, comments, tags, and voice bios.
 * 
 * Usage:
 * 1. Make sure your .env file has the correct Supabase credentials
 * 2. Run: node scripts/seed-mock-data.js
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../src/config/supabase');
const fs = require('fs');
const path = require('path');

// Configuration
const USERS_COUNT = 15;
const VOICE_NOTES_PER_USER_MIN = 3;
const VOICE_NOTES_PER_USER_MAX = 12;
const FOLLOWS_PER_USER_MIN = 3;
const FOLLOWS_PER_USER_MAX = 10;
const LIKES_PER_VOICE_NOTE_MIN = 0;
const LIKES_PER_VOICE_NOTE_MAX = 25;
const COMMENTS_PER_VOICE_NOTE_MIN = 0;
const COMMENTS_PER_VOICE_NOTE_MAX = 12;
const PLAYS_PER_VOICE_NOTE_MIN = 10;
const PLAYS_PER_VOICE_NOTE_MAX = 100;
const TAGS_PER_VOICE_NOTE_MIN = 1;
const TAGS_PER_VOICE_NOTE_MAX = 5;
const SHARES_PER_VOICE_NOTE_MIN = 0;
const SHARES_PER_VOICE_NOTE_MAX = 15;
const VOICE_BIO_PROBABILITY = 0.8; // 80% chance of having a voice bio

// Sample data pools
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn', 'Avery', 'Dakota', 'Skyler', 'Reese', 'Finley', 'Rowan', 'Charlie', 'Emerson', 'Phoenix', 'Sage', 'Blake', 'Hayden', 'Kai', 'Jaden', 'Remi', 'Harley', 'Parker'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris'];
const voiceNoteTitles = [
  'Morning Thoughts', 'Late Night Reflections', 'Coffee Break Ideas', 
  'Shower Thoughts', 'Commute Musings', 'Weekend Plans', 
  'Book Recommendations', 'Movie Review', 'Song of the Day',
  'Travel Memories', 'Cooking Adventure', 'Workout Motivation',
  'Productivity Tips', 'Life Update', 'Random Story',
  'Dream Journal', 'Funny Moment', 'Tech Talk',
  'Nature Sounds', 'City Ambience', 'Rainy Day Vibes',
  'Beach Waves', 'Forest Sounds', 'Cafe Atmosphere',
  'Inspirational Quote', 'Daily Affirmation', 'Meditation Guide',
  'Sleep Sounds', 'Focus Music', 'Party Mix',
  'Podcast Recommendations', 'Career Advice', 'Relationship Thoughts',
  'Mental Health Check-in', 'Fitness Journey', 'Travel Plans',
  'Language Learning', 'Coding Progress', 'Art Project',
  'Photography Tips', 'Fashion Finds', 'Home Decor Ideas'
];
const bios = [
  'Voice note enthusiast | Sharing thoughts and vibes',
  'Audiophile and storyteller',
  'Capturing moments through sound',
  'Thoughts become clearer when spoken',
  'ASMR and ambient sound creator',
  'Podcast lover | Voice note creator',
  'Sharing life one voice note at a time',
  'Audio diary keeper | Life observer',
  'Voice is the new text | Embracing audio social media',
  'Storyteller through sound',
  'Musician and voice note creator',
  'Exploring life through audio',
  'Voice notes > text messages',
  'Sharing authentic moments through voice',
  'Audio content creator | Podcast host',
  'Finding my voice in a noisy world',
  'Documenting life through sound',
  'Voice is the window to the soul',
  'Expressing myself through audio',
  'Sound designer and voice note enthusiast'
];
const comments = [
  'Love this!',
  'Great voice note!',
  'This resonates with me so much',
  'Thanks for sharing your thoughts',
  'I needed to hear this today',
  'Your voice is so soothing',
  'Interesting perspective',
  'This made my day',
  'Can you share more on this topic?',
  'I completely agree',
  'This changed my perspective',
  'So relatable!',
  'You articulated this perfectly',
  'I have been thinking about this too',
  'Your voice notes always inspire me',
  'This is exactly what I needed to hear',
  'Such a unique take on this',
  'You have a gift for storytelling',
  'I could listen to your voice notes all day',
  'This is why I love Ripply',
  'Mind blown 🤯',
  'Saving this for later',
  'I have shared this with my friends',
  'Can\'t wait for your next voice note',
  'You should start a podcast',
  'This is the content I\'m here for',
  'Your voice is so calming',
  'I listen to this every morning',
  'This helped me through a tough time',
  'Your authenticity shines through'
];
const tags = [
  'thoughts', 'reflection', 'motivation', 'inspiration', 'mindfulness',
  'creativity', 'productivity', 'wellness', 'selfcare', 'growth',
  'learning', 'career', 'relationships', 'family', 'friends',
  'travel', 'adventure', 'food', 'cooking', 'fitness',
  'health', 'meditation', 'yoga', 'running', 'workout',
  'books', 'movies', 'music', 'art', 'photography',
  'technology', 'coding', 'design', 'fashion', 'beauty',
  'home', 'decor', 'gardening', 'nature', 'outdoors',
  'city', 'urban', 'rural', 'beach', 'mountains',
  'morning', 'night', 'weekend', 'daily', 'routine',
  'goals', 'dreams', 'future', 'past', 'present',
  'gratitude', 'happiness', 'joy', 'peace', 'calm',
  'energy', 'passion', 'purpose', 'meaning', 'values'
];
const voiceBioTranscripts = [
  "Hey there! Thanks for checking out my profile. I'm passionate about sharing moments through voice.",
  "Welcome to my Ripply profile. I'm excited to share my voice notes with you and hear yours too!",
  "Hi everyone, this is my voice bio. Follow me for voice notes about life, creativity, and random thoughts.",
  "Thanks for stopping by. I use Ripply to document my journey and connect with like-minded people.",
  "Hello Ripply community! I'm here to share authentic moments and connect through the power of voice.",
  "Voice is more personal than text. That's why I love Ripply. Follow me for daily voice notes and conversations.",
  "This is my audio space where I share thoughts, ideas, and moments from my daily life. Hope you enjoy!",
  "I believe in the power of voice to convey emotion and authenticity. That's why I'm here on Ripply.",
  "Audio creator, storyteller, and voice note enthusiast. Follow me for content that resonates.",
  "My voice notes are my diary entries. Follow along as I navigate life one audio clip at a time.",
  "I use Ripply to share moments that matter. From daily reflections to creative ideas, it's all here.",
  "Voice notes capture what text can't. Emotion, tone, and authenticity. That's why I love Ripply.",
  "This is my audio journal. Raw, unfiltered, and authentic. Welcome to my Ripply profile!",
  "I'm exploring the world of audio social media. Join me on this journey of voice discovery.",
  "Podcaster, voice note creator, and audio enthusiast. Follow me for content that sounds good."
];
const backgroundImages = [
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85',
  'https://images.unsplash.com/photo-1590523278191-995cbcda646b',
  'https://images.unsplash.com/photo-1579546929662-711aa81148cf',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
  'https://images.unsplash.com/photo-1579546929662-711aa81148cf',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85',
  'https://images.unsplash.com/photo-1590523278191-995cbcda646b',
  'https://images.unsplash.com/photo-1579546929662-711aa81148cf',
  'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85',
  'https://images.unsplash.com/photo-1559825481-12a05cc00344',
  'https://images.unsplash.com/photo-1508614589041-895b88991e3e',
  'https://images.unsplash.com/photo-1531685250784-7569952593d2',
  'https://images.unsplash.com/photo-1604537466608-109fa2f16c3b'
];
const profileImages = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/men/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/women/3.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'https://randomuser.me/api/portraits/men/4.jpg',
  'https://randomuser.me/api/portraits/women/5.jpg',
  'https://randomuser.me/api/portraits/men/5.jpg',
  'https://randomuser.me/api/portraits/women/6.jpg',
  'https://randomuser.me/api/portraits/men/6.jpg',
  'https://randomuser.me/api/portraits/women/7.jpg',
  'https://randomuser.me/api/portraits/men/7.jpg',
  'https://randomuser.me/api/portraits/women/8.jpg'
];
const coverImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
  'https://images.unsplash.com/photo-1470071459604-b2761acb3c5d',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e',
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1',
  'https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9',
  'https://images.unsplash.com/photo-1418489098061-ce87b5dc3aee',
  'https://images.unsplash.com/photo-1498855926480-d98e83099315'
];

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, min, max) {
  const count = getRandomInt(min, max);
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDate(startDate, endDate) {
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();
  const randomTimestamp = startTimestamp + Math.random() * (endTimestamp - startTimestamp);
  return new Date(randomTimestamp).toISOString();
}

function getRandomBoolean(probability = 0.5) {
  return Math.random() < probability;
}

// Create users
async function createUsers() {
  console.log('Creating users...');
  
  const users = [];
  
  for (let i = 0; i < USERS_COUNT; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const displayName = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${getRandomInt(1, 999)}`;
    
    users.push({
      id: uuidv4(),
      username: username,
      display_name: displayName,
      email: `${username}@example.com`,
      bio: getRandomElement(bios),
      avatar_url: profileImages[i % profileImages.length],
      cover_photo_url: coverImages[i % coverImages.length],
      is_verified: getRandomBoolean(0.3), // 30% chance of being verified
      created_at: getRandomDate(new Date('2023-01-01'), new Date('2023-12-31')),
      updated_at: getRandomDate(new Date('2024-01-01'), new Date())
    });
  }
  
  const { error } = await supabase
    .from('users')
    .insert(users);
  
  if (error) {
    console.error('Error creating users:', error);
    return [];
  }
  
  console.log(`Created ${users.length} users`);
  return users;
}

// Create voice notes
async function createVoiceNotes(users) {
  console.log('Creating voice notes...');
  
  const voiceNotes = [];
  
  for (const user of users) {
    const notesCount = getRandomInt(VOICE_NOTES_PER_USER_MIN, VOICE_NOTES_PER_USER_MAX);
    
    for (let i = 0; i < notesCount; i++) {
      const duration = getRandomInt(15, 180); // 15 seconds to 3 minutes
      const createdAt = getRandomDate(new Date(user.created_at), new Date());
      
      voiceNotes.push({
        id: uuidv4(),
        user_id: user.id,
        title: getRandomElement(voiceNoteTitles),
        duration: duration,
        audio_url: `https://storage.example.com/voice-notes/${uuidv4()}.mp3`, // Placeholder URL
        background_image: getRandomBoolean(0.4) ? getRandomElement(backgroundImages) : null, // 40% chance of having a background image
        created_at: createdAt,
        updated_at: getRandomDate(new Date(createdAt), new Date())
      });
    }
  }
  
  const { error } = await supabase
    .from('voice_notes')
    .insert(voiceNotes);
  
  if (error) {
    console.error('Error creating voice notes:', error);
    return [];
  }
  
  console.log(`Created ${voiceNotes.length} voice notes`);
  return voiceNotes;
}

// Create follows relationships
async function createFollows(users) {
  console.log('Creating follows...');
  
  const follows = [];
  
  for (const follower of users) {
    // Get potential users to follow (excluding self)
    const potentialFollowees = users.filter(user => user.id !== follower.id);
    
    // Determine how many users this user will follow
    const followCount = getRandomInt(FOLLOWS_PER_USER_MIN, Math.min(FOLLOWS_PER_USER_MAX, potentialFollowees.length));
    
    // Get random users to follow
    const followees = getRandomElements(potentialFollowees, followCount, followCount);
    
    for (const followee of followees) {
      follows.push({
        id: uuidv4(),
        follower_id: follower.id,
        followee_id: followee.id,
        created_at: getRandomDate(new Date(Math.max(new Date(follower.created_at).getTime(), new Date(followee.created_at).getTime())), new Date())
      });
    }
  }
  
  const { error } = await supabase
    .from('follows')
    .insert(follows);
  
  if (error) {
    console.error('Error creating follows:', error);
    return [];
  }
  
  console.log(`Created ${follows.length} follows`);
  return follows;
}

// Create likes for voice notes
async function createLikes(users, voiceNotes) {
  console.log('Creating likes...');
  
  const likes = [];
  
  for (const voiceNote of voiceNotes) {
    // Get potential users who can like this voice note (excluding the creator)
    const potentialLikers = users.filter(user => user.id !== voiceNote.user_id);
    
    // Determine how many likes this voice note will have
    const likesCount = getRandomInt(LIKES_PER_VOICE_NOTE_MIN, Math.min(LIKES_PER_VOICE_NOTE_MAX, potentialLikers.length));
    
    // Get random users who will like this voice note
    const likers = getRandomElements(potentialLikers, likesCount, likesCount);
    
    for (const liker of likers) {
      likes.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: liker.id,
        created_at: getRandomDate(new Date(Math.max(new Date(liker.created_at).getTime(), new Date(voiceNote.created_at).getTime())), new Date())
      });
    }
  }
  
  const { error } = await supabase
    .from('voice_note_likes')
    .insert(likes);
  
  if (error) {
    console.error('Error creating likes:', error);
    return [];
  }
  
  console.log(`Created ${likes.length} likes`);
  return likes;
}

// Create comments for voice notes
async function createComments(users, voiceNotes) {
  console.log('Creating comments...');
  
  const voiceNoteComments = [];
  
  for (const voiceNote of voiceNotes) {
    // Get potential users who can comment on this voice note
    const potentialCommenters = users.filter(user => true); // Anyone can comment, including the creator
    
    // Determine how many comments this voice note will have
    const commentsCount = getRandomInt(COMMENTS_PER_VOICE_NOTE_MIN, Math.min(COMMENTS_PER_VOICE_NOTE_MAX, potentialCommenters.length));
    
    // Get random users who will comment on this voice note
    const commenters = getRandomElements(potentialCommenters, commentsCount, commentsCount);
    
    for (const commenter of commenters) {
      voiceNoteComments.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: commenter.id,
        text: getRandomElement(comments),
        created_at: getRandomDate(new Date(Math.max(new Date(commenter.created_at).getTime(), new Date(voiceNote.created_at).getTime())), new Date()),
        updated_at: getRandomDate(new Date(Math.max(new Date(commenter.created_at).getTime(), new Date(voiceNote.created_at).getTime())), new Date())
      });
    }
  }
  
  const { error } = await supabase
    .from('voice_note_comments')
    .insert(voiceNoteComments);
  
  if (error) {
    console.error('Error creating comments:', error);
    return [];
  }
  
  console.log(`Created ${voiceNoteComments.length} comments`);
  return voiceNoteComments;
}

// Create plays for voice notes
async function createPlays(users, voiceNotes) {
  console.log('Creating plays...');
  
  const plays = [];
  
  for (const voiceNote of voiceNotes) {
    // Get potential users who can play this voice note
    const potentialPlayers = users.filter(user => true); // Anyone can play, including the creator
    
    // Determine how many plays this voice note will have
    const playsCount = getRandomInt(PLAYS_PER_VOICE_NOTE_MIN, PLAYS_PER_VOICE_NOTE_MAX);
    
    // For each play, randomly select a user (with replacement, as users can play multiple times)
    for (let i = 0; i < playsCount; i++) {
      const player = getRandomElement(potentialPlayers);
      
      plays.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: player.id,
        played_at: getRandomDate(new Date(Math.max(new Date(player.created_at).getTime(), new Date(voiceNote.created_at).getTime())), new Date())
      });
    }
  }
  
  const { error } = await supabase
    .from('voice_note_plays')
    .insert(plays);
  
  if (error) {
    console.error('Error creating plays:', error);
    return [];
  }
  
  console.log(`Created ${plays.length} plays`);
  return plays;
}

// Create tags for voice notes
async function createTags(voiceNotes) {
  console.log('Creating tags...');
  
  const voiceNoteTags = [];
  
  for (const voiceNote of voiceNotes) {
    // Determine how many tags this voice note will have
    const tagsCount = getRandomInt(TAGS_PER_VOICE_NOTE_MIN, TAGS_PER_VOICE_NOTE_MAX);
    
    // Get random tags for this voice note
    const selectedTags = getRandomElements(tags, tagsCount, tagsCount);
    
    for (const tag of selectedTags) {
      voiceNoteTags.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        tag: tag,
        created_at: getRandomDate(new Date(voiceNote.created_at), new Date())
      });
    }
  }
  
  const { error } = await supabase
    .from('voice_note_tags')
    .insert(voiceNoteTags);
  
  if (error) {
    console.error('Error creating tags:', error);
    return [];
  }
  
  console.log(`Created ${voiceNoteTags.length} tags`);
  return voiceNoteTags;
}

// Create voice bios for users
async function createVoiceBios(users) {
  console.log('Creating voice bios...');
  
  const voiceBios = [];
  
  for (const user of users) {
    // 70% of users have a voice bio
    if (Math.random() < 0.7) {
      voiceBios.push({
        id: uuidv4(),
        user_id: user.id,
        duration: getRandomInt(15, 60), // 15 seconds to 1 minute
        audio_url: `https://storage.example.com/voice-bios/${user.id}.mp3`, // Placeholder URL
        transcript: getRandomElement([
          "Hey there! Thanks for checking out my profile.",
          "Welcome to my Ripply profile! I'm excited to share my thoughts with you.",
          "This is my voice bio. I use Ripply to connect with like-minded people.",
          "I love creating voice notes about topics I'm passionate about.",
          "Follow me for regular updates on my life and thoughts.",
          "I'm new to Ripply but loving the platform so far!",
          "This is where I share my authentic self through voice.",
          "Voice is the most personal way to connect. That's why I love Ripply.",
          "I believe in the power of voice to convey emotion and meaning.",
          "Join me on this journey of sharing and connecting through voice."
        ]),
        created_at: getRandomDate(new Date(user.created_at), new Date()),
        updated_at: new Date()
      });
    }
  }
  
  if (voiceBios.length > 0) {
    // Insert the voice bios
    const { error } = await supabase
      .from('voice_bios')
      .insert(voiceBios);
    
    if (error) {
      console.error('Error creating voice bios:', error);
      return [];
    }
    
    console.log(`Created ${voiceBios.length} voice bios`);
    return voiceBios;
  }
  
  return [];
}

// Create shares for voice notes
async function createShares(users, voiceNotes) {
  console.log('Creating voice note shares...');
  
  const shares = [];
  
  for (const voiceNote of voiceNotes) {
    // Get potential users who can share this voice note (excluding the creator)
    const potentialSharers = users.filter(user => user.id !== voiceNote.user_id);
    
    // Determine how many shares this voice note will have
    const sharesCount = getRandomInt(SHARES_PER_VOICE_NOTE_MIN, Math.min(SHARES_PER_VOICE_NOTE_MAX, potentialSharers.length));
    
    // Get random users who will share this voice note
    const sharers = getRandomElements(potentialSharers, sharesCount, sharesCount);
    
    for (const sharer of sharers) {
      shares.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: sharer.id,
        shared_at: getRandomDate(new Date(Math.max(new Date(sharer.created_at).getTime(), new Date(voiceNote.created_at).getTime())), new Date()),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
  
  if (shares.length > 0) {
    // Insert the shares
    const { error } = await supabase
      .from('voice_note_shares')
      .insert(shares);
    
    if (error) {
      console.error('Error creating voice note shares:', error);
      return [];
    }
    
    console.log(`Created ${shares.length} voice note shares`);
    return shares;
  }
  
  return [];
}

// Update users with verification status and profile photos
async function updateUserProfiles(users) {
  console.log('Updating user profiles with verification status and photos...');
  
  const updates = [];
  
  for (const user of users) {
    // 20% of users are verified
    const isVerified = Math.random() < 0.2;
    
    // Generate 1-3 profile photos for each user
    const photoCount = getRandomInt(1, 3);
    const profilePhotos = [];
    
    for (let i = 0; i < photoCount; i++) {
      profilePhotos.push({
        id: uuidv4(),
        url: `https://storage.example.com/profile-photos/${user.id}/${i + 1}.jpg`,
        is_primary: i === 0, // First photo is primary
        created_at: new Date().toISOString()
      });
    }
    
    updates.push({
      id: user.id,
      is_verified: isVerified,
      profile_photos: profilePhotos,
      updated_at: new Date()
    });
  }
  
  // Update users in batches to avoid hitting API limits
  const batchSize = 10;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('users')
      .upsert(batch);
    
    if (error) {
      console.error(`Error updating users batch ${i / batchSize + 1}:`, error);
    }
  }
  
  console.log(`Updated ${updates.length} user profiles`);
}

// Main function to run the seeding
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Create tables if they don't exist
    try {
      console.log('Ensuring database tables exist...');
      
      // Create voice_note_shares table if it doesn't exist
      const { data: tablesData, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', 'voice_note_shares');
      
      if (!tablesError && (!tablesData || tablesData.length === 0)) {
        console.log('Creating voice_note_shares table...');
        
        // Create the table directly
        const { error: createTableError } = await supabase.rpc('create_table_if_not_exists', {
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
        
        if (createTableError) {
          console.error('Error creating voice_note_shares table:', createTableError);
          console.log('Continuing with seeding anyway...');
        }
      }
      
      // Check if voice_bios table exists
      const { data: bioTablesData, error: bioTablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', 'voice_bios');
      
      if (!bioTablesError && (!bioTablesData || bioTablesData.length === 0)) {
        console.log('Creating voice_bios table...');
        
        // Create the table directly
        const { error: createBioTableError } = await supabase.rpc('create_table_if_not_exists', {
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
        
        if (createBioTableError) {
          console.error('Error creating voice_bios table:', createBioTableError);
          console.log('Continuing with seeding anyway...');
        }
      }
    } catch (error) {
      console.error('Error setting up database tables:', error);
      console.log('Continuing with seeding anyway...');
    }
    
    // Create users first
    const users = await createUsers();
    if (users.length === 0) {
      throw new Error('Failed to create users');
    }
    
    // Create voice notes
    const voiceNotes = await createVoiceNotes(users);
    if (voiceNotes.length === 0) {
      throw new Error('Failed to create voice notes');
    }
    
    // Create follows relationships
    await createFollows(users);
    
    // Create likes, comments, plays, and tags
    await createLikes(users, voiceNotes);
    await createComments(users, voiceNotes);
    await createPlays(users, voiceNotes);
    await createTags(voiceNotes);
    
    // Create voice bios
    await createVoiceBios(users);
    
    // Create voice note shares
    await createShares(users, voiceNotes);
    
    // Update user profiles with verification status and photos
    await updateUserProfiles(users);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
