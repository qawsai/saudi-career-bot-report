# Testing Instructions

This document provides instructions for testing the Saudi Career Bot with the new admin panel and MongoDB integration.

## Local Testing

### Prerequisites
1. Node.js installed on your machine
2. MongoDB Atlas account set up (see `mongodb_connection_config.md`)
3. Google Gemini API key

### Setup
1. Clone the repository to your local machine
2. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your-mongodb-connection-string
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=ASL@123
   SESSION_SECRET=your-session-secret
   GEMINI_API_KEY=your-gemini-api-key
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```

### Testing the Chat Functionality
1. Open your browser and navigate to `http://localhost:3000`
2. Test the chat interface:
   - Send a message and verify you receive a response
   - Try switching between English and Arabic
   - Upload a CV (PDF file) and test the CV analysis feature
   - Try sending messages that are both career-related and non-career-related

### Testing the Admin Panel
1. Navigate to `http://localhost:3000/hadidi82`
2. You should be redirected to the login page
3. Log in with the credentials:
   - Username: `admin`
   - Password: `ASL@123`
4. After logging in, you should see the admin dashboard with:
   - Statistics section (may be empty if no conversations have been logged)
   - Conversation logs section
5. Test the search and filtering functionality:
   - Try searching for specific terms
   - Filter by language
   - Filter by date range
6. Generate some test conversations by using the chat interface, then refresh the admin panel to see if they appear

### Testing MongoDB Integration
1. After sending messages in the chat interface, check your MongoDB Atlas dashboard:
   - Log in to MongoDB Atlas
   - Navigate to your cluster
   - Click "Collections"
   - You should see a collection named "conversationlogs" with your conversation data
2. Verify that the following data is being stored for each conversation:
   - Timestamp
   - Language
   - User message
   - Bot response
   - Session ID
   - Metadata (user agent, IP address, etc.)

## Production Testing on Render

After deploying to Render (see `render_deployment_config.md`):

1. Navigate to your Render URL (e.g., `https://saudia-career-bot.onrender.com`)
2. Test the chat functionality as described above
3. Test the admin panel at `/hadidi82`
4. Verify that conversations are being logged to MongoDB

## Troubleshooting

### Chat Not Working
- Check browser console for JavaScript errors
- Verify that the Gemini API key is correct
- Check server logs for any backend errors

### Admin Panel Not Working
- Verify you're using the correct credentials
- Check browser console for JavaScript errors
- Check server logs for authentication issues

### MongoDB Not Logging Conversations
- Verify the MongoDB connection string is correct
- Check server logs for MongoDB connection errors
- Verify network access settings in MongoDB Atlas

### Render Deployment Issues
- Check Render logs for any deployment errors
- Verify all environment variables are set correctly
- Try redeploying the application

## Performance Testing

To ensure the application can handle multiple users:

1. Test with multiple browser sessions simultaneously
2. Monitor the MongoDB connection for any performance issues
3. Check Render resource usage during peak activity

## Security Testing

To verify the security of the admin panel:

1. Try accessing `/hadidi82` without logging in
2. Try using incorrect credentials
3. Test session persistence by closing and reopening the browser
4. Verify that the admin panel is not linked from the main application
