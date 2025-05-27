/**
 * Rate limiter middleware to prevent brute force attacks
 */
const rateLimit = {}; // In-memory store for rate limiting

/**
 * Rate limiter middleware
 * @param {number} maxAttempts - Maximum number of attempts allowed in the time window
 * @param {number} windowMs - Time window in milliseconds
 * @param {string} message - Error message to return when rate limit is exceeded
 * @returns {function} Express middleware function
 */
const rateLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000, message = 'Too many attempts, please try again later') => {
  return (req, res, next) => {
    // Get client IP
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Get current time
    const now = Date.now();
    
    // Initialize or clean up rate limit data for this IP
    if (!rateLimit[ip]) {
      rateLimit[ip] = {
        count: 0,
        resetAt: now + windowMs
      };
    } else if (rateLimit[ip].resetAt < now) {
      // Reset count if window has expired
      rateLimit[ip] = {
        count: 0,
        resetAt: now + windowMs
      };
    }
    
    // Increment count
    rateLimit[ip].count++;
    
    // Check if rate limit exceeded
    if (rateLimit[ip].count > maxAttempts) {
      return res.status(429).json({
        message,
        retryAfter: Math.ceil((rateLimit[ip].resetAt - now) / 1000) // seconds until reset
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxAttempts);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAttempts - rateLimit[ip].count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit[ip].resetAt / 1000)); // Unix timestamp
    
    next();
  };
};

module.exports = rateLimiter;
