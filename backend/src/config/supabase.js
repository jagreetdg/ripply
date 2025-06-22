const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const fetch = require("node-fetch");

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
	throw new Error("SUPABASE_URL environment variable is required");
}

if (!supabaseKey) {
	throw new Error("SUPABASE_ANON_KEY environment variable is required");
}

// Validate URL format
try {
	new URL(supabaseUrl);
} catch (error) {
	throw new Error("SUPABASE_URL must be a valid URL");
}

if (process.env.NODE_ENV === "development") {
	console.log("Connecting to Supabase at:", supabaseUrl);
}

// Create Supabase client with custom fetch implementation
const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		persistSession: false,
	},
	global: {
		fetch: fetch,
		headers: {
			"Content-Type": "application/json",
		},
		// Add timeout to prevent hanging connections
		fetchOptions: {
			timeout: 30000, // 30 seconds
		},
	},
});

module.exports = supabase;
