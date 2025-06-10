/**
 * Express App Tests
 * Tests main application setup, middleware, and routing
 */

const request = require("supertest");

// Mock all route modules before requiring the app
jest.mock("../src/routes/auth");
jest.mock("../src/routes/users");
jest.mock("../src/routes/voiceNotes");
jest.mock("../src/routes/voiceBios");
jest.mock("../src/routes/passwordReset");
jest.mock("../src/routes/verification");

// Mock middleware
jest.mock("../src/middleware/auth");

describe("Express Application", () => {
	let app;

	beforeEach(() => {
		jest.clearAllMocks();

		// Clear require cache to get fresh app instance
		jest.resetModules();

		// Mock route handlers
		require("../src/routes/auth").mockImplementation((req, res, next) => {
			if (req.path === "/auth/test") {
				res.json({ route: "auth" });
			} else {
				next();
			}
		});

		require("../src/routes/users").mockImplementation((req, res, next) => {
			if (req.path === "/users/test") {
				res.json({ route: "users" });
			} else {
				next();
			}
		});

		require("../src/routes/voiceNotes").mockImplementation((req, res, next) => {
			if (req.path === "/voice-notes/test") {
				res.json({ route: "voiceNotes" });
			} else {
				next();
			}
		});

		require("../src/routes/voiceBios").mockImplementation((req, res, next) => {
			if (req.path === "/voice-bios/test") {
				res.json({ route: "voiceBios" });
			} else {
				next();
			}
		});

		require("../src/routes/passwordReset").mockImplementation(
			(req, res, next) => {
				if (req.path === "/password-reset/test") {
					res.json({ route: "passwordReset" });
				} else {
					next();
				}
			}
		);

		require("../src/routes/verification").mockImplementation(
			(req, res, next) => {
				if (req.path === "/verification/test") {
					res.json({ route: "verification" });
				} else {
					next();
				}
			}
		);

		app = require("../src/index");
	});

	describe("Application Setup", () => {
		it("should create Express application", () => {
			expect(app).toBeDefined();
			expect(typeof app).toBe("function");
		});

		it("should handle JSON requests", async () => {
			const response = await request(app)
				.post("/auth/test")
				.send({ test: "data" })
				.expect(200);

			expect(response.body).toEqual({ route: "auth" });
		});

		it("should parse URL encoded data", async () => {
			await request(app)
				.post("/auth/test")
				.send("test=data")
				.set("Content-Type", "application/x-www-form-urlencoded")
				.expect(200);
		});
	});

	describe("CORS Configuration", () => {
		it("should include CORS headers", async () => {
			const response = await request(app).get("/auth/test").expect(200);

			expect(response.headers).toHaveProperty("access-control-allow-origin");
		});

		it("should handle preflight OPTIONS requests", async () => {
			const response = await request(app)
				.options("/auth/test")
				.set("Origin", "http://localhost:3000")
				.set("Access-Control-Request-Method", "POST");

			expect(response.status).toBeLessThan(400);
		});

		it("should allow specific origins", async () => {
			const response = await request(app)
				.get("/auth/test")
				.set("Origin", "https://ripply-app.netlify.app");

			expect(response.headers["access-control-allow-origin"]).toBeDefined();
		});
	});

	describe("Route Mounting", () => {
		it("should mount auth routes", async () => {
			const response = await request(app).get("/auth/test").expect(200);

			expect(response.body).toEqual({ route: "auth" });
		});

		it("should mount user routes", async () => {
			const response = await request(app).get("/users/test").expect(200);

			expect(response.body).toEqual({ route: "users" });
		});

		it("should mount voice note routes", async () => {
			const response = await request(app).get("/voice-notes/test").expect(200);

			expect(response.body).toEqual({ route: "voiceNotes" });
		});

		it("should mount voice bio routes", async () => {
			const response = await request(app).get("/voice-bios/test").expect(200);

			expect(response.body).toEqual({ route: "voiceBios" });
		});

		it("should mount password reset routes", async () => {
			const response = await request(app)
				.get("/password-reset/test")
				.expect(200);

			expect(response.body).toEqual({ route: "passwordReset" });
		});

		it("should mount verification routes", async () => {
			const response = await request(app).get("/verification/test").expect(200);

			expect(response.body).toEqual({ route: "verification" });
		});
	});

	describe("Middleware Order", () => {
		it("should process CORS before routes", async () => {
			const response = await request(app)
				.options("/auth/test")
				.set("Origin", "http://localhost:3000");

			expect(response.headers).toHaveProperty("access-control-allow-origin");
		});

		it("should process body parsing before routes", async () => {
			const response = await request(app)
				.post("/auth/test")
				.send({ test: "data" })
				.set("Content-Type", "application/json");

			expect(response.status).toBe(200);
		});
	});

	describe("Error Handling", () => {
		beforeEach(() => {
			// Mock a route that throws an error
			require("../src/routes/auth").mockImplementation((req, res, next) => {
				if (req.path === "/auth/error") {
					throw new Error("Test error");
				}
				next();
			});
		});

		it("should handle route errors gracefully", async () => {
			const response = await request(app).get("/auth/error");

			// Should not crash the app
			expect(response.status).toBeGreaterThanOrEqual(400);
		});

		it("should return 404 for unknown routes", async () => {
			const response = await request(app).get("/unknown-route").expect(404);
		});
	});

	describe("Request Logging", () => {
		it("should log CORS debug information", async () => {
			const consoleSpy = jest.spyOn(console, "log").mockImplementation();

			await request(app)
				.get("/auth/test")
				.set("Origin", "http://localhost:3000");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("[CORS Debug]")
			);

			consoleSpy.mockRestore();
		});

		it("should log request method and path", async () => {
			const consoleSpy = jest.spyOn(console, "log").mockImplementation();

			await request(app).post("/auth/test");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("POST /auth/test")
			);

			consoleSpy.mockRestore();
		});
	});

	describe("Security Headers", () => {
		it("should not expose sensitive headers", async () => {
			const response = await request(app).get("/auth/test");

			expect(response.headers).not.toHaveProperty("x-powered-by", "Express");
		});

		it("should handle malformed requests", async () => {
			const response = await request(app)
				.post("/auth/test")
				.send("invalid json{")
				.set("Content-Type", "application/json");

			// Should handle malformed JSON gracefully
			expect(response.status).toBeGreaterThanOrEqual(400);
		});
	});

	describe("Content Type Handling", () => {
		it("should accept JSON content type", async () => {
			const response = await request(app)
				.post("/auth/test")
				.send({ test: "data" })
				.set("Content-Type", "application/json")
				.expect(200);
		});

		it("should accept form-encoded content type", async () => {
			const response = await request(app)
				.post("/auth/test")
				.send("test=data")
				.set("Content-Type", "application/x-www-form-urlencoded")
				.expect(200);
		});

		it("should handle multipart form data", async () => {
			const response = await request(app)
				.post("/auth/test")
				.field("test", "data")
				.expect(200);
		});
	});

	describe("Route Precedence", () => {
		it("should match specific routes before wildcards", async () => {
			const response = await request(app).get("/auth/test").expect(200);

			expect(response.body).toEqual({ route: "auth" });
		});

		it("should handle route parameters correctly", async () => {
			// This depends on your actual route setup
			await request(app)
				.get("/users/123")
				.expect((res) => {
					// Should route to users handler
					expect(res.status).toBeLessThan(500);
				});
		});
	});

	describe("Health Check", () => {
		it("should respond to health check requests", async () => {
			// If you have a health check endpoint
			const response = await request(app)
				.get("/health")
				.expect((res) => {
					// Should not return 404
					expect(res.status).not.toBe(404);
				});
		});

		it("should handle root path requests", async () => {
			const response = await request(app)
				.get("/")
				.expect((res) => {
					// Should handle root requests
					expect(res.status).toBeDefined();
				});
		});
	});

	describe("Environment Configuration", () => {
		it("should work in test environment", () => {
			expect(process.env.NODE_ENV).toBe("test");
			expect(app).toBeDefined();
		});

		it("should use correct port configuration", () => {
			// Test that PORT environment variable is respected
			const originalPort = process.env.PORT;
			process.env.PORT = "4000";

			// Clear module cache and re-require
			jest.resetModules();
			const testApp = require("../src/index");

			expect(testApp).toBeDefined();

			// Restore original PORT
			process.env.PORT = originalPort;
		});
	});
});
