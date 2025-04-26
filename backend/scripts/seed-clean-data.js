/**
 * Ripply Clean Mock Data Seeding Script
 * 
 * This script populates the Supabase database with clean, consistent mock data for testing.
 * It creates users, voice notes, follows, likes, comments, tags, voice bios, and shares.
 * 
 * Usage:
 * 1. Make sure your .env file has the correct Supabase credentials
 * 2. Run: node scripts/seed-clean-data.js
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../src/config/supabase');

// Configuration
const USERS_COUNT = 10;
const VOICE_NOTES_PER_USER_MIN = 2;
const VOICE_NOTES_PER_USER_MAX = 8;
const FOLLOWS_PER_USER_MIN = 2;
const FOLLOWS_PER_USER_MAX = 6;
const LIKES_PER_VOICE_NOTE_MIN = 0;
const LIKES_PER_VOICE_NOTE_MAX = 15;
const COMMENTS_PER_VOICE_NOTE_MIN = 0;
const COMMENTS_PER_VOICE_NOTE_MAX = 8;
const PLAYS_PER_VOICE_NOTE_MIN = 5;
const PLAYS_PER_VOICE_NOTE_MAX = 50;
const TAGS_PER_VOICE_NOTE_MIN = 1;
const TAGS_PER_VOICE_NOTE_MAX = 3;
const SHARES_PER_VOICE_NOTE_MIN = 0;
const SHARES_PER_VOICE_NOTE_MAX = 10;
const VOICE_BIO_PROBABILITY = 0.7; // 70% chance of having a voice bio

// Sample data pools
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn', 'Avery', 'Dakota'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const voiceNoteTitles = [
  'Morning Thoughts', 'Late Night Reflections', 'Coffee Break Ideas', 
  'Shower Thoughts', 'Commute Musings', 'Weekend Plans', 
  'Book Recommendations', 'Movie Review', 'Song of the Day',
  'Travel Memories', 'Cooking Adventure', 'Workout Motivation',
  'Productivity Tips', 'Life Update', 'Random Story',
  'Dream Journal', 'Funny Moment', 'Tech Talk',
  'Nature Sounds', 'City Ambience'
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
  'Storyteller through sound'
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
  'I completely agree'
];
const tags = [
  'thoughts', 'ideas', 'motivation', 'inspiration', 'life',
  'music', 'books', 'movies', 'travel', 'food',
  'fitness', 'health', 'tech', 'science', 'art',
  'nature', 'city', 'work', 'education', 'philosophy'
];
const voiceBioTranscripts = [
  "Hey there! Thanks for checking out my profile.",
  "Welcome to my Ripply profile! I'm excited to share my thoughts with you.",
  "This is my voice bio. I use Ripply to connect with like-minded people.",
  "I love creating voice notes about topics I'm passionate about.",
  "Follow me for regular updates on my life and thoughts.",
  "I'm using Ripply to document my journey and share my experiences.",
  "Thanks for stopping by! Hope you enjoy my voice notes.",
  "I believe in the power of voice to convey emotion and authenticity.",
  "I'm all about sharing genuine moments through audio.",
  "My voice notes are a window into my world. Hope you enjoy them!"
];

// Avatar and cover image URLs
const avatarImages = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/men/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/women/3.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'https://randomuser.me/api/portraits/men/4.jpg',
  'https://randomuser.me/api/portraits/women/5.jpg',
  'https://randomuser.me/api/portraits/men/5.jpg'
];

const coverImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=1200&auto=format&fit=crop'
];

const backgroundImages = [
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557682260-96773eb01377?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557683304-673a23048d34?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557683325-3ba8f0df79de?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557683304-673a23048d34?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557683325-3ba8f0df79de?w=600&auto=format&fit=crop'
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
    
    // Create profile photos array
    const profilePhotos = [];
    const photoCount = getRandomInt(0, 3);
    for (let j = 0; j < photoCount; j++) {
      profilePhotos.push({
        id: uuidv4(),
        url: getRandomElement(avatarImages)
      });
    }
    
    users.push({
      id: uuidv4(),
      username: username,
      display_name: displayName,
      email: `${username}@example.com`,
      bio: getRandomElement(bios),
      avatar_url: avatarImages[i % avatarImages.length],
      cover_photo_url: coverImages[i % coverImages.length],
      is_verified: getRandomBoolean(0.3), // 30% chance of being verified
      profile_photos: profilePhotos,
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
    const potentialFollowings = users.filter(u => u.id !== follower.id);
    const followingsCount = Math.min(
      getRandomInt(FOLLOWS_PER_USER_MIN, FOLLOWS_PER_USER_MAX),
      potentialFollowings.length
    );
    
    // Randomly select users to follow
    const selectedFollowings = getRandomElements(potentialFollowings, followingsCount, followingsCount);
    
    for (const following of selectedFollowings) {
      follows.push({
        id: uuidv4(),
        follower_id: follower.id,
        following_id: following.id,
        created_at: getRandomDate(
          new Date(Math.max(new Date(follower.created_at), new Date(following.created_at))),
          new Date()
        )
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
    // Get potential users who can like (excluding the creator)
    const potentialLikers = users.filter(u => u.id !== voiceNote.user_id);
    const likersCount = Math.min(
      getRandomInt(LIKES_PER_VOICE_NOTE_MIN, LIKES_PER_VOICE_NOTE_MAX),
      potentialLikers.length
    );
    
    // Randomly select users to like the voice note
    const selectedLikers = getRandomElements(potentialLikers, likersCount, likersCount);
    
    for (const liker of selectedLikers) {
      likes.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: liker.id,
        created_at: getRandomDate(
          new Date(Math.max(new Date(liker.created_at), new Date(voiceNote.created_at))),
          new Date()
        )
      });
    }
  }
  
  // Insert likes in batches to avoid hitting API limits
  const batchSize = 100;
  for (let i = 0; i < likes.length; i += batchSize) {
    const batch = likes.slice(i, i + batchSize);
    const { error } = await supabase
      .from('voice_note_likes')
      .insert(batch);
    
    if (error) {
      console.error(`Error creating likes batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
  }
  
  console.log(`Created ${likes.length} likes`);
  return likes;
}

// Create comments for voice notes
async function createComments(users, voiceNotes) {
  console.log('Creating comments...');
  
  const allComments = [];
  
  for (const voiceNote of voiceNotes) {
    // Get potential users who can comment (excluding the creator)
    const potentialCommenters = users.filter(u => u.id !== voiceNote.user_id);
    const commentersCount = Math.min(
      getRandomInt(COMMENTS_PER_VOICE_NOTE_MIN, COMMENTS_PER_VOICE_NOTE_MAX),
      potentialCommenters.length
    );
    
    // Randomly select users to comment on the voice note
    const selectedCommenters = getRandomElements(potentialCommenters, commentersCount, commentersCount);
    
    for (const commenter of selectedCommenters) {
      const createdAt = getRandomDate(
        new Date(Math.max(new Date(commenter.created_at), new Date(voiceNote.created_at))),
        new Date()
      );
      
      allComments.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: commenter.id,
        content: getRandomElement(comments),
        created_at: createdAt,
        updated_at: createdAt
      });
    }
  }
  
  // Insert comments in batches to avoid hitting API limits
  const batchSize = 100;
  for (let i = 0; i < allComments.length; i += batchSize) {
    const batch = allComments.slice(i, i + batchSize);
    const { error } = await supabase
      .from('voice_note_comments')
      .insert(batch);
    
    if (error) {
      console.error(`Error creating comments batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
  }
  
  console.log(`Created ${allComments.length} comments`);
  return allComments;
}

// Create plays (listens) for voice notes
async function createPlays(users, voiceNotes) {
  console.log('Creating plays...');
  
  const plays = [];
  
  for (const voiceNote of voiceNotes) {
    const playsCount = getRandomInt(PLAYS_PER_VOICE_NOTE_MIN, PLAYS_PER_VOICE_NOTE_MAX);
    
    for (let i = 0; i < playsCount; i++) {
      // 70% chance of having a user associated with the play
      const hasUser = getRandomBoolean(0.7);
      let userId = null;
      
      if (hasUser) {
        // Randomly select a user
        const randomUser = getRandomElement(users);
        userId = randomUser.id;
      }
      
      plays.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: userId,
        created_at: getRandomDate(new Date(voiceNote.created_at), new Date())
      });
    }
  }
  
  // Insert plays in batches to avoid hitting API limits
  const batchSize = 100;
  for (let i = 0; i < plays.length; i += batchSize) {
    const batch = plays.slice(i, i + batchSize);
    const { error } = await supabase
      .from('voice_note_plays')
      .insert(batch);
    
    if (error) {
      console.error(`Error creating plays batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
  }
  
  console.log(`Created ${plays.length} plays`);
  return plays;
}

// Create tags for voice notes
async function createTags(voiceNotes) {
  console.log('Creating tags...');
  
  const voiceNoteTags = [];
  
  for (const voiceNote of voiceNotes) {
    const tagsCount = getRandomInt(TAGS_PER_VOICE_NOTE_MIN, TAGS_PER_VOICE_NOTE_MAX);
    const selectedTags = getRandomElements(tags, tagsCount, tagsCount);
    
    for (const tag of selectedTags) {
      voiceNoteTags.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        tag_name: tag.toLowerCase(),
        created_at: getRandomDate(new Date(voiceNote.created_at), new Date())
      });
    }
  }
  
  // Insert tags in batches to avoid hitting API limits
  const batchSize = 100;
  for (let i = 0; i < voiceNoteTags.length; i += batchSize) {
    const batch = voiceNoteTags.slice(i, i + batchSize);
    const { error } = await supabase
      .from('voice_note_tags')
      .insert(batch);
    
    if (error) {
      console.error(`Error creating tags batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
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
    if (Math.random() < VOICE_BIO_PROBABILITY) {
      voiceBios.push({
        id: uuidv4(),
        user_id: user.id,
        duration: getRandomInt(15, 60), // 15 seconds to 1 minute
        audio_url: `https://storage.example.com/voice-bios/${user.id}.mp3`, // Placeholder URL
        transcript: getRandomElement(voiceBioTranscripts),
        created_at: getRandomDate(new Date(user.created_at), new Date()),
        updated_at: getRandomDate(new Date(user.created_at), new Date())
      });
    }
  }
  
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

// Create shares for voice notes
async function createShares(users, voiceNotes) {
  console.log('Creating voice note shares...');
  
  const shares = [];
  
  for (const voiceNote of voiceNotes) {
    // Get potential users who can share (excluding the creator)
    const potentialSharers = users.filter(u => u.id !== voiceNote.user_id);
    const sharersCount = Math.min(
      getRandomInt(SHARES_PER_VOICE_NOTE_MIN, SHARES_PER_VOICE_NOTE_MAX),
      potentialSharers.length
    );
    
    // Randomly select users to share the voice note
    const selectedSharers = getRandomElements(potentialSharers, sharersCount, sharersCount);
    
    for (const sharer of selectedSharers) {
      const sharedAt = getRandomDate(
        new Date(Math.max(new Date(sharer.created_at), new Date(voiceNote.created_at))),
        new Date()
      );
      
      shares.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: sharer.id,
        shared_at: sharedAt,
        created_at: sharedAt,
        updated_at: sharedAt
      });
    }
  }
  
  // Insert shares in batches to avoid hitting API limits
  const batchSize = 100;
  for (let i = 0; i < shares.length; i += batchSize) {
    const batch = shares.slice(i, i + batchSize);
    const { error } = await supabase
      .from('voice_note_shares')
      .insert(batch);
    
    if (error) {
      console.error(`Error creating shares batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
  }
  
  console.log(`Created ${shares.length} voice note shares`);
  return shares;
}

// Main function to seed the database
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
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
    
    // Create likes
    await createLikes(users, voiceNotes);
    
    // Create comments
    await createComments(users, voiceNotes);
    
    // Create plays
    await createPlays(users, voiceNotes);
    
    // Create tags
    await createTags(voiceNotes);
    
    // Create voice bios
    await createVoiceBios(users);
    
    // Create shares
    await createShares(users, voiceNotes);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
