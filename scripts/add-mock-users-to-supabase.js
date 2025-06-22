// Script to add mock users directly to the Supabase database
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "../backend/.env" });

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

async function addMockData() {
	console.log("Connecting to Supabase at:", supabaseUrl);

	try {
		// 1. Add mock users
		console.log("\nAdding mock users...");

		// Check if users already exist by email or username
		const { data: existingUsers, error: userCheckError } = await supabase
			.from("users")
			.select("username, email");

		if (userCheckError) {
			console.error("Error checking existing users:", userCheckError);
			return;
		}

		const existingUsernames = existingUsers.map((user) => user.username);
		const existingEmails = existingUsers.map((user) => user.email);

		console.log("Existing users:", existingUsernames.join(", ") || "None");
		console.log("Existing emails:", existingEmails.length);

		// Function to generate unique email
		const generateUniqueEmail = (baseEmail) => {
			const timestamp = Date.now();
			const [username, domain] = baseEmail.split("@");
			return `${username}+${timestamp}@${domain}`;
		};

		// Define users to add
		const usersToAdd = [];

		// User 1 - Regular user with profile picture
		if (!existingUsernames.includes("user1")) {
			usersToAdd.push({
				username: "user1",
				display_name: "John Smith",
				email: generateUniqueEmail("john@example.com"),
				bio: "Music lover and podcast enthusiast",
				avatar_url: "https://randomuser.me/api/portraits/men/1.jpg",
			});
		}

		// User 2 - Regular user with profile picture
		if (!existingUsernames.includes("user2")) {
			usersToAdd.push({
				username: "user2",
				display_name: "Sarah Johnson",
				email: generateUniqueEmail("sarah@example.com"),
				bio: "Voice artist and content creator",
				avatar_url: "https://randomuser.me/api/portraits/women/2.jpg",
			});
		}

		// User 3 - Regular user with profile picture
		if (!existingUsernames.includes("user3")) {
			usersToAdd.push({
				username: "user3",
				display_name: "Alex Chen",
				email: generateUniqueEmail("alex@example.com"),
				bio: "Tech enthusiast and audio engineer",
				avatar_url: "https://randomuser.me/api/portraits/men/3.jpg",
			});
		}

		// User 4 - Prometheus User WITHOUT profile picture
		if (!existingUsernames.includes("prometheus")) {
			usersToAdd.push({
				username: "prometheus",
				display_name: "Prometheus User",
				email: generateUniqueEmail("prometheus@example.com"),
				bio: "Bringing knowledge to humanity",
				avatar_url: null,
			});
		}

		// Add users if there are any to add
		if (usersToAdd.length > 0) {
			const { data: newUsers, error: insertError } = await supabase
				.from("users")
				.insert(usersToAdd)
				.select();

			if (insertError) {
				console.error("Error adding users:", insertError);
			} else {
				console.log(`Added ${newUsers.length} new users:`);
				newUsers.forEach((user) => {
					console.log(
						`- ${user.username} (${user.display_name}): ${
							user.avatar_url ? "Has profile picture" : "NO profile picture"
						}`
					);
				});
			}
		} else {
			console.log("No new users to add.");
		}

		// 2. Get user IDs for the next steps
		const { data: users, error: userError } = await supabase
			.from("users")
			.select("id, username")
			.in("username", ["user1", "user2", "user3", "prometheus"]);

		if (userError) {
			console.error("Error fetching users:", userError);
			return;
		}

		// Map usernames to IDs
		const userIdMap = {};
		users.forEach((user) => {
			userIdMap[user.username] = user.id;
		});

		console.log("\nUser IDs:");
		Object.entries(userIdMap).forEach(([username, id]) => {
			console.log(`- ${username}: ${id}`);
		});

		// 3. Add voice notes for each user
		console.log("\nAdding voice notes...");

		// Check existing voice notes
		const { data: existingNotes, error: noteCheckError } = await supabase
			.from("voice_notes")
			.select("title, user_id");

		if (noteCheckError) {
			console.error("Error checking existing voice notes:", noteCheckError);
			return;
		}

		// Create a set of existing note keys (title + user_id)
		const existingNoteKeys = new Set();
		existingNotes.forEach((note) => {
			existingNoteKeys.add(`${note.title}-${note.user_id}`);
		});

		// Prepare voice notes to add
		const voiceNotesToAdd = [];

		// Voice notes for User 1
		if (userIdMap.user1) {
			const user1Id = userIdMap.user1;

			if (!existingNoteKeys.has(`Morning Thoughts-${user1Id}`)) {
				voiceNotesToAdd.push({
					user_id: user1Id,
					title: "Morning Thoughts",
					duration: 45,
					audio_url: "https://example.com/audio/morning.mp3",
					background_image:
						"https://source.unsplash.com/random/800x600/?morning",
				});
			}

			if (!existingNoteKeys.has(`Jazz Review-${user1Id}`)) {
				voiceNotesToAdd.push({
					user_id: user1Id,
					title: "Jazz Review",
					duration: 120,
					audio_url: "https://example.com/audio/jazz.mp3",
				});
			}
		}

		// Voice notes for User 2
		if (userIdMap.user2) {
			const user2Id = userIdMap.user2;

			if (!existingNoteKeys.has(`Meditation Guide-${user2Id}`)) {
				voiceNotesToAdd.push({
					user_id: user2Id,
					title: "Meditation Guide",
					duration: 300,
					audio_url: "https://example.com/audio/meditation.mp3",
					background_image:
						"https://source.unsplash.com/random/800x600/?meditation",
				});
			}
		}

		// Voice notes for User 3
		if (userIdMap.user3) {
			const user3Id = userIdMap.user3;

			if (!existingNoteKeys.has(`Tech News Recap-${user3Id}`)) {
				voiceNotesToAdd.push({
					user_id: user3Id,
					title: "Tech News Recap",
					duration: 180,
					audio_url: "https://example.com/audio/tech.mp3",
					background_image:
						"https://source.unsplash.com/random/800x600/?technology",
				});
			}
		}

		// Voice notes for Prometheus User
		if (userIdMap.prometheus) {
			const prometheusId = userIdMap.prometheus;

			if (!existingNoteKeys.has(`The Gift of Knowledge-${prometheusId}`)) {
				voiceNotesToAdd.push({
					user_id: prometheusId,
					title: "The Gift of Knowledge",
					duration: 240,
					audio_url: "https://example.com/audio/knowledge.mp3",
					background_image:
						"https://source.unsplash.com/random/800x600/?knowledge",
				});
			}

			if (!existingNoteKeys.has(`Wisdom of the Ages-${prometheusId}`)) {
				voiceNotesToAdd.push({
					user_id: prometheusId,
					title: "Wisdom of the Ages",
					duration: 180,
					audio_url: "https://example.com/audio/wisdom.mp3",
				});
			}
		}

		// Add voice notes if there are any to add
		if (voiceNotesToAdd.length > 0) {
			const { data: newNotes, error: insertNoteError } = await supabase
				.from("voice_notes")
				.insert(voiceNotesToAdd)
				.select();

			if (insertNoteError) {
				console.error("Error adding voice notes:", insertNoteError);
			} else {
				console.log(`Added ${newNotes.length} new voice notes:`);
				newNotes.forEach((note) => {
					const username = Object.keys(userIdMap).find(
						(key) => userIdMap[key] === note.user_id
					);
					console.log(`- "${note.title}" by ${username} (ID: ${note.id})`);
				});
			}
		} else {
			console.log("No new voice notes to add.");
		}

		// 4. Add comments to voice notes
		console.log("\nAdding comments to voice notes...");

		// Get voice notes for adding comments
		const { data: voiceNotes, error: voiceNoteError } = await supabase
			.from("voice_notes")
			.select("id, title, user_id")
			.order("created_at", { ascending: false });

		if (voiceNoteError) {
			console.error("Error fetching voice notes:", voiceNoteError);
			return;
		}

		// Find voice notes by user
		const user1Notes = voiceNotes.filter(
			(note) => note.user_id === userIdMap.user1
		);
		const prometheusNotes = voiceNotes.filter(
			(note) => note.user_id === userIdMap.prometheus
		);

		// Prepare comments to add
		const commentsToAdd = [];

		// Comments on User 1's first voice note
		if (user1Notes.length > 0) {
			const firstNote = user1Notes[0];

			if (userIdMap.user2) {
				commentsToAdd.push({
					voice_note_id: firstNote.id,
					user_id: userIdMap.user2,
					content: "Great insights! I really enjoyed this.",
				});
			}

			if (userIdMap.user3) {
				commentsToAdd.push({
					voice_note_id: firstNote.id,
					user_id: userIdMap.user3,
					content: "Thanks for sharing your thoughts!",
				});
			}
		}

		// Comments on Prometheus User's first voice note
		if (prometheusNotes.length > 0) {
			const firstNote = prometheusNotes[0];

			if (userIdMap.user1) {
				commentsToAdd.push({
					voice_note_id: firstNote.id,
					user_id: userIdMap.user1,
					content: "This changed my perspective. Thank you!",
				});
			}

			if (userIdMap.user2) {
				commentsToAdd.push({
					voice_note_id: firstNote.id,
					user_id: userIdMap.user2,
					content: "Profound wisdom. Please share more.",
				});
			}
		}

		// Add comments if there are any to add
		if (commentsToAdd.length > 0) {
			const { data: newComments, error: insertCommentError } = await supabase
				.from("voice_note_comments")
				.insert(commentsToAdd)
				.select();

			if (insertCommentError) {
				console.error("Error adding comments:", insertCommentError);
			} else {
				console.log(`Added ${newComments.length} new comments:`);
				newComments.forEach((comment) => {
					const noteTitle = voiceNotes.find(
						(note) => note.id === comment.voice_note_id
					)?.title;
					const commenterUsername = Object.keys(userIdMap).find(
						(key) => userIdMap[key] === comment.user_id
					);
					console.log(
						`- Comment on "${noteTitle}": "${comment.content}" by ${commenterUsername}`
					);
				});
			}
		} else {
			console.log("No new comments to add.");
		}

		console.log("\nMock data setup complete!");
	} catch (error) {
		console.error("Error setting up mock data:", error);
	}
}

// Run the script
addMockData();
