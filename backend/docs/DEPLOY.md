# Deploying Ripply Backend to Render

This guide explains how to deploy the Ripply backend to Render.com, a free cloud hosting service.

## Prerequisites

- A GitHub account with the Ripply repository
- A Render.com account (free tier is sufficient)
- Supabase project (for database)

## Deployment Steps

### 1. Push your code to GitHub

Ensure your backend code is pushed to the `f/backend` branch on GitHub:

```bash
git checkout f/backend
git add .
git commit -m "Prepare backend for Render deployment"
git push origin f/backend
```

### 2. Create a new Web Service on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository
4. Select the repository and the `f/backend` branch
5. Configure the service:
   - **Name**: ripply-backend (or your preferred name)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Set Environment Variables

In the Render dashboard, add the following environment variables:

- `NODE_ENV`: production
- `PORT`: 10000 (Render will automatically assign the PORT to your app)
- `DATABASE_URL`: Your Supabase PostgreSQL connection string
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key (public key)
- `SUPABASE_KEY`: Alternative to SUPABASE_ANON_KEY (for backward compatibility)
- `JWT_SECRET`: A secure random string for JWT authentication

### 4. Deploy

Click "Create Web Service" and Render will automatically deploy your backend.

## Automatic Deployments

With the `render.yaml` configuration file in your repository, you can also use Render's Blueprint feature for automatic deployments:

1. Go to the Render Dashboard
2. Click "New" and select "Blueprint"
3. Connect your GitHub repository
4. Render will detect the `render.yaml` file and set up the services accordingly

## Connecting Frontend to Deployed Backend

Update your frontend configuration to point to your new backend URL:

```javascript
// In your frontend config file
const API_URL = 'https://ripply-backend.onrender.com';
```

## Troubleshooting

- **Deployment Fails**: Check the build logs in Render dashboard
- **Database Connection Issues**: Verify your Supabase credentials and ensure the IP is allowed in Supabase
- **CORS Errors**: Make sure your backend CORS configuration includes your frontend domain
