# VoteForm Testing Guide

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- MongoDB running locally
- Both frontend and backend servers running

### Starting the Application

1. **Start Backend:**
```bash
cd voting_app/backend
npm run dev
```
Backend will run on: `http://localhost:5000`

2. **Start Frontend:**
```bash
cd voting_app/frontend
npm start
```
Frontend will run on: `http://localhost:3000`

## 🧪 Testing Authentication

### Method 1: Test Credentials (Guaranteed to Work)
- **Email:** `test@example.com`
- **Password:** `password123`

These credentials are displayed on the login page and are guaranteed to work.

### Method 2: Create New Account
1. Go to `http://localhost:3000/register`
2. Fill in your details:
   - Name: Your Name
   - Email: your-email@example.com
   - Password: minimum 6 characters
   - Confirm Password: same as above
3. Click "Create Account"
4. You should be automatically logged in and redirected to dashboard

### Method 3: Google OAuth (Demo Mode)
1. Click "Continue with Google" on login or register page
2. This will create a demo Google user account
3. You'll be automatically logged in

## 🔧 Troubleshooting

### If Registration/Login Doesn't Work:

1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for any JavaScript errors in Console tab
   - Check Network tab for failed API requests

2. **Check Backend Logs:**
   - Look at the terminal where backend is running
   - Should see debug messages for login attempts

3. **Common Issues:**
   - **CORS Errors:** Make sure backend is running on port 5000
   - **Network Errors:** Check if frontend can reach backend
   - **Password Issues:** Make sure password is at least 6 characters

### Debug API Endpoints:

You can test the backend directly:

```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check users in database
curl http://localhost:5000/api/auth/debug

# Create test user
curl -X POST http://localhost:5000/api/auth/create-test-user

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📱 Testing Features

### After Successful Login:

1. **Dashboard:** View your polls, voted polls, and favorites
2. **Create Poll:** 
   - Click "Create Poll" button
   - Fill in title, description, questions, and options
   - Choose public/private visibility
   - Submit to create
3. **Browse Polls:** View all public polls
4. **Vote on Polls:** Click on any poll to vote
5. **Real-time Updates:** Vote counts update in real-time
6. **Theme Toggle:** Switch between light and dark mode

### Google OAuth Setup (Optional):

To enable real Google OAuth:
1. Get Google Client ID from Google Cloud Console
2. Update `voting_app/frontend/.env`:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id
   ```
3. Update `voting_app/backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your_actual_google_client_id
   GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
   ```

## 🐛 Known Issues & Solutions

1. **"Invalid Credentials" on Login:**
   - Use test credentials: `test@example.com` / `password123`
   - Or create a new account first

2. **Google Sign-in Shows Demo User:**
   - This is expected behavior when Google Client ID is not configured
   - Set up real Google OAuth credentials to use real Google accounts

3. **Poll Creation Fails:**
   - Make sure you're logged in
   - Fill in all required fields
   - Add at least 2 options per question

4. **Real-time Updates Not Working:**
   - Check if Socket.IO is connected (look for WebSocket connection in Network tab)
   - Refresh the page and try again

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Look at browser console for errors
3. Check backend terminal for error messages
4. Try the test credentials provided
