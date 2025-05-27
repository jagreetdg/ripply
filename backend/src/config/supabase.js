const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fetch = require('node-fetch');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);

// Create Supabase client with custom fetch implementation
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  global: {
    fetch: fetch,
    headers: {
      'Content-Type': 'application/json'
    },
    // Add timeout to prevent hanging connections
    fetchOptions: {
      timeout: 30000 // 30 seconds
    }
  }
});

module.exports = supabase;
