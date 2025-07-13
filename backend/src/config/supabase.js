const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const fetch = require("node-fetch");

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey =
	process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
	throw new Error("SUPABASE_URL environment variable is required");
}

if (!supabaseAnonKey) {
	throw new Error(
		"SUPABASE_ANON_KEY (or SUPABASE_KEY) environment variable is required"
	);
}

if (!supabaseServiceKey) {
	console.warn(
		"SUPABASE_SERVICE_KEY not found, using anon key for all operations"
	);
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

// Create regular Supabase client (with RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

// Create admin client that bypasses RLS (for user creation, etc.)
const supabaseAdmin = createClient(
	supabaseUrl,
	supabaseServiceKey || supabaseAnonKey,
	{
		auth: {
			persistSession: false,
		},
		global: {
			fetch: fetch,
			headers: {
				"Content-Type": "application/json",
			},
			fetchOptions: {
				timeout: 30000, // 30 seconds
			},
		},
	}
);

module.exports = { supabase, supabaseAdmin };
