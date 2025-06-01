# VoteForm - Interactive Polls & Forms Platform

A full-stack web application similar to Typeform that allows users to create, share, and participate in interactive polls and forms with real-time results.

## Features

### Core Features
- **User Authentication**: Sign up/login with email or Google OAuth
- **Interactive Poll Creation**: Multiple question types with customizable options
- **Real-time Results**: Live updates using WebSockets (Socket.IO)
- **Public/Private Polls**: Control poll visibility and access
- **Responsive Design**: Works seamlessly on all devices
- **Dark/Light Mode**: Theme toggle with user preference persistence

### User Features
- **Personal Dashboard**: View created polls, voted polls, and favorites
- **Poll Management**: Create, edit, delete, and share polls
- **Real-time Voting**: Instant result updates as votes come in
- **Poll Discovery**: Browse and vote on public polls
- **Favorites System**: Save interesting polls for later

### Technical Features
- **RESTful API**: Clean and well-documented backend API
- **Real-time Communication**: Socket.IO for live updates
- **Responsive UI**: Mobile-first design with CSS Grid/Flexbox
- **Theme System**: CSS custom properties for easy theming
- **Data Validation**: Both client and server-side validation

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React.js** - UI library (without TypeScript)
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **CSS3** - Styling (no frameworks like Tailwind)
- **Chart.js** - Data visualization

## Project Structure

```
voting_app/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Poll.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── polls.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    │   ├── index.html
    │   └── manifest.json
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   └── ProtectedRoute.js
    │   ├── contexts/
    │   │   ├── AuthContext.js
    │   │   └── ThemeContext.js
    │   ├── pages/
    │   │   ├── Home.js
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js
    │   │   ├── CreatePoll.js
    │   │   ├── ViewPoll.js
    │   │   └── PublicPolls.js
    │   ├── styles/
    │   │   ├── globals.css
    │   │   └── components.css
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd voting_app/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voting_app
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_super_secret_session_key_change_this_in_production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd voting_app/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### Database Setup

1. **Local MongoDB**: Make sure MongoDB is running on your system
2. **MongoDB Atlas**: Update the `MONGODB_URI` in your `.env` file with your Atlas connection string

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/theme` - Update user theme

### Polls
- `GET /api/polls/public` - Get public polls
- `GET /api/polls/my` - Get user's polls (protected)
- `GET /api/polls/voted` - Get polls user voted on (protected)
- `GET /api/polls/favorites` - Get user's favorite polls (protected)
- `GET /api/polls/:id` - Get specific poll
- `POST /api/polls` - Create new poll (protected)
- `POST /api/polls/:id/vote` - Vote on poll
- `POST /api/polls/:id/favorite` - Toggle favorite (protected)
- `PUT /api/polls/:id` - Update poll (protected, creator only)
- `DELETE /api/polls/:id` - Delete poll (protected, creator only)

## Features in Detail

### User Authentication
- Email/password registration and login
- JWT-based authentication
- Google OAuth integration (configurable)
- Protected routes and API endpoints

### Poll Creation
- Multiple question types (single-choice, multiple-choice, text, rating, yes/no)
- Customizable poll settings
- Public/private visibility options
- Real-time shareable URLs

### Real-time Features
- Live vote counting
- Instant result updates
- Socket.IO room-based updates
- Real-time poll statistics

### Theme System
- Light and dark mode support
- User preference persistence
- CSS custom properties
- Smooth theme transitions

## Development

### Running in Development Mode

1. Start MongoDB service
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm start`
4. Access the application at `http://localhost:3000`

### Building for Production

1. Build frontend:
```bash
cd frontend && npm run build
```

2. Set environment variables for production
3. Start backend in production mode:
```bash
cd backend && npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
