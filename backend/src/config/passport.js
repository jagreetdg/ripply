const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AppleStrategy = require("passport-apple");
const supabase = require("./supabase");
const { v4: uuidv4 } = require("uuid");

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

						// Check if user already exists in the database
						const { data: existingUser, error: findError } = await supabase
							.from("users")
							.select("*")
							.eq("email", email)
							.single();

						if (findError && findError.code !== "PGRST116") {
							// PGRST116 is the error code for no rows returned
							throw findError;
						}

						// If user exists, return the user
						if (existingUser) {
							// Update the user's google_id if it doesn't exist
							if (!existingUser.google_id) {
								const { error: updateError } = await supabase
									.from("users")
									.update({
										google_id: profile.id,
										updated_at: new Date().toISOString(),
									})
									.eq("id", existingUser.id);

								if (updateError) throw updateError;
							}

							return done(null, existingUser);
						}

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
								await supabase
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
						const { data: newUser, error: createError } = await supabase
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
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString(),
							})
							.select()
							.single();

						if (createError) throw createError;

						return done(null, newUser);
					} catch (error) {
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

						// Check if user already exists in the database
						const { data: existingUser, error: findError } = await supabase
							.from("users")
							.select("*")
							.eq("email", email)
							.single();

						if (findError && findError.code !== "PGRST116") {
							// PGRST116 is the error code for no rows returned
							throw findError;
						}

						// If user exists, return the user
						if (existingUser) {
							// Update the user's apple_id if it doesn't exist
							if (!existingUser.apple_id) {
								const { error: updateError } = await supabase
									.from("users")
									.update({
										apple_id: profile.sub,
										updated_at: new Date().toISOString(),
									})
									.eq("id", existingUser.id);

								if (updateError) throw updateError;
							}

							return done(null, existingUser);
						}

						// Generate a username based on the email
						const emailUsername = email
							.split("@")[0]
							.replace(/[^a-zA-Z0-9_]/g, "");
						let username = emailUsername + Math.floor(Math.random() * 1000);

						// Check if username already exists and generate unique one
						let attempts = 0;
						let usernameExists = true;
						while (usernameExists && attempts < 10) {
							const { data: usernameCheck, error: usernameError } =
								await supabase
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

						const { data: newUser, error: createError } = await supabase
							.from("users")
							.insert({
								id: userId,
								username,
								email,
								display_name: displayName,
								apple_id: profile.sub,
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString(),
							})
							.select()
							.single();

						if (createError) throw createError;

						return done(null, newUser);
					} catch (error) {
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
			const { data: user, error } = await supabase
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
