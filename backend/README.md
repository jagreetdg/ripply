# Ripply Backend

A Node.js/Express backend for the Ripply voice social media platform.

## 🚀 Features

- **Authentication**: JWT-based auth with social login (Google, Apple)
- **Voice Notes**: Upload, share, like, comment on voice notes
- **User Profiles**: User management with bio, avatar, and voice bio features
- **Social Features**: Follow/unfollow, feed algorithms, interactions
- **Security**: Rate limiting, account lockout, secure middleware
- **Database**: Supabase integration with PostgreSQL

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (Supabase, Passport)
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Custom middleware (auth, rate limiting)
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── tests/               # Test suites
├── scripts/             # Database setup and utility scripts
├── docs/                # Documentation files
└── diagnostics/         # Diagnostic tools (development)
```

## 🛠️ Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   Create a `.env` file with:
   ```
   # Database
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   
   # Authentication
   JWT_SECRET=your_jwt_secret
   
   # OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Server
   PORT=3000
   NODE_ENV=development
   ```

3. **Database setup:**
   ```bash
   npm run setup:db
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/routes/auth.test.js
```

## 📚 API Documentation

- **Authentication**: `/api/auth/*`
- **Voice Notes**: `/api/voice-notes/*`
- **Users**: `/api/users/*`
- **Voice Bios**: `/api/voice-bios/*`

## 🔒 Security Features

- JWT token authentication
- Rate limiting on sensitive endpoints
- Account lockout after failed attempts
- CORS protection
- Input validation and sanitization
- Environment-based configuration

## 🚀 Deployment

See `docs/DEPLOY.md` for deployment instructions.

## 📖 Additional Documentation

- [Authentication Refactor](docs/AUTH_REFACTOR.md)
- [Users Refactor](docs/USERS_REFACTOR.md)
- [Voice Notes Refactor](docs/VOICE_NOTES_REFACTOR.md)
- [Fixes Summary](docs/FIXES_SUMMARY.md)

## 🤝 Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Use proper error handling patterns

## API Endpoints

### Users

- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile
- `GET /api/users/:userId/followers` - Get user's followers
- `GET /api/users/:userId/following` - Get users that a user is following
- `POST /api/users/:userId/follow` - Follow a user
- `DELETE /api/users/:userId/follow` - Unfollow a user

### Voice Notes

- `GET /api/voice-notes` - Get all voice notes (with pagination)
- `GET /api/voice-notes/:id` - Get a single voice note by ID
- `POST /api/voice-notes` - Create a new voice note
- `PUT /api/voice-notes/:id` - Update a voice note
- `DELETE /api/voice-notes/:id` - Delete a voice note
- `POST /api/voice-notes/:id/like` - Like a voice note
- `DELETE /api/voice-notes/:id/like` - Unlike a voice note
- `POST /api/voice-notes/:id/play` - Record a play for a voice note
- `GET /api/voice-notes/:id/comments` - Get comments for a voice note
- `POST /api/voice-notes/:id/comments` - Add a comment to a voice note
- `GET /api/voice-notes/tags/:tagName` - Get voice notes by tag

## Database Schema

The database schema is defined in `src/db/schema.sql` and includes the following tables:

- `users` - User profiles
- `voice_notes` - Voice note posts
- `voice_note_likes` - Likes on voice notes
- `voice_note_comments` - Comments on voice notes
- `voice_note_plays` - Play/listen records for voice notes
- `voice_note_tags` - Tags associated with voice notes
- `follows` - User follow relationships

## Integration with Frontend

To integrate with the Ripply frontend, you'll need to:

1. Update the frontend API client to point to your backend server
2. Implement authentication using Supabase Auth
3. Update the frontend components to use the real API data instead of mock data
