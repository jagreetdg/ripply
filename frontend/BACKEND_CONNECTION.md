# Connecting to the Deployed Backend

This document explains how the Ripply frontend connects to the deployed backend on Render.

## Backend URL

The Ripply backend is now deployed at:
```
https://ripply-backend.onrender.com
```

## Configuration

The API configuration has been updated in `services/api/config.js` to prioritize the deployed backend URL:

1. For physical devices, the order of API URLs to try is:
   - `https://ripply-backend.onrender.com/api` (Render deployed backend)
   - Local network IPs (as fallbacks)
   
2. For simulators/emulators:
   - Both iOS and Android simulators will use the Render deployed backend

## Testing the Connection

You can test if your frontend is correctly connecting to the deployed backend by:

1. Running the app
2. Checking the network requests in the developer console
3. Verifying that requests are going to `https://ripply-backend.onrender.com/api/*`

## Switching Back to Local Development

If you need to switch back to local development:

1. Open `services/api/config.js`
2. Modify the `API_URLS` object to prioritize your local backend URL
3. For simulators, change the URLs back to:
   - iOS: `http://localhost:3000/api`
   - Android: `http://10.0.2.2:3000/api`

## Environment Variables

A `.env.example` file has been added to provide guidance for environment configuration. If you want to use environment variables in the future, you can:

1. Copy `.env.example` to `.env`
2. Modify the values as needed
3. Update the code to use these environment variables

## Troubleshooting

If you encounter connection issues:

1. Verify the backend is running by visiting `https://ripply-backend.onrender.com/health`
2. Check your network connection
3. Ensure the API endpoints in your frontend code match those defined in the backend
4. Look for CORS issues in the browser console (if testing in a web browser)
