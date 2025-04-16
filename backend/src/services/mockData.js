/**
 * Mock data service for development
 * This simulates database operations while we set up the actual Supabase connection
 */

// Mock users
const users = [
  {
    id: '1',
    username: 'sarah_music',
    display_name: 'Sarah',
    email: 'sarah@example.com',
    avatar_url: null,
    cover_photo_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    bio: 'Music producer and songwriter 🎵',
    voice_bio_url: null,
    is_verified: true,
    created_at: '2025-03-01T00:00:00Z',
    updated_at: '2025-03-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'mike_thoughts',
    display_name: 'Mike',
    email: 'mike@example.com',
    avatar_url: null,
    cover_photo_url: null,
    bio: 'Sharing thoughts and ideas',
    voice_bio_url: null,
    is_verified: false,
    created_at: '2025-03-02T00:00:00Z',
    updated_at: '2025-03-02T00:00:00Z'
  },
  {
    id: '3',
    username: 'travel_junkie',
    display_name: 'Emma',
    email: 'emma@example.com',
    avatar_url: null,
    cover_photo_url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0',
    bio: 'Travel enthusiast ✈️',
    voice_bio_url: null,
    is_verified: false,
    created_at: '2025-03-03T00:00:00Z',
    updated_at: '2025-03-03T00:00:00Z'
  }
];

// Mock voice notes
const voiceNotes = [
  {
    id: '1',
    user_id: '1',
    title: '🎵 New song idea - let me know what you think!',
    duration: 120,
    audio_url: 'https://example.com/audio/song1.mp3',
    background_image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    created_at: '2025-04-01T00:00:00Z',
    updated_at: '2025-04-01T00:00:00Z',
    likes: 2341,
    comments: 156,
    plays: 15723,
    tags: ['music', 'songwriting', 'acoustic', 'indie', 'newmusic']
  },
  {
    id: '2',
    user_id: '2',
    title: 'Quick life update ✨',
    duration: 45,
    audio_url: 'https://example.com/audio/update1.mp3',
    background_image: null,
    created_at: '2025-04-02T00:00:00Z',
    updated_at: '2025-04-02T00:00:00Z',
    likes: 892,
    comments: 73,
    plays: 3421,
    tags: ['life', 'update', 'personal', 'journey']
  },
  {
    id: '3',
    user_id: '3',
    title: '🌊 Ocean sounds from my morning walk',
    duration: 90,
    audio_url: 'https://example.com/audio/ocean1.mp3',
    background_image: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0',
    created_at: '2025-04-03T00:00:00Z',
    updated_at: '2025-04-03T00:00:00Z',
    likes: 1243,
    comments: 87,
    plays: 5632,
    tags: ['travel', 'ocean', 'nature', 'sounds', 'morning', 'walk']
  },
  {
    id: '4',
    user_id: '1',
    title: 'Thoughts on the latest tech trends 💻',
    duration: 180,
    audio_url: 'https://example.com/audio/tech1.mp3',
    background_image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
    created_at: '2025-04-04T00:00:00Z',
    updated_at: '2025-04-04T00:00:00Z',
    likes: 1876,
    comments: 134,
    plays: 7821,
    tags: ['tech', 'trends', 'ai', 'innovation', 'future', 'gadgets', 'review']
  }
];

// Mock likes
const likes = [
  { id: '1', voice_note_id: '1', user_id: '2', created_at: '2025-04-05T00:00:00Z' },
  { id: '2', voice_note_id: '1', user_id: '3', created_at: '2025-04-05T00:00:00Z' },
  { id: '3', voice_note_id: '2', user_id: '1', created_at: '2025-04-05T00:00:00Z' },
  { id: '4', voice_note_id: '3', user_id: '2', created_at: '2025-04-05T00:00:00Z' }
];

// Mock comments
const comments = [
  { 
    id: '1', 
    voice_note_id: '1', 
    user_id: '2', 
    content: 'This sounds amazing!', 
    created_at: '2025-04-05T00:00:00Z',
    updated_at: '2025-04-05T00:00:00Z'
  },
  { 
    id: '2', 
    voice_note_id: '1', 
    user_id: '3', 
    content: 'Love the melody!', 
    created_at: '2025-04-05T00:00:00Z',
    updated_at: '2025-04-05T00:00:00Z'
  },
  { 
    id: '3', 
    voice_note_id: '2', 
    user_id: '1', 
    content: 'Thanks for sharing!', 
    created_at: '2025-04-05T00:00:00Z',
    updated_at: '2025-04-05T00:00:00Z'
  }
];

// Mock plays
const plays = [
  { id: '1', voice_note_id: '1', user_id: '2', created_at: '2025-04-05T00:00:00Z' },
  { id: '2', voice_note_id: '1', user_id: '3', created_at: '2025-04-05T00:00:00Z' },
  { id: '3', voice_note_id: '2', user_id: '1', created_at: '2025-04-05T00:00:00Z' },
  { id: '4', voice_note_id: '3', user_id: '2', created_at: '2025-04-05T00:00:00Z' }
];

// Mock follows
const follows = [
  { id: '1', follower_id: '1', following_id: '2', created_at: '2025-04-05T00:00:00Z' },
  { id: '2', follower_id: '1', following_id: '3', created_at: '2025-04-05T00:00:00Z' },
  { id: '3', follower_id: '2', following_id: '1', created_at: '2025-04-05T00:00:00Z' },
  { id: '4', follower_id: '3', following_id: '1', created_at: '2025-04-05T00:00:00Z' }
];

// Mock data service functions
const mockDataService = {
  // User functions
  getUsers: () => {
    return Promise.resolve([...users]);
  },
  
  getUserById: (userId) => {
    const user = users.find(u => u.id === userId);
    return Promise.resolve(user || null);
  },
  
  updateUser: (userId, userData) => {
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return Promise.resolve(null);
    
    const updatedUser = { ...users[index], ...userData, updated_at: new Date().toISOString() };
    users[index] = updatedUser;
    return Promise.resolve(updatedUser);
  },
  
  // Voice note functions
  getVoiceNotes: () => {
    return Promise.resolve([...voiceNotes]);
  },
  
  getVoiceNoteById: (voiceNoteId) => {
    const voiceNote = voiceNotes.find(vn => vn.id === voiceNoteId);
    return Promise.resolve(voiceNote || null);
  },
  
  getVoiceNotesByUserId: (userId) => {
    const userVoiceNotes = voiceNotes.filter(vn => vn.user_id === userId);
    return Promise.resolve(userVoiceNotes);
  },
  
  createVoiceNote: (voiceNoteData) => {
    const newVoiceNote = {
      id: (voiceNotes.length + 1).toString(),
      ...voiceNoteData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes: 0,
      comments: 0,
      plays: 0
    };
    
    voiceNotes.push(newVoiceNote);
    return Promise.resolve(newVoiceNote);
  },
  
  updateVoiceNote: (voiceNoteId, voiceNoteData) => {
    const index = voiceNotes.findIndex(vn => vn.id === voiceNoteId);
    if (index === -1) return Promise.resolve(null);
    
    const updatedVoiceNote = { 
      ...voiceNotes[index], 
      ...voiceNoteData, 
      updated_at: new Date().toISOString() 
    };
    
    voiceNotes[index] = updatedVoiceNote;
    return Promise.resolve(updatedVoiceNote);
  },
  
  deleteVoiceNote: (voiceNoteId) => {
    const index = voiceNotes.findIndex(vn => vn.id === voiceNoteId);
    if (index === -1) return Promise.resolve(false);
    
    voiceNotes.splice(index, 1);
    return Promise.resolve(true);
  },
  
  // Like functions
  likeVoiceNote: (voiceNoteId, userId) => {
    const existingLike = likes.find(l => l.voice_note_id === voiceNoteId && l.user_id === userId);
    if (existingLike) return Promise.resolve(existingLike);
    
    const newLike = {
      id: (likes.length + 1).toString(),
      voice_note_id: voiceNoteId,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    
    likes.push(newLike);
    
    // Update voice note likes count
    const voiceNoteIndex = voiceNotes.findIndex(vn => vn.id === voiceNoteId);
    if (voiceNoteIndex !== -1) {
      voiceNotes[voiceNoteIndex].likes += 1;
    }
    
    return Promise.resolve(newLike);
  },
  
  unlikeVoiceNote: (voiceNoteId, userId) => {
    const index = likes.findIndex(l => l.voice_note_id === voiceNoteId && l.user_id === userId);
    if (index === -1) return Promise.resolve(false);
    
    likes.splice(index, 1);
    
    // Update voice note likes count
    const voiceNoteIndex = voiceNotes.findIndex(vn => vn.id === voiceNoteId);
    if (voiceNoteIndex !== -1 && voiceNotes[voiceNoteIndex].likes > 0) {
      voiceNotes[voiceNoteIndex].likes -= 1;
    }
    
    return Promise.resolve(true);
  },
  
  // Comment functions
  getComments: (voiceNoteId) => {
    const voiceNoteComments = comments.filter(c => c.voice_note_id === voiceNoteId);
    return Promise.resolve(voiceNoteComments);
  },
  
  addComment: (voiceNoteId, userId, content) => {
    const newComment = {
      id: (comments.length + 1).toString(),
      voice_note_id: voiceNoteId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    comments.push(newComment);
    
    // Update voice note comments count
    const voiceNoteIndex = voiceNotes.findIndex(vn => vn.id === voiceNoteId);
    if (voiceNoteIndex !== -1) {
      voiceNotes[voiceNoteIndex].comments += 1;
    }
    
    return Promise.resolve(newComment);
  },
  
  // Play functions
  recordPlay: (voiceNoteId, userId) => {
    const newPlay = {
      id: (plays.length + 1).toString(),
      voice_note_id: voiceNoteId,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    
    plays.push(newPlay);
    
    // Update voice note plays count
    const voiceNoteIndex = voiceNotes.findIndex(vn => vn.id === voiceNoteId);
    if (voiceNoteIndex !== -1) {
      voiceNotes[voiceNoteIndex].plays += 1;
    }
    
    return Promise.resolve(newPlay);
  },
  
  // Follow functions
  followUser: (followerId, followingId) => {
    const existingFollow = follows.find(f => f.follower_id === followerId && f.following_id === followingId);
    if (existingFollow) return Promise.resolve(existingFollow);
    
    const newFollow = {
      id: (follows.length + 1).toString(),
      follower_id: followerId,
      following_id: followingId,
      created_at: new Date().toISOString()
    };
    
    follows.push(newFollow);
    return Promise.resolve(newFollow);
  },
  
  unfollowUser: (followerId, followingId) => {
    const index = follows.findIndex(f => f.follower_id === followerId && f.following_id === followingId);
    if (index === -1) return Promise.resolve(false);
    
    follows.splice(index, 1);
    return Promise.resolve(true);
  },
  
  getFollowers: (userId) => {
    const userFollowers = follows.filter(f => f.following_id === userId);
    return Promise.resolve(userFollowers);
  },
  
  getFollowing: (userId) => {
    const userFollowing = follows.filter(f => f.follower_id === userId);
    return Promise.resolve(userFollowing);
  }
};

module.exports = mockDataService;
