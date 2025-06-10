const axios = require("axios");

const REMOTE_URL = "https://ripply-backend.onrender.com";
const TEST_USER_ID = "7b92c915-c931-4792-ada1-da94fcb6104d";

async function testFeedPagination() {
	console.log("🔍 TESTING FEED PAGINATION - Are original posts on page 2?");
	console.log("=".repeat(60));

	try {
		// Test Page 1
		console.log("\n📄 PAGE 1 (limit=10):");
		const page1Response = await axios.get(
			`${REMOTE_URL}/api/voice-notes/feed/${TEST_USER_ID}`,
			{
				params: { page: 1, limit: 10 },
				headers: { Authorization: "Bearer dummy-token" },
			}
		);

		const page1Data = page1Response.data;
		const page1Original = page1Data.filter((item) => item.is_shared === false);
		const page1Shared = page1Data.filter((item) => item.is_shared === true);

		console.log(`   Total items: ${page1Data.length}`);
		console.log(`   Original posts: ${page1Original.length}`);
		console.log(`   Shared posts: ${page1Shared.length}`);

		console.log("\n   📝 Original posts on page 1:");
		page1Original.forEach((post, idx) => {
			console.log(
				`     ${idx + 1}. "${post.title}" by ${post.users?.username}`
			);
		});

		// Test Page 2
		console.log("\n📄 PAGE 2 (limit=10):");
		try {
			const page2Response = await axios.get(
				`${REMOTE_URL}/api/voice-notes/feed/${TEST_USER_ID}`,
				{
					params: { page: 2, limit: 10 },
					headers: { Authorization: "Bearer dummy-token" },
				}
			);

			const page2Data = page2Response.data;
			const page2Original = page2Data.filter(
				(item) => item.is_shared === false
			);
			const page2Shared = page2Data.filter((item) => item.is_shared === true);

			console.log(`   Total items: ${page2Data.length}`);
			console.log(`   Original posts: ${page2Original.length}`);
			console.log(`   Shared posts: ${page2Shared.length}`);

			console.log("\n   📝 Original posts on page 2:");
			page2Original.forEach((post, idx) => {
				console.log(
					`     ${idx + 1}. "${post.title}" by ${post.users?.username}`
				);
			});

			if (page2Original.length > 0) {
				console.log("\n❌ PROBLEM FOUND: Original posts are on page 2!");
				console.log(
					"   This explains why you only see 2 original posts on page 1."
				);
			}
		} catch (page2Error) {
			if (
				page2Error.response?.status === 404 ||
				page2Error.response?.data?.length === 0
			) {
				console.log("   No page 2 data (empty)");
			} else {
				console.log(`   Page 2 error: ${page2Error.message}`);
			}
		}

		// Test with higher limit to see ALL posts
		console.log("\n📄 TESTING WITH HIGHER LIMIT (limit=50):");
		try {
			const allResponse = await axios.get(
				`${REMOTE_URL}/api/voice-notes/feed/${TEST_USER_ID}`,
				{
					params: { page: 1, limit: 50 },
					headers: { Authorization: "Bearer dummy-token" },
				}
			);

			const allData = allResponse.data;
			const allOriginal = allData.filter((item) => item.is_shared === false);
			const allShared = allData.filter((item) => item.is_shared === true);

			console.log(`   Total items: ${allData.length}`);
			console.log(`   Original posts: ${allOriginal.length}`);
			console.log(`   Shared posts: ${allShared.length}`);

			console.log("\n   📝 ALL Original posts:");
			allOriginal.forEach((post, idx) => {
				console.log(
					`     ${idx + 1}. "${post.title}" by ${post.users?.username}`
				);
			});

			// Check chronological order
			console.log("\n⏰ CHRONOLOGICAL ORDER CHECK:");
			const sortedByTime = [...allData].sort((a, b) => {
				const dateA = a.is_shared
					? new Date(a.shared_at)
					: new Date(a.created_at);
				const dateB = b.is_shared
					? new Date(b.shared_at)
					: new Date(b.created_at);
				return dateB - dateA;
			});

			console.log("   First 10 posts by time:");
			sortedByTime.slice(0, 10).forEach((post, idx) => {
				const date = post.is_shared ? post.shared_at : post.created_at;
				const type = post.is_shared ? "SHARED" : "ORIGINAL";
				console.log(
					`     ${idx + 1}. [${type}] "${post.title}" (${
						new Date(date).toISOString().split("T")[0]
					})`
				);
			});
		} catch (allError) {
			console.log(`   Higher limit error: ${allError.message}`);
		}
	} catch (error) {
		console.error(
			"❌ Pagination test error:",
			error.response?.data || error.message
		);
	}
}

testFeedPagination();
