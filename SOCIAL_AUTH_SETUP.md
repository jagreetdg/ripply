# Social Authentication Setup for Ripply

This document provides comprehensive instructions for setting up Google and Apple authentication in the Ripply app. The implementation uses the Render-hosted backend at https://ripply-backend.onrender.com.

## Overview

The social authentication flow works as follows:

1. User clicks Google or Apple button on the landing page
2. Authentication happens in a web browser using OAuth
3. Upon successful authentication, the user is redirected back to the app
4. The app extracts the token, fetches user data, and navigates directly to the home screen

## Database Setup

The database needs to be updated with new fields to support social authentication. Follow these steps to update the Supabase database:

1. Connect to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query and paste the following SQL:

```sql
-- Add google_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;

-- Add apple_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id);

-- Add unique constraints to prevent duplicate social accounts
-- Note: These are conditional to allow NULL values
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_apple_id_unique ON users(apple_id) WHERE apple_id IS NOT NULL;
```

4. Run the query to apply the changes to your database

## Render Backend Setup

Since we're using the Render-hosted backend at https://ripply-backend.onrender.com, you'll need to update the environment variables on Render:

1. Log in to your Render dashboard at https://dashboard.render.com
2. Navigate to the Ripply backend service (ripply-backend)
3. Go to the "Environment" tab
4. Add the following environment variables:

```
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Apple OAuth
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=your_base64_encoded_private_key

# Frontend URL for redirects
FRONTEND_URL=https://your-frontend-url.com

# Session configuration
SESSION_SECRET=your_secure_random_session_secret
```

5. For the Apple private key, you'll need to encode it as base64 since Render environment variables don't support multiline values:
   ```bash
   cat /path/to/your/private-key.p8 | base64
   ```
   Then paste the base64-encoded string as the `APPLE_PRIVATE_KEY` value

6. Click "Save Changes" to update the environment variables

7. Deploy the updated backend code to Render:
   - Push your changes to the GitHub repository connected to Render
   - Render will automatically deploy the changes
   - Alternatively, you can trigger a manual deploy from the Render dashboard

8. Monitor the deployment logs to ensure everything is working correctly

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Set up the application name and other details
7. Add authorized JavaScript origins:
   - `https://ripply-backend.onrender.com`
   - Your frontend URL if different
8. Add authorized redirect URIs:
   - `https://ripply-backend.onrender.com/api/auth/google/callback`
9. Click "Create" and note your Client ID and Client Secret
10. Add these credentials to your Render environment variables as described above

## Apple OAuth Setup

1. Go to the [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Register a new App ID if you don't have one already:
   - Go to "Identifiers" > "+" > "App IDs" > "App"
   - Fill in the description and Bundle ID (e.g., com.yourcompany.ripply)
   - Enable "Sign In with Apple" capability
   - Register the App ID

4. Create a Services ID for your web app:
   - Go to "Identifiers" > "+" > "Services IDs"
   - Fill in the description and identifier (e.g., com.yourcompany.ripply.service)
   - Check "Sign In with Apple"
   - Configure the primary app ID to the one you created earlier
   - Add your domain and return URL in the website URLs section:
     - Domain: `ripply-backend.onrender.com`
     - Return URL: `https://ripply-backend.onrender.com/api/auth/apple/callback`
   - Save and register the Services ID

5. Create a private key for Sign In with Apple:
   - Go to "Keys" > "+"
   - Enter a key name (e.g., "Ripply Sign In with Apple Key")
   - Check "Sign In with Apple"
   - Configure the primary app ID
   - Register the key and download the .p8 file (you can only download it once)
   - Note the Key ID

6. Encode the private key as base64 and add it to your Render environment variables

## Testing the Implementation

1. Ensure your backend is properly deployed on Render with all environment variables set
2. Test the authentication flow by clicking the Google or Apple buttons on the landing page
3. Monitor the backend logs on Render for any errors
4. Check the browser console for frontend errors

## Troubleshooting

### Common Issues

1. **Callback URL Mismatch**: Ensure the callback URLs in your Google/Apple developer console match exactly with your backend URLs on Render

2. **CORS Issues**: If you encounter CORS errors, check that your frontend URL is properly configured in the backend's CORS settings on Render

3. **Missing Environment Variables**: Verify all required environment variables are set in the Render dashboard

4. **Invalid Credentials**: Double-check your client IDs and secrets

5. **Apple Private Key Format**: If you have issues with the Apple private key, ensure it's properly base64 encoded and the environment variable is set correctly

### Debug Logs

- Check the Render logs for backend errors
- Monitor the browser console for frontend errors
- The authentication flow includes comprehensive logging to help diagnose issues

### Render-Specific Troubleshooting

1. **Service Not Starting**: Check the build logs for any errors during deployment
2. **Environment Variables Not Applied**: Restart the service after updating environment variables
3. **Memory Issues**: If you encounter memory-related errors, consider upgrading your Render service plan

## Security Considerations

1. Always use HTTPS for all OAuth endpoints
2. Keep your client secrets and private keys secure
3. Implement proper token validation and expiration
4. Use secure, randomly generated values for session secrets
5. Consider implementing additional security measures like rate limiting for authentication endpoints
