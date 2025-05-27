/**
 * Script to update the shares column in the voice_notes table
 * based on the actual count of shares in the voice_note_shares table
 */
const supabase = require("../config/supabase");

async function updateShareCounts() {
	console.log("Starting share count update...");

	try {
		// 1. First check if the shares column exists, if not add it
		const { data: checkResult, error: checkError } = await supabase
			.from("voice_notes")
			.select("shares")
			.limit(1);

		if (checkError) {
			if (checkError.code === "42703") {
				console.log("Adding shares column to voice_notes table...");
				// Add the column to the voice_notes table
				await supabase.rpc("add_shares_column_if_not_exists");
			} else {
				throw checkError;
			}
		}

		// 2. Get all voice notes
		const { data: voiceNotes, error: voiceNotesError } = await supabase
			.from("voice_notes")
			.select("id");

		if (voiceNotesError) throw voiceNotesError;

		console.log(`Found ${voiceNotes.length} voice notes to update`);

		// 3. For each voice note, count shares and update
		let updatedCount = 0;
		let errorCount = 0;

		for (const voiceNote of voiceNotes) {
			try {
				// Get count of shares for this voice note
				const {
					data: shares,
					error: sharesError,
					count,
				} = await supabase
					.from("voice_note_shares")
					.select("*", { count: "exact" })
					.eq("voice_note_id", voiceNote.id);

				if (sharesError) throw sharesError;

				const shareCount = count || 0;

				// Update the voice note with the correct share count
				const { error: updateError } = await supabase
					.from("voice_notes")
					.update({ shares: shareCount })
					.eq("id", voiceNote.id);

				if (updateError) throw updateError;

				updatedCount++;
				if (updatedCount % 10 === 0) {
					console.log(
						`Updated ${updatedCount}/${voiceNotes.length} voice notes`
					);
				}
			} catch (error) {
				console.error(`Error updating voice note ${voiceNote.id}:`, error);
				errorCount++;
			}
		}

		console.log(`
    Share count update complete:
    - Total voice notes: ${voiceNotes.length}
    - Successfully updated: ${updatedCount}
    - Errors: ${errorCount}
    `);
	} catch (error) {
		console.error("Error updating share counts:", error);
	}
}

// Run the update function
updateShareCounts()
	.then(() => {
		console.log("Script completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Script failed:", error);
		process.exit(1);
	});
