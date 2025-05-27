/**
 * Account lockout middleware to prevent brute force attacks
 */
const supabase = require('../config/supabase');

// Maximum number of failed attempts before locking account
const MAX_FAILED_ATTEMPTS = 5;

// Lockout duration in minutes
const LOCKOUT_DURATION = 30;

/**
 * Check if an account is locked
 * @param {string} email - User email
 * @returns {Promise<boolean>} - Whether the account is locked
 */
const isAccountLocked = async (email) => {
  try {
    const { data, error } = await supabase
      .from('account_lockouts')
      .select('locked_until')
      .eq('email', email)
      .single();
    
    if (error || !data) return false;
    
    // Check if lockout has expired
    return new Date(data.locked_until) > new Date();
  } catch (error) {
    console.error('Error checking account lockout:', error);
    return false;
  }
};

/**
 * Record a failed login attempt
 * @param {string} email - User email
 * @returns {Promise<boolean>} - Whether the account is now locked
 */
const recordFailedAttempt = async (email) => {
  try {
    // Get current failed attempts
    const { data, error } = await supabase
      .from('account_lockouts')
      .select('failed_attempts')
      .eq('email', email)
      .single();
    
    const failedAttempts = (data?.failed_attempts || 0) + 1;
    
    // Check if account should be locked
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION * 60 * 1000);
      
      // Lock account
      await supabase
        .from('account_lockouts')
        .upsert({
          email,
          failed_attempts: failedAttempts,
          locked_until: lockedUntil.toISOString()
        });
      
      return true;
    } else {
      // Update failed attempts
      await supabase
        .from('account_lockouts')
        .upsert({
          email,
          failed_attempts: failedAttempts,
          locked_until: null
        });
      
      return false;
    }
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    return false;
  }
};

/**
 * Reset failed login attempts
 * @param {string} email - User email
 */
const resetFailedAttempts = async (email) => {
  try {
    await supabase
      .from('account_lockouts')
      .upsert({
        email,
        failed_attempts: 0,
        locked_until: null
      });
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
  }
};

module.exports = {
  isAccountLocked,
  recordFailedAttempt,
  resetFailedAttempts,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION
};
