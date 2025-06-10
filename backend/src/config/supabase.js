const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const fetch = require("node-fetch");

// Initialize Supabase client
const supabaseUrl =
	process.env.SUPABASE_URL || "https://kxuczrnakuybcgpnxclb.supabase.co";
const supabaseKey =
	process.env.SUPABASE_KEY ||
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dWN6cm5ha3V5YmNncG54Y2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMTc3ODIsImV4cCI6MjA0NjU5Mzc4Mn0.D7tKw-Ae8-vOC_PLFF9GVyQ0nP7b4jV--XEmbN5mP_A";

if (!supabaseUrl || !supabaseKey) {
	console.error("Missing Supabase credentials. Please check your .env file.");
	process.exit(1);
}

console.log("Connecting to Supabase at:", supabaseUrl);

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
