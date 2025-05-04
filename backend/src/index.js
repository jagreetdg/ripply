const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const voiceNoteRoutes = require("./routes/voiceNotes");
const voiceBioRoutes = require("./routes/voiceBios");

const app = express();
const PORT = process.env.PORT || 3000;

// Debug middleware for CORS requests
app.use((req, res, next) => {
  console.log(`[CORS Debug] ${req.method} ${req.path}`);
  console.log(`[CORS Debug] Origin: ${req.headers.origin}`);
  console.log(`[CORS Debug] Headers:`, req.headers);
  
  // Capture the response headers after they're set
  const originalSetHeader = res.setHeader;
  res.setHeader = function(name, value) {
    console.log(`[CORS Debug] Response Header: ${name}: ${value}`);
    return originalSetHeader.apply(this, arguments);
  };
  
  next();
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ripply-app.netlify.app', 'https://ripply.app'] 
    : ['http://localhost:3000', 'http://localhost:19000', 'http://localhost:19006', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Increase preflight cache to 10 minutes
}));
app.use(express.json());
app.use(cookieParser());

// Add explicit handling for OPTIONS requests
app.options('*', (req, res) => {
  console.log('[CORS Debug] Handling OPTIONS request explicitly');
  res.status(204).end();
});

// Security headers middleware
app.use((req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // In production, enforce Content-Security-Policy
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
    );
  }
  
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/voice-notes", voiceNoteRoutes);
app.use("/api/voice-bios", voiceBioRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Ripply API is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
