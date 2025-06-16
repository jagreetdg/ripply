# Backend Fixes Required After Frontend Refactor

## Overview
This document outlines all the backend fixes required to align with the frontend after the recent refactor. The frontend has been updated to match the current backend implementation, but several discrepancies and missing features need to be addressed on the backend side.

## 🚨 Critical Issues (HIGH PRIORITY)

### 1. Authentication Mismatches

#### A. User Search Endpoint
- **Current:** `GET /api/users/search` (requires authentication)
- **Issue:** Frontend expects this to be public
- **Fix Required:** Remove authentication requirement for user search
- **Impact:** Breaks user discovery functionality

#### B. Voice Note Plays Recording
- **Current:** `POST /api/voice-notes/:id/play` (may require auth)
- **Issue:** Frontend expects this to be public
- **Fix Required:** Allow anonymous play recording
- **Impact:** Breaks play count tracking for non-authenticated users

#### C. Voice Bio Reading
- **Current:** `GET /api/voice-bios/:userId` (may require auth)
- **Issue:** Frontend expects public access to voice bios
- **Fix Required:** Make voice bio reading public
- **Impact:** Breaks voice bio display on public profiles

### 2. Parameter Naming Inconsistencies

#### A. Share Endpoints
- **Current:** Mix of `:id` and `:voiceNoteId` parameters
- **Issue:** Frontend now uses consistent `:voiceNoteId`
- **Fix Required:** Standardize all share endpoints to use `:voiceNoteId`
- **Affected Endpoints:**
  - `POST /api/voice-notes/:voiceNoteId/share`
  - `GET /api/voice-notes/:voiceNoteId/shares`
  - `GET /api/voice-notes/:id/shares/check` ← Should be `:voiceNoteId`

#### B. User Endpoints
- **Current:** Mix of `:userId` and `:username` parameters
- **Issue:** Inconsistent parameter naming
- **Fix Required:** Clear distinction between ID-based and username-based routes
- **Impact:** Potential routing conflicts

## 📋 Missing Endpoints (MEDIUM PRIORITY)

### 1. Voice Note Combined Stats
```http
GET /api/voice-notes/:id/stats
```
**Expected Response:**
```json
{
  "likes": 42,
  "comments": 15,
  "plays": 1250,
  "shares": 8
}
```
**Current Status:** Individual endpoints exist but no combined stats
**Frontend Impact:** Currently returns default values (0,0,0,0)

### 2. Voice Note Recommendations
```http
GET /api/voice-notes/recommended?userId={userId}&limit={limit}
```
**Expected Response:**
```json
[
  {
    "id": "vn123",
    "title": "Recommended Voice Note",
    "user_id": "user456",
    // ... other voice note fields
  }
]
```
**Current Status:** Does not exist
**Frontend Impact:** Returns empty array

### 3. General Search Endpoint
```http
GET /api/search?query={query}&type={type}&limit={limit}
```
**Expected Response:**
```json
{
  "users": [...],
  "voice_notes": [...],
  "total": 25
}
```
**Current Status:** Does not exist
**Frontend Impact:** Search functionality limited

### 4. Search Suggestions
```http
GET /api/search/suggestions?query={query}
```
**Expected Response:**
```json
{
  "suggestions": ["javascript", "react", "programming"]
}
```
**Current Status:** Does not exist
**Frontend Impact:** No search autocomplete

### 5. Trending Searches
```http
GET /api/search/trending
```
**Expected Response:**
```json
{
  "trending": ["ai", "climate change", "productivity"]
}
```
**Current Status:** Does not exist
**Frontend Impact:** No trending search display

## 🔧 Response Format Standardization (MEDIUM PRIORITY)

### 1. Pagination Consistency
**Issue:** Inconsistent pagination across endpoints
**Fix Required:** Standardize all list endpoints to support:
```http
GET /endpoint?page=1&limit=20
```
**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasNext": true
  }
}
```

### 2. Error Response Standardization
**Issue:** Inconsistent error response formats
**Fix Required:** Standardize all error responses:
```json
{
  "message": "User-friendly error message",
  "error": "Technical error details",
  "status": 400
}
```

## 🚀 Future Features (LOW PRIORITY)

### 1. Notifications System
**Status:** Not implemented (frontend uses mock data)
**Required Endpoints:**
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/mark-read` - Mark notifications as read
- `GET /api/notifications/count` - Get unread count
- WebSocket support for real-time notifications

### 2. User Settings System
**Status:** Not implemented (frontend uses mock data)
**Required Endpoints:**
- `GET /api/users/:userId/settings` - Get user settings
- `PUT /api/users/:userId/settings` - Update user settings
- `GET /api/users/:userId/privacy` - Get privacy settings
- `PUT /api/users/:userId/privacy` - Update privacy settings

### 3. Advanced Feed Features
**Required Endpoints:**
- `GET /api/voice-notes/trending` - Get trending voice notes
- `GET /api/voice-notes/discovery/:userId` - Enhanced discovery algorithm
- `GET /api/users/suggested/:userId` - Suggested users to follow

## 📊 Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. Fix authentication mismatches
2. Standardize parameter naming
3. Create voice note stats endpoint

### Phase 2: Core Features (Week 2)
1. Implement search endpoints
2. Add recommendations endpoint
3. Standardize response formats

### Phase 3: Enhanced Features (Week 3+)
1. Implement notifications system
2. Add user settings endpoints
3. Advanced feed algorithms

## 🧪 Testing Requirements

### 1. Authentication Testing
- Verify public endpoints work without auth
- Verify protected endpoints still require auth
- Test edge cases for mixed auth requirements

### 2. Parameter Testing
- Test all endpoints with new parameter names
- Verify backward compatibility where needed
- Test parameter validation

### 3. Response Format Testing
- Verify all responses match expected formats
- Test pagination on all list endpoints
- Validate error response consistency

## 📝 Implementation Notes

### Database Considerations
- Voice note stats may require denormalization for performance
- Search functionality may need full-text search indexes
- Notifications will require new database tables

### Performance Considerations
- Stats endpoint should be cached/denormalized
- Search endpoints need proper indexing
- Recommendations may require background processing

### Security Considerations
- Ensure public endpoints have appropriate rate limiting
- Validate all input parameters
- Implement proper CORS for public endpoints

## ✅ Completed Frontend Fixes

The following frontend issues have been resolved:
- ✅ Fixed authentication endpoint configuration (`/api/auth/me`)
- ✅ Fixed share/repost parameter naming (now uses `voiceNoteId`)
- ✅ Fixed search endpoints to not require authentication
- ✅ Fixed voice note reading to be public
- ✅ Fixed user profile reading to be public
- ✅ Removed calls to non-existent endpoints
- ✅ Added graceful handling for missing backend features
- ✅ Standardized parameter naming in frontend calls

## 🔗 Related Files

### Backend Files to Modify
- `backend/src/routes/voiceNotes.js` - Add stats endpoint
- `backend/src/routes/users.js` - Fix authentication requirements
- `backend/src/controllers/voiceNotes/` - Add stats controller
- `backend/src/controllers/search/` - Create search controllers (new)
- `backend/src/middleware/auth/` - Update auth requirements

### Frontend Files Modified
- `frontend/services/api/config.ts` - Updated endpoint configurations
- `frontend/services/api/modules/*.ts` - Fixed authentication and parameters
- All API modules now handle missing backend endpoints gracefully

---

**Last Updated:** December 19, 2024  
**Status:** Frontend fixes completed, backend fixes pending  
**Next Action:** Implement Phase 1 critical fixes 