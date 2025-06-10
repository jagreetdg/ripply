/**
 * Global Test Teardown
 * Runs once after all tests complete
 */

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Global cleanup tasks can be added here
  // For example:
  // - Database cleanup
  // - Temporary file removal
  // - Connection closing
  
  console.log('✅ Test environment cleanup complete');
}; 