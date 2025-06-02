const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const voiceNoteRoutes = require("./routes/voiceNotes");
const voiceBioRoutes = require("./routes/voiceBios");
const passwordResetRoutes = require("./routes/passwordReset");
const verificationRoutes = require("./routes/verification");

const app = express();
const PORT = process.env.PORT || 3000;

// Debug middleware for CORS requests
app.use((req, res, next) => {
	console.log(`[CORS Debug] ${req.method} ${req.path}`);
	console.log(`[CORS Debug] Origin: ${req.headers.origin}`);
	console.log(`[CORS Debug] Headers:`, req.headers);

	// Capture the response headers after they're set
	const originalSetHeader = res.setHeader;
	res.setHeader = function (name, value) {
		console.log(`[CORS Debug] Response Header: ${name}: ${value}`);
		return originalSetHeader.apply(this, arguments);
	};

	next();
});

// Set up basic CORS middleware with simple configuration
const allowedOrigins = [
	"http://localhost:3000",
	"http://localhost:19000",
	"http://localhost:19006",
	"http://localhost:8081",
	"http://localhost:8080",
	"https://ripply-app.netlify.app",
	"https://ripply.app",
	"https://ripply.vercel.app",
];

app.use(
	cors({
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);

			// Check if the origin is in our allowed list
			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			}

			// For development, also allow any localhost origin
			if (
				process.env.NODE_ENV !== "production" &&
				origin.includes("localhost")
			) {
				console.log(`[CORS Debug] Allowing development origin: ${origin}`);
				return callback(null, true);
			}

			console.log(`[CORS Debug] Blocking origin: ${origin}`);
			const msg =
				"The CORS policy for this site does not allow access from the specified Origin.";
			return callback(new Error(msg), false);
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Accept", "Authorization"],
		exposedHeaders: ["Content-Range", "X-Content-Range"],
		maxAge: 600, // Increase preflight cache to 10 minutes
	})
);

app.use(express.json());
app.use(cookieParser());

// Initialize Passport and session
app.use(
	session({
		secret: process.env.SESSION_SECRET || "ripply-session-secret",
		resave: false,
		saveUninitialized: false,
		cookie: { secure: process.env.NODE_ENV === "production" },
	})
);
app.use(passport.initialize());
app.use(passport.session());

// Additional CORS header middleware to ensure Access-Control-Allow-Origin is set
app.use((req, res, next) => {
	const origin = req.headers.origin;

	if (
		origin &&
		(allowedOrigins.includes(origin) ||
			(process.env.NODE_ENV !== "production" && origin.includes("localhost")))
	) {
		console.log(
			`[CORS Debug] Setting explicit Access-Control-Allow-Origin for ${origin}`
		);
		res.header("Access-Control-Allow-Origin", origin);
	}
	next();
});

// Add explicit handling for OPTIONS requests
app.options("*", (req, res) => {
	console.log("[CORS Debug] Handling OPTIONS request explicitly");

	const origin = req.headers.origin;

	if (
		origin &&
		(allowedOrigins.includes(origin) ||
			(process.env.NODE_ENV !== "production" && origin.includes("localhost")))
	) {
		res.header("Access-Control-Allow-Origin", origin);
		res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
		res.header(
			"Access-Control-Allow-Headers",
			"Content-Type,Accept,Authorization"
		);
		res.header("Access-Control-Allow-Credentials", "true");
		res.header("Access-Control-Max-Age", "600");
	}

	res.status(204).end();
});

// Security headers middleware
app.use((req, res, next) => {
	// Set security headers
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("X-XSS-Protection", "1; mode=block");
	res.setHeader(
		"Strict-Transport-Security",
		"max-age=31536000; includeSubDomains"
	);

	// In production, enforce Content-Security-Policy
	if (process.env.NODE_ENV === "production") {
		res.setHeader(
			"Content-Security-Policy",
			"default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
		);
	}

	next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/voice-notes", voiceNoteRoutes);
app.use("/api/voice-bios", voiceBioRoutes);
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/verification", verificationRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok", message: "Ripply API is running" });
});

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
