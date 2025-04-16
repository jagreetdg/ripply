# Ripply Backend

This is the backend service for the Ripply voice note social app. It uses Express.js for the API server and Supabase for the database and authentication.

## Setup

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Run the SQL schema in `src/db/schema.sql` in your Supabase SQL editor
3. Copy your Supabase URL and anon key to the `.env` file
4. Install dependencies:

```bash
npm install
```

5. Start the development server:

```bash
npm run dev
```

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
