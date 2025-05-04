/**
 * Account verification routes
 */
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');

// Request email verification
router.post('/request-verification', authenticateToken, async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const user = req.user;
    
    // Check if user is already verified
    if (user.is_verified) {
      return res.status(400).json({ message: 'User is already verified' });
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Store verification token in database
    const { error } = await supabase
      .from('email_verifications')
      .upsert({
        user_id: user.id,
        token: verificationToken,
        expires_at: tokenExpiry.toISOString()
      });
    
    if (error) throw error;
    
    // In a real app, you would send an email here with the verification link
    // For this implementation, we'll just return the token in the response
    // In production, NEVER return the token in the response
    
    // TODO: Implement email sending service
    console.log(`Verification requested for ${user.email}. Verification token: ${verificationToken}`);
    
    res.status(200).json({ 
      message: 'Verification email sent',
      // Remove this in production:
      debug: {
        verificationToken,
        verificationUrl: `https://ripply-app.netlify.app/auth/verify-email?token=${verificationToken}`
      }
    });
  } catch (error) {
    console.error('Error requesting verification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify email with token
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    // Find the verification token
    const { data: verificationData, error } = await supabase
      .from('email_verifications')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();
    
    if (error || !verificationData) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    // Check if token is expired
    if (new Date(verificationData.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Verification token has expired' });
    }
    
    // Update user's verification status
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationData.user_id);
    
    if (updateError) throw updateError;
    
    // Delete the used verification token
    await supabase
      .from('email_verifications')
      .delete()
      .eq('token', token);
    
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
