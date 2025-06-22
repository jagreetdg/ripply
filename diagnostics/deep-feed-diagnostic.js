const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
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

// Use environment variable or fallback to localhost
const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

async function runDeepDiagnostic() {
	console.log("\n🔍 DEEP FEED DIAGNOSTIC - SYSTEMATIC INVESTIGATION");
	console.log("=".repeat(60));

	const testUserId = "2e6e7e59-e4fb-4c6f-af6b-eff3be21cf14"; // Emily Wilson

	try {
		// ========= STEP 1: DATABASE LAYER INVESTIGATION =========
		console.log("\n📊 STEP 1: DATABASE LAYER INVESTIGATION");
		console.log("-".repeat(40));

		// Get users followed by test user
		const { data: followingData } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", testUserId);

		const followingIds = followingData?.map((f) => f.following_id) || [];
		console.log(`1.1 User ${testUserId} follows: ${followingIds.length} users`);
		console.log(`    Following IDs: ${followingIds.join(", ")}`);

		if (followingIds.length === 0) {
			console.log("⚠️  User follows no one, skipping follow-based analysis");
			return;
		}

		// Check ORIGINAL voice notes from followed users
		const { data: originalNotes } = await supabase
			.from("voice_notes")
			.select("id, user_id, title, created_at")
			.in("user_id", followingIds)
			.order("created_at", { ascending: false })
			.limit(10);

		console.log(
			`\n1.2 ORIGINAL voice notes from followed users: ${originalNotes.length}`
		);
		originalNotes.forEach((note, idx) => {
			console.log(
				`    ${idx + 1}. ID: ${note.id}, Title: "${note.title}", Creator: ${
					note.user_id
				}`
			);
		});

		// Check SHARED voice notes by followed users
		const { data: shareRecords } = await supabase
			.from("voice_note_shares")
			.select("id, voice_note_id, user_id, shared_at")
			.in("user_id", followingIds)
			.order("shared_at", { ascending: false })
			.limit(10);

		console.log(
			`\n1.3 SHARE records by followed users: ${shareRecords.length}`
		);
		shareRecords.forEach((share, idx) => {
			console.log(
				`    ${idx + 1}. Voice Note: ${share.voice_note_id}, Shared by: ${
					share.user_id
				}, At: ${share.shared_at}`
			);
		});

		// CRITICAL TEST: Check for data corruption
		console.log(
			`\n1.4 CORRUPTION CHECK: Do any original notes have share records?`
		);
		const originalNoteIds = originalNotes.map((n) => n.id);
		if (originalNoteIds.length > 0) {
			const { data: corruptionCheck } = await supabase
				.from("voice_note_shares")
				.select("voice_note_id, user_id")
				.in("voice_note_id", originalNoteIds);

			console.log(
				`    Found ${corruptionCheck.length} share records for original notes from followed users`
			);
			corruptionCheck.forEach((record) => {
				const originalNote = originalNotes.find(
					(n) => n.id === record.voice_note_id
				);
				console.log(
					`    ⚠️  POTENTIAL ISSUE: Note "${originalNote.title}" (created by ${originalNote.user_id}) has share by ${record.user_id}`
				);
			});
		}

		// ========= STEP 2: BACKEND API INVESTIGATION =========
		console.log("\n🔧 STEP 2: BACKEND API INVESTIGATION");
		console.log("-".repeat(40));

		// Call the backend feed endpoint directly
		const backendResponse = await fetch(
			`${BASE_URL}/api/voice-notes/feed/${testUserId}`,
			{
				headers: {
					Authorization: `Bearer fake-token-for-testing`,
				},
			}
		);

		if (backendResponse.ok) {
			const backendData = await backendResponse.json();
			console.log(`2.1 Backend API returned: ${backendData.length} feed items`);

			// Analyze the is_shared flag distribution
			const originalCount = backendData.filter(
				(item) => item.is_shared === false
			).length;
			const sharedCount = backendData.filter(
				(item) => item.is_shared === true
			).length;

			console.log(`2.2 Backend flag distribution:`);
			console.log(`    Original posts (is_shared: false): ${originalCount}`);
			console.log(`    Shared posts (is_shared: true): ${sharedCount}`);

			// Examine first few items in detail
			console.log(`\n2.3 First 5 backend items analysis:`);
			backendData.slice(0, 5).forEach((item, idx) => {
				console.log(`    ${idx + 1}. ID: ${item.id}`);
				console.log(`        Title: "${item.title}"`);
				console.log(`        is_shared: ${item.is_shared}`);
				console.log(
					`        Original creator: ${item.users?.username || "N/A"}`
				);
				console.log(`        Shared by: ${item.shared_by?.username || "N/A"}`);
				console.log(`        Created: ${item.created_at}`);
				console.log(`        Shared at: ${item.shared_at || "N/A"}`);
				console.log("");
			});

			// CRITICAL: Cross-reference with database
			console.log(`2.4 BACKEND vs DATABASE cross-reference:`);
			for (let item of backendData.slice(0, 3)) {
				const dbNote = originalNotes.find((n) => n.id === item.id);
				if (dbNote) {
					console.log(
						`    ✓ Note ${item.id} found in DB as ORIGINAL, backend says is_shared: ${item.is_shared}`
					);
					if (item.is_shared === true) {
						console.log(
							`    🚨 CRITICAL ISSUE: Original note marked as shared by backend!`
						);
					}
				} else {
					console.log(
						`    ℹ️  Note ${item.id} not found in original notes (might be truly shared)`
					);
				}
			}
		} else {
			console.log(
				`2.1 Backend API error: ${backendResponse.status} ${backendResponse.statusText}`
			);
		}

		// ========= STEP 3: DETAILED BACKEND QUERY ANALYSIS =========
		console.log("\n🔍 STEP 3: BACKEND QUERY SIMULATION");
		console.log("-".repeat(40));

		// Simulate the exact backend queries
		console.log(`3.1 Simulating backend's ORIGINAL posts query:`);
		const { data: backendOriginalQuery } = await supabase
			.from("voice_notes")
			.select(
				`
        *,
        users:user_id (id, username, display_name, avatar_url),
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count),
        shares:voice_note_shares (count),
        tags:voice_note_tags (tag_name)
      `
			)
			.in("user_id", followingIds)
			.order("created_at", { ascending: false });

		console.log(
			`    Backend original query returned: ${backendOriginalQuery.length} items`
		);
		backendOriginalQuery.slice(0, 3).forEach((item, idx) => {
			console.log(
				`    ${idx + 1}. ID: ${item.id}, Title: "${item.title}", User: ${
					item.users?.username
				}`
			);
		});

		console.log(`\n3.2 Simulating backend's SHARED posts query:`);
		const { data: backendSharedQuery } = await supabase
			.from("voice_note_shares")
			.select("id, voice_note_id, user_id, shared_at")
			.in("user_id", followingIds)
			.order("shared_at", { ascending: false });

		console.log(
			`    Backend shared query returned: ${backendSharedQuery.length} share records`
		);

		// ========= STEP 4: IDENTIFY ROOT CAUSE =========
		console.log("\n💡 STEP 4: ROOT CAUSE ANALYSIS");
		console.log("-".repeat(40));

		console.log("4.1 Hypothesis Testing:");
		console.log(
			"    H1: Database corruption (original notes have incorrect shares) -",
			corruptionCheck && corruptionCheck.length > 0
				? "⚠️  POSSIBLE"
				: "✅ UNLIKELY"
		);
		console.log(
			"    H2: Backend logic error (marks originals as shared) -",
			backendResponse.ok ? "🔍 TESTING..." : "❓ UNKNOWN"
		);
		console.log("    H3: Frontend processing error -", "🔍 TESTING...");

		console.log("\n4.2 Next steps based on findings above...");
	} catch (error) {
		console.error("❌ Diagnostic error:", error);
	}
}

// Run the diagnostic
runDeepDiagnostic();
