// Script to add mock users via the frontend API
const fetch = require('node-fetch');

// API configuration
const API_URL = "http://localhost:3000/api";
const ENDPOINTS = {
  USERS: "/users",
  VOICE_NOTES: "/voice-notes",
  COMMENTS: "/voice-notes/:id/comments",
};

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

async function addMockUsers() {
  try {
    console.log('Adding mock users via API...');
    
    // Check if the API is available
    try {
      await fetch(`${API_URL}/health`);
      console.log('Backend API is available');
    } catch (error) {
      console.error('Backend API is not available. Make sure the server is running on http://localhost:3000');
      process.exit(1);
    }
    
    // Mock users to add
    const mockUsers = [
      {
        username: 'user1',
        display_name: 'John Smith',
        email: 'john@example.com',
        bio: 'Music lover and podcast enthusiast',
        avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg'
      },
      {
        username: 'user2',
        display_name: 'Sarah Johnson',
        email: 'sarah@example.com',
        bio: 'Voice artist and content creator',
        avatar_url: 'https://randomuser.me/api/portraits/women/2.jpg'
      },
      {
        username: 'user3',
        display_name: 'Alex Chen',
        email: 'alex@example.com',
        bio: 'Tech enthusiast and audio engineer',
        avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg'
      },
      {
        username: 'prometheus',
        display_name: 'Prometheus User',
        email: 'prometheus@example.com',
        bio: 'Bringing knowledge to humanity',
        avatar_url: null
      }
    ];
    
    // Add each user
    for (const user of mockUsers) {
      try {
        // Check if user already exists
        const existingUsers = await apiRequest(`${ENDPOINTS.USERS}/username/${user.username}`);
        
        if (existingUsers && existingUsers.id) {
          console.log(`User '${user.username}' already exists with ID: ${existingUsers.id}`);
          continue;
        }
        
        // Create user
        const newUser = await apiRequest(ENDPOINTS.USERS, 'POST', user);
        console.log(`Created user '${user.username}' with ID: ${newUser.id}`);
        
        // Add voice notes for this user
        await addVoiceNotesForUser(newUser.id, user.username);
      } catch (error) {
        console.error(`Error adding user '${user.username}':`, error.message);
      }
    }
    
    console.log('Mock data setup complete!');
  } catch (error) {
    console.error('Error setting up mock data:', error);
  }
}

async function addVoiceNotesForUser(userId, username) {
  // Define voice notes based on username
  let voiceNotes = [];
  
  if (username === 'user1') {
    voiceNotes = [
      {
        title: 'Morning Thoughts',
        duration: 45,
        audio_url: 'https://example.com/audio/morning.mp3',
        background_image: 'https://source.unsplash.com/random/800x600/?morning'
      },
      {
        title: 'Jazz Review',
        duration: 120,
        audio_url: 'https://example.com/audio/jazz.mp3'
      }
    ];
  } else if (username === 'user2') {
    voiceNotes = [
      {
        title: 'Meditation Guide',
        duration: 300,
        audio_url: 'https://example.com/audio/meditation.mp3',
        background_image: 'https://source.unsplash.com/random/800x600/?meditation'
      }
    ];
  } else if (username === 'user3') {
    voiceNotes = [
      {
        title: 'Tech News Recap',
        duration: 180,
        audio_url: 'https://example.com/audio/tech.mp3',
        background_image: 'https://source.unsplash.com/random/800x600/?technology'
      }
    ];
  } else if (username === 'prometheus') {
    voiceNotes = [
      {
        title: 'The Gift of Knowledge',
        duration: 240,
        audio_url: 'https://example.com/audio/knowledge.mp3',
        background_image: 'https://source.unsplash.com/random/800x600/?knowledge'
      },
      {
        title: 'Wisdom of the Ages',
        duration: 180,
        audio_url: 'https://example.com/audio/wisdom.mp3'
      }
    ];
  }
  
  // Add each voice note
  for (const voiceNote of voiceNotes) {
    try {
      const noteWithUserId = {
        ...voiceNote,
        user_id: userId
      };
      
      const newNote = await apiRequest(ENDPOINTS.VOICE_NOTES, 'POST', noteWithUserId);
      console.log(`Added voice note '${voiceNote.title}' for user '${username}'`);
      
      // Add comments to this voice note
      if (username === 'user1' || username === 'prometheus') {
        await addCommentsToVoiceNote(newNote.id);
      }
    } catch (error) {
      console.error(`Error adding voice note '${voiceNote.title}' for user '${username}':`, error.message);
    }
  }
}

async function addCommentsToVoiceNote(voiceNoteId) {
  // Define some sample comments
  const comments = [
    {
      content: 'Great insights! I really enjoyed this.',
      user_id: null // Will be filled in with user2's ID
    },
    {
      content: 'Thanks for sharing your thoughts!',
      user_id: null // Will be filled in with user3's ID
    }
  ];
  
  // Get user IDs for commenters
  try {
    const user2 = await apiRequest(`${ENDPOINTS.USERS}/username/user2`);
    const user3 = await apiRequest(`${ENDPOINTS.USERS}/username/user3`);
    
    if (user2 && user2.id) {
      comments[0].user_id = user2.id;
    }
    
    if (user3 && user3.id) {
      comments[1].user_id = user3.id;
    }
    
    // Add each comment
    for (const comment of comments) {
      if (!comment.user_id) continue;
      
      try {
        const endpoint = ENDPOINTS.COMMENTS.replace(':id', voiceNoteId);
        const newComment = await apiRequest(endpoint, 'POST', comment);
        console.log(`Added comment to voice note ${voiceNoteId}`);
      } catch (error) {
        console.error(`Error adding comment to voice note ${voiceNoteId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error getting user IDs for comments:', error.message);
  }
}

// Install node-fetch if it's not already installed
const { execSync } = require('child_process');
try {
  require.resolve('node-fetch');
  console.log('node-fetch is already installed');
} catch (e) {
  console.log('Installing node-fetch...');
  execSync('npm install node-fetch');
  console.log('node-fetch installed successfully');
}

// Run the script
addMockUsers();
