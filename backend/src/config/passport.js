const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AppleStrategy = require("passport-apple").Strategy;
const { supabase, supabaseAdmin } = require("./supabase");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

// Helper function to get callback URL
const getCallbackURL = (provider) => {
	const baseUrl =
		process.env.BACKEND_URL ||
		(process.env.NODE_ENV === "production"
			? "https://ripply-backend.onrender.com"
			: "http://localhost:3000");

	return `${baseUrl}/api/auth/${provider}/callback`;
};

// Initialize passport
const initializePassport = () => {
	// Check if Google credentials are available
	if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
		// Configure Passport to use Google OAuth2.0 strategy
		passport.use(
			new GoogleStrategy(
				{
					clientID: process.env.GOOGLE_CLIENT_ID,
					clientSecret: process.env.GOOGLE_CLIENT_SECRET,
					callbackURL: getCallbackURL("google"),
					scope: ["profile", "email"],
				},
				async (accessToken, refreshToken, profile, done) => {
					try {
						// Check if profile has email
						if (
							!profile.emails ||
							!profile.emails[0] ||
							!profile.emails[0].value
						) {
							return done(new Error("No email provided by Google"), null);
						}

						const email = profile.emails[0].value;
						console.log("[Google OAuth] Looking up user with email:", email);

						// Check if user already exists in the database using supabaseAdmin
						const { data: existingUser, error: findError } = await supabaseAdmin
							.from("users")
							.select("*")
							.eq("email", email)
							.single();

						if (findError && findError.code !== "PGRST116") {
							// PGRST116 is the error code for no rows returned
							console.log("[Google OAuth] Error looking up user:", findError);
							throw findError;
						}

						// If user exists, return the user
						if (existingUser) {
							console.log(
								"[Google OAuth] Found existing user:",
								existingUser.id
							);

							// Update the user's google_id if it doesn't exist
							if (!existingUser.google_id) {
								console.log("[Google OAuth] Adding Google ID to existing user");
								const { error: updateError } = await supabaseAdmin
									.from("users")
									.update({
										google_id: profile.id,
										updated_at: new Date().toISOString(),
									})
									.eq("id", existingUser.id);

								if (updateError) {
									console.log(
										"[Google OAuth] Error updating user with Google ID:",
										updateError
									);
									throw updateError;
								}
							}

							return done(null, existingUser);
						}

						console.log(
							"[Google OAuth] No existing user found, creating new user"
						);

						// Generate a unique username based on the Google profile
						const baseUsername = profile.displayName
							? profile.displayName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "")
							: email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");

						let username = baseUsername + Math.floor(Math.random() * 1000);

						// Check if username already exists and generate unique one
						let attempts = 0;
						let usernameExists = true;
						while (usernameExists && attempts < 10) {
							const { data: usernameCheck, error: usernameError } =
								await supabaseAdmin
									.from("users")
									.select("id")
									.eq("username", username);

							if (usernameError) throw usernameError;

							if (!usernameCheck || usernameCheck.length === 0) {
								usernameExists = false;
							} else {
								attempts++;
								username = baseUsername + Math.floor(Math.random() * 10000);
							}
						}

						// Create a new user
						const userId = uuidv4();
						console.log("[Google OAuth] Creating new user with supabaseAdmin");
						console.log("[Google OAuth] User data:", {
							id: userId,
							username,
							email,
							display_name: profile.displayName || baseUsername,
							google_id: profile.id,
						});

						const { data: newUser, error: createError } = await supabaseAdmin
							.from("users")
							.insert({
								id: userId,
								username,
								email,
								display_name: profile.displayName || baseUsername,
								google_id: profile.id,
								avatar_url:
									profile.photos && profile.photos[0]
										? profile.photos[0].value
										: null,
								is_sso_user: true,
								is_anonymous: false,
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString(),
							})
							.select()
							.single();

						console.log("[Google OAuth] User creation result:", {
							success: !createError,
							error: createError?.message,
							userId: newUser?.id,
						});

						if (createError) throw createError;

						return done(null, newUser);
					} catch (error) {
						console.error("[Google OAuth] Error in passport strategy:", {
							message: error.message,
							code: error.code,
							details: error.details,
							stack: error.stack,
						});
						return done(error, null);
					}
				}
			)
		);
		console.log("Google authentication strategy configured");
	} else {
		console.warn(
			"Google authentication not configured - missing environment variables"
		);
	}

	// Check if Apple credentials are available
	if (
		process.env.APPLE_CLIENT_ID &&
		process.env.APPLE_TEAM_ID &&
		process.env.APPLE_KEY_ID &&
		(process.env.APPLE_PRIVATE_KEY || process.env.APPLE_PRIVATE_KEY_LOCATION)
	) {
		// Determine how to get the private key
		let privateKeyLocation = null;
		let privateKey = null;

		if (process.env.APPLE_PRIVATE_KEY) {
			// If the private key is provided directly as a base64 encoded string
			try {
				privateKey = Buffer.from(
					process.env.APPLE_PRIVATE_KEY,
					"base64"
				).toString("utf-8");
			} catch (error) {
				console.error("Error decoding Apple private key:", error);
				// Don't initialize Apple strategy if we can't decode the key
				return;
			}
		} else {
			// If the private key is provided as a file location
			privateKeyLocation = process.env.APPLE_PRIVATE_KEY_LOCATION;
		}

		// Configure Passport to use Apple strategy
		passport.use(
			new AppleStrategy(
				{
					clientID: process.env.APPLE_CLIENT_ID,
					teamID: process.env.APPLE_TEAM_ID,
					keyID: process.env.APPLE_KEY_ID,
					privateKeyLocation: privateKeyLocation,
					privateKey: privateKey,
					callbackURL: getCallbackURL("apple"),
					scope: ["name", "email"],
				},
				async (req, accessToken, refreshToken, idToken, profile, done) => {
					try {
						// Apple profile structure is different from Google's
						// The email is in the idToken payload
						const email = profile.email;

						if (!email) {
							return done(new Error("No email provided by Apple"), null);
						}

						console.log("[Apple OAuth] Looking up user with email:", email);

						// Check if user already exists in the database using supabaseAdmin
						const { data: existingUser, error: findError } = await supabaseAdmin
							.from("users")
							.select("*")
							.eq("email", email)
							.single();

						if (findError && findError.code !== "PGRST116") {
							// PGRST116 is the error code for no rows returned
							console.log("[Apple OAuth] Error looking up user:", findError);
							throw findError;
						}

						// If user exists, return the user
						if (existingUser) {
							console.log(
								"[Apple OAuth] Found existing user:",
								existingUser.id
							);

							// Update the user's apple_id if it doesn't exist
							if (!existingUser.apple_id) {
								console.log("[Apple OAuth] Adding Apple ID to existing user");
								const { error: updateError } = await supabaseAdmin
									.from("users")
									.update({
										apple_id: profile.sub,
										updated_at: new Date().toISOString(),
									})
									.eq("id", existingUser.id);

								if (updateError) {
									console.log(
										"[Apple OAuth] Error updating user with Apple ID:",
										updateError
									);
									throw updateError;
								}
							}

							return done(null, existingUser);
						}

						console.log(
							"[Apple OAuth] No existing user found, creating new user"
						);

						// Generate a unique username based on the Apple profile
						const emailUsername = email
							.split("@")[0]
							.replace(/[^a-zA-Z0-9_]/g, "");
						let username = emailUsername + Math.floor(Math.random() * 1000);

						// Check if username already exists and generate unique one
						let attempts = 0;
						let usernameExists = true;
						while (usernameExists && attempts < 10) {
							const { data: usernameCheck, error: usernameError } =
								await supabaseAdmin
									.from("users")
									.select("id")
									.eq("username", username);

							if (usernameError) throw usernameError;

							if (!usernameCheck || usernameCheck.length === 0) {
								usernameExists = false;
							} else {
								attempts++;
								username = emailUsername + Math.floor(Math.random() * 10000);
							}
						}

						// Create a new user
						const userId = uuidv4();
						const displayName = profile.name
							? `${profile.name.firstName} ${profile.name.lastName}`
							: emailUsername;

						console.log("[Apple OAuth] Creating new user with supabaseAdmin");
						console.log("[Apple OAuth] User data:", {
							id: userId,
							username,
							email,
							display_name: displayName,
							apple_id: profile.sub,
						});

						const { data: newUser, error: createError } = await supabaseAdmin
							.from("users")
							.insert({
								id: userId,
								username,
								email,
								display_name: displayName,
								apple_id: profile.sub,
								is_sso_user: true,
								is_anonymous: false,
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString(),
							})
							.select()
							.single();

						console.log("[Apple OAuth] User creation result:", {
							success: !createError,
							error: createError?.message,
							userId: newUser?.id,
						});

						if (createError) throw createError;

						return done(null, newUser);
					} catch (error) {
						console.error("[Apple OAuth] Error in passport strategy:", {
							message: error.message,
							code: error.code,
							details: error.details,
							stack: error.stack,
						});
						return done(error, null);
					}
				}
			)
		);
		console.log("Apple authentication strategy configured");
	} else {
		console.warn(
			"Apple authentication not configured - missing environment variables"
		);
	}

	// Serialize user to the session
	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	// Deserialize user from the session
	passport.deserializeUser(async (id, done) => {
		try {
			const { data: user, error } = await supabaseAdmin
				.from("users")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			if (!user) return done(null, false);

			// Remove password from user object
			delete user.password;

			done(null, user);
		} catch (error) {
			done(error, null);
		}
	});
};

// Initialize passport strategies
initializePassport();

module.exports = passport;
