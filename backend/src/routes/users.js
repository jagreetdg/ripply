const express = require('express');
const router = express.Router();
// Use mock data service for development
const mockDataService = require('../services/mockData');

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user from mock data service
    const user = await mockDataService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Remove any sensitive fields that shouldn't be updated directly
    delete updates.id;
    delete updates.email;
    delete updates.created_at;
    
    // Update user using mock data service
    const updatedUser = await mockDataService.updateUser(userId, updates);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get followers using mock data service
    const follows = await mockDataService.getFollowers(userId);
    
    // Get user data for each follower
    const followersWithUserData = await Promise.all(follows.map(async (follow) => {
      const user = await mockDataService.getUserById(follow.follower_id);
      return {
        follower_id: follow.follower_id,
        users: user
      };
    }));
    
    res.status(200).json(followersWithUserData);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get users that a user is following
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get following using mock data service
    const follows = await mockDataService.getFollowing(userId);
    
    // Get user data for each following
    const followingWithUserData = await Promise.all(follows.map(async (follow) => {
      const user = await mockDataService.getUserById(follow.following_id);
      return {
        following_id: follow.following_id,
        users: user
      };
    }));
    
    res.status(200).json(followingWithUserData);
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Follow a user
router.post('/:userId/follow', async (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.body;
    
    // Follow user using mock data service
    const follow = await mockDataService.followUser(followerId, userId);
    
    res.status(201).json(follow);
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unfollow a user
router.post('/:userId/unfollow', async (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.body;
    
    // Unfollow user using mock data service
    const success = await mockDataService.unfollowUser(followerId, userId);
    
    if (!success) {
      return res.status(404).json({ message: 'Follow relationship not found' });
    }
    
    res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get voice notes by user
router.get('/:userId/voice-notes', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get voice notes by user ID using mock data service
    const voiceNotes = await mockDataService.getVoiceNotesByUserId(userId);
    
    // Sort by created_at (newest first)
    voiceNotes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Apply pagination
    const paginatedNotes = voiceNotes.slice(offset, offset + parseInt(limit));
    
    res.status(200).json({
      data: paginatedNotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: voiceNotes.length
      }
    });
  } catch (error) {
    console.error('Error fetching user voice notes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
