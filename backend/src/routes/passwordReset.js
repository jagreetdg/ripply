/**
 * Password reset and account recovery routes
 */
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimiter = require('../middleware/rateLimiter');

// Apply rate limiting to password reset requests
router.use('/request-reset', rateLimiter(3, 60 * 60 * 1000, 'Too many password reset requests, please try again later'));

// Request password reset
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Check if user exists
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email);
    
    if (error) throw error;
    
    // Always return success even if email doesn't exist (security best practice)
    if (!users || users.length === 0) {
      return res.status(200).json({ 
        message: 'If your email exists in our system, you will receive a password reset link shortly' 
      });
    }
    
    const user = users[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store reset token in database
    const { error: updateError } = await supabase
      .from('password_resets')
      .upsert({
        user_id: user.id,
        token: resetToken,
        expires_at: resetTokenExpiry.toISOString()
      });
    
    if (updateError) throw updateError;
    
    // In a real app, you would send an email here with the reset link
    // For this implementation, we'll just return the token in the response
    // In production, NEVER return the token in the response
    
    // TODO: Implement email sending service
    console.log(`Password reset requested for ${email}. Reset token: ${resetToken}`);
    
    res.status(200).json({ 
      message: 'If your email exists in our system, you will receive a password reset link shortly',
      // Remove this in production:
      debug: {
        resetToken,
        resetUrl: `https://ripply-app.netlify.app/auth/reset-password?token=${resetToken}`
      }
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Find the reset token
    const { data: resetData, error } = await supabase
      .from('password_resets')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();
    
    if (error || !resetData) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Check if token is expired
    if (new Date(resetData.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', resetData.user_id);
    
    if (updateError) throw updateError;
    
    // Delete the used reset token
    await supabase
      .from('password_resets')
      .delete()
      .eq('token', token);
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
