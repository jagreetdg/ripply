const { createClient } = require("@supabase/supabase-js");

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error(
		"Error: SUPABASE_URL and SUPABASE_KEY environment variables are required"
	);
	console.error("Please ensure these are set in your .env file");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
	console.log("🔗 Testing Supabase Connection...");
	console.log("URL:", supabaseUrl);
	console.log("Key:", supabaseKey.substring(0, 20) + "...");

	try {
		// Test 1: Try to get users
		console.log("\n📊 Test 1: Getting users...");
		const { data: users, error: usersError } = await supabase
			.from("users")
			.select("*")
			.limit(5);

		if (usersError) {
			console.log("❌ Users error:", usersError);
		} else {
			console.log("✅ Users success:", users?.length || 0, "users found");
			if (users && users.length > 0) {
				console.log("First user:", users[0]);
			}
		}

		// Test 2: Try to get voice notes
		console.log("\n🎵 Test 2: Getting voice notes...");
		const { data: notes, error: notesError } = await supabase
			.from("voice_notes")
			.select("*")
			.limit(5);

		if (notesError) {
			console.log("❌ Voice notes error:", notesError);
		} else {
			console.log("✅ Voice notes success:", notes?.length || 0, "notes found");
			if (notes && notes.length > 0) {
				console.log("First note:", notes[0]);
			}
		}

		// Test 3: List all tables
		console.log("\n📋 Test 3: Checking what tables exist...");
		const { data: tables, error: tablesError } = await supabase.rpc(
			"get_tables"
		); // This might not work, but let's try

		if (tablesError) {
			console.log("ℹ️  Cannot list tables (expected):", tablesError.message);
		} else {
			console.log("Tables:", tables);
		}

		// Test 4: Test with raw SQL if possible
		console.log("\n🔍 Test 4: Testing with a simple count...");
		const { count, error: countError } = await supabase
			.from("users")
			.select("*", { count: "exact", head: true });

		if (countError) {
			console.log("❌ Count error:", countError);
		} else {
			console.log("✅ Total users count:", count);
		}
	} catch (error) {
		console.error("💥 Connection test failed:", error);
	}
}

testConnection();
