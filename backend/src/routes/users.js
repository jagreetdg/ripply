const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(data);
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

module.exports = router;
