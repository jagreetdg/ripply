const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Check if username exists
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username);
    
    if (error) throw error;
    
    res.status(200).json({ 
      exists: data && data.length > 0,
      available: !(data && data.length > 0)
    });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if email exists
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);
    
    if (error) throw error;
    
    res.status(200).json({ 
      exists: data && data.length > 0,
      available: !(data && data.length > 0)
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields: username, email, and password are required' 
      });
    }
    
    // Check if username already exists
    const { data: existingUsername, error: usernameError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username);
    
    if (usernameError) throw usernameError;
    
    if (existingUsername && existingUsername.length > 0) {
      return res.status(400).json({ 
        message: 'Username already exists',
        field: 'username'
      });
    }
    
    // Check if email already exists
    const { data: existingEmail, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);
    
    if (emailError) throw emailError;
    
    if (existingEmail && existingEmail.length > 0) {
      return res.status(400).json({ 
        message: 'Email already exists',
        field: 'email'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const userId = uuidv4();
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        username,
        email,
        password: hashedPassword,
        display_name: displayName || username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Remove password from response
    delete newUser.password;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields: email and password are required' 
      });
    }
    
    // Find user by email
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (error) throw error;
    
    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Remove password from response
    delete user.password;
    
    res.status(200).json({
      message: 'Login successful',
      user
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
