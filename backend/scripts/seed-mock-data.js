/**
 * Ripply Mock Data Seeding Script
 * 
 * This script populates the Supabase database with realistic mock data for testing.
 * It creates users, voice notes, follows, likes, comments, and tags.
 * 
 * Usage:
 * 1. Make sure your .env file has the correct Supabase credentials
 * 2. Run: node scripts/seed-mock-data.js
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../src/config/supabase');

// Configuration
const USERS_COUNT = 10;
const VOICE_NOTES_PER_USER_MIN = 3;
const VOICE_NOTES_PER_USER_MAX = 8;
const FOLLOWS_PER_USER_MIN = 2;
const FOLLOWS_PER_USER_MAX = 7;
const LIKES_PER_VOICE_NOTE_MIN = 0;
const LIKES_PER_VOICE_NOTE_MAX = 15;
const COMMENTS_PER_VOICE_NOTE_MIN = 0;
const COMMENTS_PER_VOICE_NOTE_MAX = 8;
const PLAYS_PER_VOICE_NOTE_MIN = 5;
const PLAYS_PER_VOICE_NOTE_MAX = 50;
const TAGS_PER_VOICE_NOTE_MIN = 1;
const TAGS_PER_VOICE_NOTE_MAX = 5;

// Sample data pools
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn', 'Avery', 'Dakota', 'Skyler', 'Reese', 'Finley', 'Rowan', 'Charlie', 'Emerson', 'Phoenix', 'Sage', 'Blake', 'Hayden'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
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
  'Sleep Sounds', 'Focus Music', 'Party Mix'
];
const bios = [
  'Voice note enthusiast | Sharing thoughts and vibes',
  'Audiophile and storyteller',
  'Capturing moments through sound',
  'Thoughts become clearer when spoken',
  'ASMR and ambient sound creator',
  'Podcaster by day, voice note creator by night',
  'Sharing life\'s soundtrack one note at a time',
  'Voice is the original social media',
  'Finding my voice in a noisy world',
  'Audio diary keeper',
  'Turning thoughts into sound waves',
  'Life sounds better when shared',
  'Voice first, text second',
  'Creating audio memories',
  'Sound explorer'
];
const commentContents = [
  'Love this!', 'Great voice note!', 'This resonated with me',
  'Thanks for sharing', 'Made my day', 'Totally agree',
  'Interesting perspective', 'Never thought of it that way', 'Mind blown',
  'Can\'t wait to hear more', 'Your voice is so soothing', 'This is gold',
  'Saving this for later', 'Shared with my friends', 'On point!',
  'This is exactly what I needed today', 'You\'ve got a talent for this', 'More please!',
  'First time listener, instant follower', 'Your best one yet'
];
const tags = [
  'thoughts', 'ideas', 'motivation', 'inspiration', 'reflection',
  'story', 'music', 'ambient', 'asmr', 'nature',
  'city', 'travel', 'food', 'fitness', 'productivity',
  'mindfulness', 'sleep', 'focus', 'comedy', 'review',
  'recommendation', 'daily', 'morning', 'night', 'weekend',
  'work', 'creativity', 'technology', 'science', 'art',
  'culture', 'politics', 'news', 'history', 'philosophy',
  'psychology', 'education', 'language', 'business', 'finance',
  'health', 'wellness', 'lifestyle', 'fashion', 'beauty',
  'sports', 'gaming', 'entertainment', 'books', 'movies'
];

// Helper functions
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomElements = (array, min, max) => {
  const count = getRandomInt(min, max);
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getRandomDate = (startDate, endDate) => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime).toISOString();
};

// Create users
const createUsers = async () => {
  console.log('Creating users...');
  const users = [];

  for (let i = 0; i < USERS_COUNT; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${getRandomInt(1, 999)}`;
    
    const user = {
      id: uuidv4(),
      username,
      display_name: `${firstName} ${lastName}`,
      email: `${username}@example.com`,
      bio: getRandomElement(bios),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      cover_photo_url: `https://picsum.photos/seed/${username}/1200/400`,
      is_verified: Math.random() > 0.8, // 20% chance of being verified
      created_at: getRandomDate(new Date(2024, 0, 1), new Date(2025, 3, 1)),
      updated_at: getRandomDate(new Date(2024, 0, 1), new Date(2025, 3, 1))
    };
    
    users.push(user);
  }

  // Insert users into the database
  const { data, error } = await supabase
    .from('users')
    .upsert(users)
    .select();

  if (error) {
    console.error('Error creating users:', error);
    return [];
  }

  console.log(`Created ${data.length} users`);
  return data;
};

// Create voice notes
const createVoiceNotes = async (users) => {
  console.log('Creating voice notes...');
  const voiceNotes = [];

  for (const user of users) {
    const notesCount = getRandomInt(VOICE_NOTES_PER_USER_MIN, VOICE_NOTES_PER_USER_MAX);
    
    for (let i = 0; i < notesCount; i++) {
      const title = getRandomElement(voiceNoteTitles);
      const duration = getRandomInt(15, 180); // 15 seconds to 3 minutes
      const createdAt = getRandomDate(new Date(2024, 0, 1), new Date(2025, 3, 1));
      
      const voiceNote = {
        id: uuidv4(),
        user_id: user.id,
        title: `${title} ${i + 1}`,
        duration,
        audio_url: `https://example.com/audio/${user.username}_${i}.mp3`,
        background_image: Math.random() > 0.3 ? `https://picsum.photos/seed/${user.username}${i}/500/500` : null, // 70% chance of having a background image
        created_at: createdAt,
        updated_at: createdAt
      };
      
      voiceNotes.push(voiceNote);
    }
  }

  // Insert voice notes into the database
  const { data, error } = await supabase
    .from('voice_notes')
    .upsert(voiceNotes)
    .select();

  if (error) {
    console.error('Error creating voice notes:', error);
    return [];
  }

  console.log(`Created ${data.length} voice notes`);
  return data;
};

// Create follows relationships
const createFollows = async (users) => {
  console.log('Creating follow relationships...');
  const follows = [];

  for (const follower of users) {
    // Get a random number of users to follow
    const followCount = getRandomInt(FOLLOWS_PER_USER_MIN, FOLLOWS_PER_USER_MAX);
    const potentialFollowees = users.filter(user => user.id !== follower.id);
    const followees = getRandomElements(potentialFollowees, Math.min(followCount, potentialFollowees.length), Math.min(followCount, potentialFollowees.length));
    
    for (const followee of followees) {
      follows.push({
        id: uuidv4(),
        follower_id: follower.id,
        following_id: followee.id,
        created_at: getRandomDate(new Date(2024, 0, 1), new Date(2025, 3, 1))
      });
    }
  }

  // Insert follows into the database
  const { data, error } = await supabase
    .from('follows')
    .upsert(follows)
    .select();

  if (error) {
    console.error('Error creating follows:', error);
    return [];
  }

  console.log(`Created ${data.length} follow relationships`);
  return data;
};

// Create likes for voice notes
const createLikes = async (users, voiceNotes) => {
  console.log('Creating likes...');
  const likes = [];

  for (const voiceNote of voiceNotes) {
    // Get a random number of users to like this voice note
    const likeCount = getRandomInt(LIKES_PER_VOICE_NOTE_MIN, LIKES_PER_VOICE_NOTE_MAX);
    // Don't let the owner like their own voice note
    const potentialLikers = users.filter(user => user.id !== voiceNote.user_id);
    const likers = getRandomElements(potentialLikers, Math.min(likeCount, potentialLikers.length), Math.min(likeCount, potentialLikers.length));
    
    for (const liker of likers) {
      likes.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: liker.id,
        created_at: getRandomDate(new Date(voiceNote.created_at), new Date(2025, 3, 1))
      });
    }
  }

  // Insert likes into the database
  const { data, error } = await supabase
    .from('voice_note_likes')
    .upsert(likes)
    .select();

  if (error) {
    console.error('Error creating likes:', error);
    return [];
  }

  console.log(`Created ${data.length} likes`);
  return data;
};

// Create comments for voice notes
const createComments = async (users, voiceNotes) => {
  console.log('Creating comments...');
  const comments = [];

  for (const voiceNote of voiceNotes) {
    // Get a random number of comments for this voice note
    const commentCount = getRandomInt(COMMENTS_PER_VOICE_NOTE_MIN, COMMENTS_PER_VOICE_NOTE_MAX);
    
    for (let i = 0; i < commentCount; i++) {
      // Randomly select a user to comment (could be the owner or another user)
      const commenter = getRandomElement(users);
      
      comments.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: commenter.id,
        content: getRandomElement(commentContents),
        created_at: getRandomDate(new Date(voiceNote.created_at), new Date(2025, 3, 1)),
        updated_at: getRandomDate(new Date(voiceNote.created_at), new Date(2025, 3, 1))
      });
    }
  }

  // Insert comments into the database
  const { data, error } = await supabase
    .from('voice_note_comments')
    .upsert(comments)
    .select();

  if (error) {
    console.error('Error creating comments:', error);
    return [];
  }

  console.log(`Created ${data.length} comments`);
  return data;
};

// Create plays for voice notes
const createPlays = async (users, voiceNotes) => {
  console.log('Creating plays...');
  const plays = [];

  for (const voiceNote of voiceNotes) {
    // Get a random number of plays for this voice note
    const playCount = getRandomInt(PLAYS_PER_VOICE_NOTE_MIN, PLAYS_PER_VOICE_NOTE_MAX);
    
    for (let i = 0; i < playCount; i++) {
      // 30% chance of anonymous play (no user_id)
      const isAnonymous = Math.random() > 0.7;
      const player = isAnonymous ? null : getRandomElement(users).id;
      
      plays.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        user_id: player,
        created_at: getRandomDate(new Date(voiceNote.created_at), new Date(2025, 3, 1))
      });
    }
  }

  // Insert plays into the database
  const { data, error } = await supabase
    .from('voice_note_plays')
    .upsert(plays)
    .select();

  if (error) {
    console.error('Error creating plays:', error);
    return [];
  }

  console.log(`Created ${data.length} plays`);
  return data;
};

// Create tags for voice notes
const createTags = async (voiceNotes) => {
  console.log('Creating tags...');
  const voiceNoteTags = [];

  for (const voiceNote of voiceNotes) {
    // Get a random number of tags for this voice note
    const tagCount = getRandomInt(TAGS_PER_VOICE_NOTE_MIN, TAGS_PER_VOICE_NOTE_MAX);
    const selectedTags = getRandomElements(tags, tagCount, tagCount);
    
    for (const tag of selectedTags) {
      voiceNoteTags.push({
        id: uuidv4(),
        voice_note_id: voiceNote.id,
        tag_name: tag,
        created_at: new Date(voiceNote.created_at).toISOString()
      });
    }
  }

  // Insert tags into the database
  const { data, error } = await supabase
    .from('voice_note_tags')
    .upsert(voiceNoteTags)
    .select();

  if (error) {
    console.error('Error creating tags:', error);
    return [];
  }

  console.log(`Created ${data.length} tags`);
  return data;
};

// Main function to run the seeding
const seedDatabase = async () => {
  console.log('Starting database seeding...');
  
  try {
    // First, clear existing data (optional, comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await supabase.from('voice_note_tags').delete().neq('id', 'placeholder');
    await supabase.from('voice_note_plays').delete().neq('id', 'placeholder');
    await supabase.from('voice_note_comments').delete().neq('id', 'placeholder');
    await supabase.from('voice_note_likes').delete().neq('id', 'placeholder');
    await supabase.from('voice_notes').delete().neq('id', 'placeholder');
    await supabase.from('follows').delete().neq('id', 'placeholder');
    await supabase.from('users').delete().neq('id', 'placeholder');
    
    // Create data in the correct order to maintain referential integrity
    const users = await createUsers();
    const voiceNotes = await createVoiceNotes(users);
    await createFollows(users);
    await createLikes(users, voiceNotes);
    await createComments(users, voiceNotes);
    await createPlays(users, voiceNotes);
    await createTags(voiceNotes);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Run the seeding function
seedDatabase();
