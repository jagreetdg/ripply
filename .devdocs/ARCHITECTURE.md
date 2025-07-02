# RIPPLY APPLICATION ARCHITECTURE

## Overview

Ripply is a voice-note-based social media application with a modern, scalable architecture following separation of concerns principles. The system uses a **client-server architecture** with a React Native frontend, Express.js backend, and Supabase as the database and storage layer.

## Architecture Pattern

The application follows a **3-tier architecture**:
- **Presentation Layer**: React Native + Expo frontend
- **Application Layer**: Express.js REST API backend
- **Data Layer**: Supabase (PostgreSQL + Storage)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│  React Native   │◄──►│   Express.js    │◄──►│   Supabase      │
│  + Expo         │    │   REST API      │    │ PostgreSQL +    │
│                 │    │                 │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Frontend Architecture

### Technology Stack
- **Framework**: React Native with Expo SDK
- **Routing**: Expo Router (file-based routing)
- **State Management**: React Context + AsyncStorage
- **UI Components**: Custom components with styled-components approach
- **Authentication**: JWT tokens with AsyncStorage persistence

### File Structure
```
frontend/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root layout with providers
│   ├── (tabs)/                  # Tab navigation group
│   ├── (with-tabs)/             # Pages with tab navigation
│   ├── auth/                    # Authentication pages
│   ├── profile/                 # Profile-related pages
│   └── settings/                # Settings pages
├── components/                   # Reusable UI components
│   ├── auth/                    # Authentication components
│   ├── common/                  # Shared components
│   ├── home/                    # Home/feed components
│   ├── profile/                 # Profile components
│   └── voice-note-card/         # Voice note components
├── context/                      # React Context providers
│   ├── UserContext.tsx          # User state management
│   └── ThemeContext.tsx         # Theme/styling management
├── services/                     # API and external services
│   └── api/                     # API client configuration
├── hooks/                        # Custom React hooks
├── utils/                        # Utility functions
└── constants/                    # App constants
```

### State Management Architecture

**Global State (React Context)**:
- `UserContext`: Manages authentication state and user data
- `ThemeContext`: Handles app theming and dark/light mode

**Local State**:
- Component-level state for UI interactions
- AsyncStorage for data persistence

**State Flow**:
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UserContext   │    │ Component State │    │  AsyncStorage   │
│  (Global User)  │◄──►│  (UI States)    │◄──►│ (Persistence)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

**Atomic Design Pattern**:
- **Atoms**: Basic UI elements (buttons, inputs, icons)
- **Molecules**: Component combinations (search bars, cards)
- **Organisms**: Complex components (headers, feeds, modals)
- **Templates**: Page layouts
- **Pages**: Complete screens

**Example Component Structure**:
```
components/voice-note-card/
├── VoiceNoteCard.tsx           # Main component
├── VoiceNoteCardImpl.tsx       # Implementation details
├── VoiceNoteCardStyles.ts      # Styling
├── components/                 # Sub-components
│   ├── VoiceNoteCardContent.tsx
│   └── VoiceNoteRepostAttribution.tsx
└── hooks/                      # Component-specific hooks
    ├── useVoiceNoteCard.ts
    └── useVoiceNoteAudio.ts
```

---

## Backend Architecture

### Technology Stack
- **Framework**: Express.js
- **Database ORM**: Direct Supabase client
- **Authentication**: Passport.js + JWT
- **File Upload**: Multer (future integration)
- **Security**: CORS, Helmet, Rate limiting

### File Structure (MVC Pattern)
```
backend/src/
├── index.js                     # Application entry point
├── config/                      # Configuration files
│   ├── supabase.js             # Database connection
│   └── passport.js             # Authentication config
├── controllers/                 # Request handlers (MVC Controllers)
│   ├── auth/                   # Authentication controllers
│   ├── users/                  # User management controllers
│   └── voiceNotes/             # Voice note controllers
├── services/                    # Business logic (MVC Services)
│   ├── auth/                   # Authentication services
│   ├── users/                  # User services
│   └── voiceNotes/             # Voice note services
├── routes/                      # API routing (MVC Routes)
│   ├── auth.js                 # Auth endpoints
│   ├── users.js                # User endpoints
│   └── voiceNotes.js           # Voice note endpoints
├── middleware/                  # Custom middleware
│   ├── auth.js                 # Authentication middleware
│   ├── rateLimiter.js          # Rate limiting
│   └── accountLockout.js       # Security middleware
├── utils/                       # Utility functions
├── models/                      # Data models
└── db/                          # Database utilities
```

### Service Layer Architecture

**Service Pattern Implementation**:
```javascript
// Example: authService.js
const authService = {
  registerUser(userData) { /* business logic */ },
  authenticateUser(email, password) { /* business logic */ },
  validateUserForToken(userId) { /* business logic */ }
};
```

**Controller-Service-Database Flow**:
```
Request → Controller → Service → Database → Response
   ↓         ↓          ↓          ↓         ↑
 Routing   Validation  Business   Data    JSON
         Middleware    Logic     Access  Response
```

### API Architecture

**RESTful API Design**:
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

**Authentication Flow**:
```
Client → POST /api/auth/login → JWT Token → Stored in AsyncStorage
     ← Response with token ←    Generated   ← Returned to client
```

---

## Database Architecture

### Technology Stack
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage (images, audio)
- **Real-time**: Supabase Realtime (future)

### Database Schema

**Core Tables**:
```sql
users
├── id (UUID, PK)
├── username (TEXT, UNIQUE)
├── email (TEXT, UNIQUE)
├── display_name (TEXT)
├── avatar_url (TEXT)
├── cover_photo_url (TEXT)
├── bio (TEXT)
├── is_verified (BOOLEAN)
└── timestamps

voice_notes
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── title (TEXT)
├── duration (INTEGER)
├── audio_url (TEXT)
├── background_image (TEXT)
└── timestamps

voice_note_likes
├── id (UUID, PK)
├── voice_note_id (UUID, FK → voice_notes.id)
├── user_id (UUID, FK → users.id)
└── created_at
```

**Relationship Diagram**:
```
     users
       │
       ├─ voice_notes (1:many)
       ├─ voice_note_likes (1:many)
       ├─ voice_note_comments (1:many)
       ├─ follows (many:many self-reference)
       └─ voice_bios (1:1)
```

### Data Access Patterns

**Repository Pattern via Supabase Client**:
```javascript
// Example data access
const getUserVoiceNotes = async (userId) => {
  const { data, error } = await supabase
    .from('voice_notes')
    .select('*')
    .eq('user_id', userId);
  return data;
};
```

---

## Storage Architecture

### Current Implementation (MVP)
- **Profile Images**: Supabase Storage (public bucket)
- **Voice Notes**: Supabase Storage (private bucket)
- **Temporary Files**: Local storage during upload

### Future Scalability Plan
- **Cloudflare R2**: Long-term voice note storage
- **CDN**: Edge caching for faster delivery
- **Signed URLs**: Secure access to private content

**Storage Flow**:
```
Upload → Backend Validation → Supabase Storage → URL → Database
   ↓           ↓                    ↓           ↓       ↓
Client      Size/Type           File Storage   Public   Record
Request     Validation          (Temp/Perm)    URL      Creation
```

---

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Passport.js**: Social OAuth integration
- **Account Lockout**: Brute force protection
- **Rate Limiting**: API abuse prevention

### Data Security
- **Password Hashing**: bcrypt + client-side SHA-256
- **CORS**: Restricted origin policy
- **Security Headers**: XSS, CSRF protection
- **Input Validation**: Request sanitization

### Privacy Controls
- **Private Voice Notes**: Signed URL access
- **User Blocking**: Content filtering
- **Data Encryption**: Sensitive data protection

---

## Communication Architecture

### API Communication
```
Frontend (React Native) ◄─────► Backend (Express.js) ◄─────► Database (Supabase)
    │                              │                          │
    ├─ HTTP/REST requests          ├─ Business logic          ├─ Data persistence
    ├─ JWT authentication          ├─ Validation              ├─ File storage
    ├─ AsyncStorage caching        ├─ Error handling          └─ Real-time features
    └─ Offline support (future)    └─ Rate limiting
```

### Data Flow Patterns

**User Authentication Flow**:
```
1. User enters credentials → Frontend
2. SHA-256 hash password → Frontend
3. POST /api/auth/login → Backend
4. Validate & hash with bcrypt → Backend
5. Generate JWT token → Backend
6. Store token → Frontend (AsyncStorage)
7. Include in API headers → All subsequent requests
```

**Voice Note Creation Flow**:
```
1. Record audio → Frontend
2. Create audio blob → Frontend
3. POST /api/voice-notes → Backend (with file)
4. Upload to Supabase Storage → Backend
5. Create database record → Backend
6. Return voice note data → Frontend
7. Update UI state → Frontend
```

---

## Development Architecture

### Project Structure
```
ripply/
├── frontend/                    # React Native app
├── backend/                     # Express.js API
├── scripts/                     # Deployment/utility scripts
├── .devdocs/                    # Architecture documentation
└── package.json                 # Root dependencies
```

### Development Workflow
- **Frontend**: Expo development server
- **Backend**: Nodemon for hot reload
- **Database**: Supabase cloud instance
- **Testing**: Jest for both frontend and backend

### Environment Configuration
```
Development:
├── Frontend: expo start
├── Backend: npm run dev
└── Database: Supabase cloud

Production:
├── Frontend: Expo build/EAS build
├── Backend: Node.js server (Render/Railway)
└── Database: Supabase production
```

---

## Scalability Considerations

### Current Limitations
1. **Monolithic Backend**: Single Express.js server
2. **Single Database**: All data in one Supabase instance
3. **Storage Dependency**: Tied to Supabase storage limits
4. **No Caching**: Direct database queries for each request

### Scaling Strategy

#### Phase 1: Optimization (Current → 10K users)
- **Database Optimization**: Add proper indexes and query optimization
- **Caching Layer**: Redis for frequently accessed data
- **CDN Integration**: CloudFlare for static assets
- **API Rate Limiting**: Protect against abuse

#### Phase 2: Horizontal Scaling (10K → 100K users)
- **Load Balancer**: Multiple backend instances
- **Database Sharding**: Partition users across databases
- **Microservices**: Split auth, users, voice notes into separate services
- **Message Queue**: Background job processing

#### Phase 3: High Availability (100K+ users)
- **Multi-region Deployment**: Global distribution
- **Database Clustering**: Master-slave replication
- **Event-driven Architecture**: Async communication between services
- **Auto-scaling**: Dynamic resource allocation

### Proposed Microservices Architecture
```
                    ┌─────────────────┐
                    │   API Gateway   │
                    │  (Rate Limiting)│
                    └─────────┬───────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │  Auth Service   │ │  User Service   │ │ Voice Service   │
    │                 │ │                 │ │                 │
    └─────────┬───────┘ └─────────┬───────┘ └─────────┬───────┘
              ▼                   ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │   Auth DB       │ │   User DB       │ │  Content DB     │
    │                 │ │                 │ │                 │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Performance Optimization

### Current Performance Strategies
- **Database Indexes**: Optimized queries on frequently accessed columns
- **Image Optimization**: Resize and compress profile images
- **Lazy Loading**: Load content as needed in feeds
- **Connection Pooling**: Efficient database connections

### Future Optimizations
- **CDN**: Global content distribution
- **Caching**: Redis for session and frequently accessed data
- **Database Optimization**: Query optimization and proper indexing
- **Image Processing**: Multiple sizes and formats
- **Audio Compression**: Optimize voice note file sizes

---

## Monitoring and Observability

### Current Monitoring
- **Console Logging**: Basic request/error logging
- **Supabase Dashboard**: Database performance metrics
- **Expo Analytics**: Basic app usage stats

### Production Monitoring (Recommended)
- **APM**: Application performance monitoring (DataDog/NewRelic)
- **Error Tracking**: Centralized error logging (Sentry)
- **Metrics**: Custom business metrics (user engagement, voice note creation)
- **Health Checks**: Service availability monitoring

---

## Deployment Architecture

### Current Deployment
- **Frontend**: Expo Application Services (EAS)
- **Backend**: Render.com or Railway
- **Database**: Supabase Cloud
- **Storage**: Supabase Storage

### CI/CD Pipeline (Recommended)
```
Code Push → GitHub → CI/CD Pipeline → Automated Testing → Deployment
    ↓          ↓            ↓               ↓              ↓
  Git        Triggers    Build/Test     Unit/Integration  Production
 Commit      Actions     Process         Tests           Release
```

---

## Conclusion

The Ripply architecture is well-structured for an MVP with clear separation of concerns and scalable foundations. The current architecture supports:

✅ **Clean Code Organization**: MVC pattern with service layers  
✅ **Scalable Database Design**: Normalized schema with proper relationships  
✅ **Secure Authentication**: JWT + OAuth with proper validation  
✅ **Modern Frontend**: React Native with context-based state management  
✅ **RESTful API**: Well-defined endpoints with consistent patterns  

The architecture provides a solid foundation for scaling to millions of users with minimal refactoring by following the outlined scaling strategy and implementing the suggested microservices architecture when needed. 