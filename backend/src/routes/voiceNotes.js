const express = require('express');
const router = express.Router();
// Use mock data service for development
const mockDataService = require('../services/mockData');

// Get all voice notes (with pagination)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const offset = (page - 1) * limit;
    
    // Get all voice notes from mock data service
    let voiceNotes = await mockDataService.getVoiceNotes();
    
    // Filter by user if provided
    if (userId) {
      voiceNotes = voiceNotes.filter(note => note.user_id === userId);
    }
    
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
    console.error('Error fetching voice notes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single voice note by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get voice note from mock data service
    const voiceNote = await mockDataService.getVoiceNoteById(id);
    
    if (!voiceNote) {
      return res.status(404).json({ message: 'Voice note not found' });
    }
    
    // Get user data for the voice note
    const user = await mockDataService.getUserById(voiceNote.user_id);
    
    // Combine voice note with user data
    const responseData = {
      ...voiceNote,
      user: user ? {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url
      } : null
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching voice note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new voice note
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      duration, 
      audio_url, 
      user_id, 
      background_image = null,
      tags = []
    } = req.body;
    
    // Validate required fields
    if (!title || !duration || !audio_url || !user_id) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, duration, audio_url, and user_id are required' 
      });
    }
    
    // Create voice note using mock data service
    const voiceNote = await mockDataService.createVoiceNote({
      title,
      duration,
      audio_url,
      user_id,
      background_image,
      tags
    });
    
    res.status(201).json(voiceNote);
  } catch (error) {
    console.error('Error creating voice note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a voice note
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be directly updated
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;
    
    // Update voice note using mock data service
    const updatedVoiceNote = await mockDataService.updateVoiceNote(id, updates);
    
    if (!updatedVoiceNote) {
      return res.status(404).json({ message: 'Voice note not found' });
    }
    
    res.status(200).json(updatedVoiceNote);
  } catch (error) {
    console.error('Error updating voice note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a voice note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete voice note using mock data service
    const success = await mockDataService.deleteVoiceNote(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Voice note not found' });
    }
    
    res.status(200).json({ message: 'Voice note deleted successfully' });
  } catch (error) {
    console.error('Error deleting voice note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like a voice note
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }
    
    // Like voice note using mock data service
    const like = await mockDataService.likeVoiceNote(id, user_id);
    
    res.status(201).json(like);
  } catch (error) {
    console.error('Error liking voice note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unlike a voice note
router.post('/:id/unlike', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }
    
    // Unlike voice note using mock data service
    const success = await mockDataService.unlikeVoiceNote(id, user_id);
    
    if (!success) {
      return res.status(404).json({ message: 'Like not found' });
    }
    
    res.status(200).json({ message: 'Voice note unliked successfully' });
  } catch (error) {
    console.error('Error unliking voice note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record a play for a voice note
router.post('/:id/play', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    // Record play using mock data service
    const play = await mockDataService.recordPlay(id, user_id);
    
    res.status(201).json(play);
  } catch (error) {
    console.error('Error recording play:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get comments for a voice note
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get comments using mock data service
    const comments = await mockDataService.getComments(id);
    
    // Sort by created_at (newest first)
    comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Apply pagination
    const paginatedComments = comments.slice(offset, offset + parseInt(limit));
    
    // Get user data for each comment
    const commentsWithUserData = await Promise.all(paginatedComments.map(async (comment) => {
      const user = await mockDataService.getUserById(comment.user_id);
      return {
        ...comment,
        user: user ? {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        } : null
      };
    }));
    
    res.status(200).json({
      data: commentsWithUserData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: comments.length
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a comment to a voice note
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, content } = req.body;
    
    if (!user_id || !content) {
      return res.status(400).json({ message: 'user_id and content are required' });
    }
    
    // Add comment using mock data service
    const comment = await mockDataService.addComment(id, user_id, content);
    
    // Get user data for the comment
    const user = await mockDataService.getUserById(user_id);
    
    // Combine comment with user data
    const responseData = {
      ...comment,
      user: user ? {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url
      } : null
    };
    
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get voice notes by tag
router.get('/tags/:tagName', async (req, res) => {
  try {
    const { tagName } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('voice_note_tags')
      .select(`
        tag_name,
        voice_notes:voice_note_id (
          *,
          users:user_id (id, username, display_name, avatar_url),
          likes:voice_note_likes (count),
          comments:voice_note_comments (count),
          plays:voice_note_plays (count)
        )
      `, { count: 'exact' })
      .eq('tag_name', tagName.toLowerCase())
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    // Reshape the data to return just the voice notes
    const voiceNotes = data.map(item => item.voice_notes);
    
    res.status(200).json({
      data: voiceNotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('Error fetching voice notes by tag:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
