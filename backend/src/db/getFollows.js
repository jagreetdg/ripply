// Script to get follows from Supabase
const supabase = require('../config/supabase');
require('dotenv').config();

async function getFollows() {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('*');
    if (error) {
      console.error('Error fetching follows:', error);
      return;
    }
    console.log('Follows in database:');
    console.log(JSON.stringify(data, null, 2));
    if (data.length === 0) {
      console.log('No follows found. Creating sample follows...');
      await createSampleFollows();
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function createSampleFollows() {
  try {
    // Get users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    // Each user follows the next user (circular)
    const followsData = [];
    for (let i = 0; i < users.length; i++) {
      followsData.push({
        follower_id: users[i].id,
        following_id: users[(i + 1) % users.length].id
      });
    }
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .insert(followsData)
      .select();
    if (followsError) {
      console.error('Error creating follows:', followsError);
      return;
    }
    console.log('Created sample follows:');
    console.log(JSON.stringify(follows, null, 2));
  } catch (error) {
    console.error('Error creating sample follows:', error);
  }
}

getFollows();
