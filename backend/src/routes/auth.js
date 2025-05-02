const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT Secret - in production, this would be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Token expiration time
const TOKEN_EXPIRATION = '7d'; // 7 days

// HTTPS enforcement middleware
const enforceHTTPS = (req, res, next) => {
  // Skip for local development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  // Check if request is secure or via a proxy that sets X-Forwarded-Proto
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }
  
  // Redirect to HTTPS
  return res.redirect('https://' + req.headers.host + req.url);
};

// Apply HTTPS enforcement to all auth routes
router.use(enforceHTTPS);

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION }
  );
};

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
    
    // Generate JWT token
    const token = generateToken(newUser);
    
    // Set secure cookie with token
    if (process.env.NODE_ENV === 'production') {
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token
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
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set secure cookie with token
    if (process.env.NODE_ENV === 'production') {
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }
    
    res.status(200).json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // Clear the auth cookie
  res.clearCookie('auth_token');
  
  res.status(200).json({
    message: 'Logged out successfully'
  });
});

// Verify token endpoint
router.get('/verify-token', async (req, res) => {
  try {
    // Get token from Authorization header or cookie
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.auth_token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Remove password from response
    delete user.password;
    
    res.status(200).json({
      message: 'Token verified',
      user
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
