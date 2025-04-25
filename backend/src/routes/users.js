const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // First check if the user exists without using .single()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return the first user found (should be only one)
    res.status(200).json(data[0]);
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
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, users!follower_id(*)')
      .eq('following_id', userId);
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get users that a user is following
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('follows')
      .select('following_id, users!following_id(*)')
      .eq('follower_id', userId);
    
    if (error) throw error;
    
    res.status(200).json(data);
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
    
    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    
    if (existingFollow) {
      return res.status(400).json({ message: 'Already following this user' });
    }
    
    // Create follow relationship
    const { data, error } = await supabase
      .from('follows')
      .insert([{ follower_id: followerId, following_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
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
    
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', userId);
    
    if (error) throw error;
    
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
    
    const { data, error, count } = await supabase
      .from('voice_notes')
      .select(`
        *,
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count),
        tags:voice_note_tags (tag_name)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);
    
    if (error) throw error;
    
    // Process the data to format tags
    const processedData = data.map(note => {
      // Extract tags from the nested structure
      const tags = note.tags ? note.tags.map(tag => tag.tag_name) : [];
      
      return {
        ...note,
        tags
      };
    });
    
    res.status(200).json({
      data: processedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('Error fetching user voice notes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by username
router.get('/username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // First check if the user exists without using .single()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log(`User not found with username: ${username}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return the first user found (should be only one)
    res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error fetching user by username:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user verification status
router.patch('/:userId/verify', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;
    
    if (isVerified === undefined) {
      return res.status(400).json({ message: 'isVerified field is required' });
    }
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user verification status
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_verified: isVerified,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      if (error.code === '42703') {
        // Column doesn't exist yet
        return res.status(400).json({ 
          message: 'is_verified column does not exist',
          note: 'Please run the SQL script in the Supabase SQL Editor to add the necessary columns'
        });
      }
      throw error;
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error updating user verification status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile photos
router.patch('/:userId/photos', async (req, res) => {
  try {
    const { userId } = req.params;
    const { photos } = req.body;
    
    if (!photos || !Array.isArray(photos)) {
      return res.status(400).json({ message: 'photos array is required' });
    }
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user profile photos
    const { data, error } = await supabase
      .from('users')
      .update({ 
        profile_photos: photos,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      if (error.code === '42703') {
        // Column doesn't exist yet
        return res.status(400).json({ 
          message: 'profile_photos column does not exist',
          note: 'Please run the SQL script in the Supabase SQL Editor to add the necessary columns'
        });
      }
      throw error;
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error updating user profile photos:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
