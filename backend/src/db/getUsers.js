// Script to get users from Supabase
const supabase = require('../config/supabase');
require('dotenv').config();

async function getUsers() {
  try {
    console.log(`Connecting to Supabase at: ${process.env.SUPABASE_URL}`);
    
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
getUsers();
