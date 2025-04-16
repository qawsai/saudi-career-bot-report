# Render Deployment Configuration

This document provides instructions for deploying the Saudi Career Bot with MongoDB integration to Render.

## Prerequisites

Before deploying to Render, ensure you have:
1. A GitHub repository with your code
2. A MongoDB Atlas database set up (see `mongodb_connection_config.md`)
3. A Render account (sign up at [render.com](https://render.com) if you don't have one)

## Deployment Steps

### 1. Create a `.env.sample` file

Create a `.env.sample` file in your repository to show which environment variables are needed:

```
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ASL@123

# Session Secret
SESSION_SECRET=your-session-secret

# Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
```

### 2. Create a `render.yaml` file

Create a `render.yaml` file in the root of your repository:

```yaml
services:
  - type: web
    name: saudia-career-bot
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: ADMIN_USERNAME
        sync: false
      - key: ADMIN_PASSWORD
        sync: false
      - key: SESSION_SECRET
        generateValue: true
      - key: GEMINI_API_KEY
        sync: false
    autoDeploy: true
```

### 3. Deploy to Render

1. **Log in to Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Sign in with your account

2. **Create a New Web Service**:
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository with your Saudi Career Bot code

3. **Configure the Web Service**:
   - Name: `saudia-career-bot` (or your preferred name)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Select the appropriate plan (Free tier is available)

4. **Set Environment Variables**:
   - Click "Advanced" and then "Add Environment Variable"
   - Add the following variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `ADMIN_USERNAME`: admin
     - `ADMIN_PASSWORD`: ASL@123
     - `SESSION_SECRET`: A random string for session security
     - `GEMINI_API_KEY`: Your Google Gemini API key

5. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

### 4. Verify Deployment

1. **Check Build Logs**:
   - Monitor the build logs to ensure the deployment is successful

2. **Test the Application**:
   - Once deployed, click on the generated URL to access your application
   - Test the chat functionality
   - Test the admin panel at `/hadidi82`

### 5. Set Up Auto-Deploy (Optional)

Render automatically deploys when you push to your GitHub repository. To configure this:

1. **In Render Dashboard**:
   - Go to your web service
   - Click "Settings"
   - Under "Build & Deploy", ensure "Auto-Deploy" is enabled

## Troubleshooting

If you encounter issues with your deployment:

1. **Check Logs**:
   - In the Render dashboard, go to your web service
   - Click "Logs" to view the application logs
   - Look for any error messages

2. **Verify Environment Variables**:
   - Ensure all required environment variables are set correctly
   - Check for typos in your MongoDB connection string

3. **Memory Issues**:
   - If your application crashes due to memory limits, consider upgrading your Render plan

4. **MongoDB Connection**:
   - Ensure your MongoDB Atlas cluster allows connections from Render's IP addresses
   - You may need to set Network Access to "Allow Access from Anywhere" (0.0.0.0/0)

5. **Restart the Service**:
   - If needed, you can manually restart your service from the Render dashboard

## Maintenance

To maintain your deployment:

1. **Monitor Usage**:
   - Regularly check your Render dashboard for usage metrics
   - Monitor your MongoDB Atlas dashboard for database performance

2. **Updates**:
   - Push updates to your GitHub repository
   - Render will automatically deploy the changes

3. **Scaling**:
   - If needed, you can upgrade your Render plan for more resources
   - MongoDB Atlas also offers paid tiers for larger databases

## Accessing Your Admin Panel

After deployment, your admin panel will be available at:
```
https://your-app-name.onrender.com/hadidi82
```

Use the following credentials to log in:
- Username: admin
- Password: ASL@123
