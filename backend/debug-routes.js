const express = require("express");

console.log("Starting route debug...");

try {
	// Test loading the main app
	console.log("Loading main app...");
	const app = require("./src/index.js");
	console.log("✅ Main app loaded successfully");

	// Test loading individual route files
	console.log("Loading auth routes...");
	const authRoutes = require("./src/routes/auth.js");
	console.log("✅ Auth routes loaded successfully");

	console.log("Loading user routes...");
	const userRoutes = require("./src/routes/users.js");
	console.log("✅ User routes loaded successfully");

	// Create a test app to see what routes are registered
	const testApp = express();
	testApp.use("/api/auth", authRoutes);

	// Function to recursively print routes
	function printRoutes(router, basePath = "") {
		if (!router || !router.stack) return;

		router.stack.forEach((layer, index) => {
			if (layer.route) {
				// This is a route
				const methods = Object.keys(layer.route.methods)
					.join(", ")
					.toUpperCase();
				const path = basePath + layer.route.path;
				console.log(`  Route: ${methods} ${path}`);
			} else if (
				layer.name === "router" &&
				layer.handle &&
				layer.handle.stack
			) {
				// This is a sub-router
				const subPath = layer.regexp.source
					.replace("\\", "")
					.replace("^", "")
					.replace("$", "")
					.replace("(?=\\/|$)", "")
					.replace("\\/", "/")
					.replace(/[()]/g, "");
				console.log(`  Sub-router at: ${basePath}${subPath}`);
				printRoutes(layer.handle, basePath + subPath);
			} else {
				// This is middleware
				console.log(`  Middleware: ${layer.name || "anonymous"}`);
			}
		});
	}

	// List all routes
	console.log("\n=== Detailed Route Analysis ===");
	console.log("Main app routes:");
	testApp._router.stack.forEach((layer, index) => {
		if (layer.route) {
			const methods = Object.keys(layer.route.methods).join(", ").toUpperCase();
			console.log(`${index}: Route: ${methods} ${layer.route.path}`);
		} else if (layer.name === "router" && layer.handle && layer.handle.stack) {
			const routePath = layer.regexp.source
				.replace("\\", "")
				.replace("^", "")
				.replace("$", "")
				.replace("(?=\\/|$)", "")
				.replace("\\/", "/")
				.replace(/[()]/g, "");
			console.log(`${index}: Router mounted at: ${routePath}`);
			console.log(`  Routes in this router:`);
			printRoutes(layer.handle, routePath);
		} else {
			console.log(`${index}: Middleware: ${layer.name || "anonymous"}`);
		}
	});

	console.log("\n✅ Route debug completed successfully");
} catch (error) {
	console.error("❌ Error during route debug:");
	console.error(error.message);
	console.error(error.stack);
}
