# MongoDB Connection Configuration

This file contains instructions for setting up the MongoDB connection for the Saudi Career Bot admin panel.

## Environment Variables

Create a `.env` file in the root directory of the project with the following variables:

```
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ASL@123

# Session Secret
SESSION_SECRET=saudi-career-bot-secret-key

# Gemini API Key (existing)
GEMINI_API_KEY=your-gemini-api-key
```

## MongoDB Atlas Setup Instructions

1. **Create a MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up or log in to your account

2. **Create a New Cluster**:
   - Click "Build a Database"
   - Choose the free tier option (M0)
   - Select your preferred cloud provider and region
   - Click "Create Cluster"

3. **Set Up Database Access**:
   - In the left sidebar, click "Database Access"
   - Click "Add New Database User"
   - Create a username and password (use a strong password)
   - Set privileges to "Read and Write to Any Database"
   - Click "Add User"

4. **Set Up Network Access**:
   - In the left sidebar, click "Network Access"
   - Click "Add IP Address"
   - For development, you can choose "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, add the specific IP addresses of your Render deployment
   - Click "Confirm"

5. **Get Your Connection String**:
   - Once your cluster is created, click "Connect"
   - Select "Connect your application"
   - Choose "Node.js" as the driver and the appropriate version
   - Copy the connection string
   - Replace `<password>` with your database user's password
   - Replace `<dbname>` with your preferred database name (e.g., "saudi-career-bot")

6. **Add the Connection String to Your .env File**:
   - Paste the connection string as the value for `MONGODB_URI` in your `.env` file

## Testing the Connection

To test if your MongoDB connection is working:

1. Start your application:
   ```
   npm start
   ```

2. Check the console logs:
   - If successful, you should see "MongoDB connected successfully"
   - If there's an error, you'll see "MongoDB connection error" followed by the error details

## Troubleshooting

If you encounter connection issues:

1. **Check your network settings**:
   - Ensure your IP address is allowed in the MongoDB Atlas Network Access settings

2. **Verify credentials**:
   - Double-check your username and password in the connection string

3. **Check for typos**:
   - Ensure there are no typos in your connection string

4. **Cluster status**:
   - Verify your MongoDB Atlas cluster is active and running

5. **Firewall issues**:
   - If you're behind a firewall, ensure outbound connections to MongoDB Atlas are allowed
