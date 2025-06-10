const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://kxuczrnakuybcgpnxclb.supabase.co";
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dWN6cm5ha3V5YmNncG54Y2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMTc3ODIsImV4cCI6MjA0NjU5Mzc4Mn0.D7tKw-Ae8-vOC_PLFF9GVyQ0nP7b4jV--XEmbN5mP_A";

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
