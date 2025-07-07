# 📄 Ripply Product Requirements Document (MVP)

## 🧠 Overview

**Ripply** is a voice-note-based social networking platform designed for creative expression and anonymity. The MVP will allow users to create, share, and interact with short voice posts, with a strong focus on mobile-first design, user privacy, and discoverability. This document defines the step-by-step, testable tasks needed for an engineering LLM to execute the MVP using Taskmaster AI in Cursor.

---

## 🚀 Goals

- Build and launch a working MVP with:
  - User auth
  - Voice posts (creation, playback, interaction)
  - Feed and discovery
  - Voice/text comments
  - In-app notifications
  - Onboarding flow
  - JP+EN UI support
- Use Supabase and Cloudflare R2 (optional future scaling) per `STORAGE_ARCHITECTURE.md`
- Make all tasks granular, single-concern, and testable

---

## 🔧 Architecture References

- **Frontend**: Next.js / React
- **Backend**: Express.js API
- **Database**: Supabase (Free Tier)
- **Storage**: Supabase Buckets (initially), Cloudflare R2 for future migration
- **Hosting**: Vercel (frontend), Render/Fly.io (backend)

---

## 👤 User Stories (MVP)

1. I can sign up and log in using email or social login.
2. I can record a voice note (post) and share it to the feed.
3. I can browse a Home feed (following) and Explore feed (discover).
4. I can play/pause voice notes and see a waveform UI.
5. I can like posts, comment using voice or text, and follow users.
6. I can see notifications for activity on my content.
7. I can set my profile with a voice bio, photo, and cover.
8. I can post 15s ephemeral stories that autoplay and expire after 24h.
9. I can view and share other users’ profiles via unique URLs.
10. I can switch the app UI between English and Japanese.
11. I can report inappropriate content.
12. I get gamified feedback when I engage (e.g. first post, streaks).
13. I can give feedback to the dev team inside the app.

---

## 🧱 Granular Task List (Build Order)

### Phase 1: Infrastructure & Auth
- [ ] Initialize frontend (Next.js)
- [ ] Initialize backend (Express.js API)
- [ ] Connect Supabase (auth, DB, storage)
- [ ] Configure .env for all secrets (Supabase keys, etc.)
- [ ] Setup Supabase schema: users, voice_notes, comments, notifications
- [ ] Create RLS policies for Supabase tables
- [ ] Setup rate limiter on all backend endpoints
- [ ] Add CAPTCHA to signup/login flow
- [ ] Enable logging (server logs + Vercel analytics)
- [ ] Setup storage helpers (see STORAGE_ARCHITECTURE.md)

### Phase 2: Landing Page + Onboarding
- [ ] Design and deploy a responsive landing page
- [ ] Add CTA (sign up, preview feed)
- [ ] Implement sign-up/login with email + social login
- [ ] Build onboarding flow (mic permission, first post encouragement)
- [ ] Add profile picture and cover upload

### Phase 3: Core Voice Features
- [ ] Implement voice post recorder (limit 60s)
- [ ] Validate audio type and duration
- [ ] Upload to Supabase storage via private bucket
- [ ] Display waveform UI on playback
- [ ] Implement global playback manager (pause on scroll)
- [ ] Add delete post flow
- [ ] Enable voice comment feature (limit 20s)
- [ ] Enable text comment feature
- [ ] Add voice bio upload (max 30s)
- [ ] Add silence trimming on recorded clips
- [ ] Enable content flagging (report feature)

### Phase 4: Feeds & Stories
- [ ] Implement Home Feed (from followed users)
- [ ] Implement Explore Feed (random + trending mix)
- [ ] Implement voice story recorder (limit 15s)
- [ ] Build Story viewer with autoplay
- [ ] Add expiration logic (auto-delete after 24h)

### Phase 5: Interactions & Notifications
- [ ] Add Like feature
- [ ] Implement follow/unfollow system
- [ ] Add in-app notification panel
- [ ] Trigger notifications for likes, follows, comments
- [ ] Add dropdown actions on posts (report, delete, share)
- [ ] Add copy/share buttons for voice posts and profile links

### Phase 6: Localization, Feedback & Gamification
- [ ] Implement i18n setup (EN/JP toggle)
- [ ] Add “First Post” and “Streak” banners
- [ ] Add in-app feedback form (voice or text submission)

### Phase 7: Final Mobile QA & Security
- [ ] Test responsiveness on mobile (iOS/Android)
- [ ] Confirm voice UX and autoplay behavior
- [ ] Validate all backend inputs
- [ ] Enable WAF
- [ ] Run `npm audit fix` and cleanup
- [ ] Log 500s, failed logins, and high traffic events

---

## 🛡 Security Features (MVP)

- ✅ Rate limiting all backend endpoints
- ✅ RLS (Row Level Security) in Supabase
- ✅ CAPTCHA on all auth flows
- ✅ Signed URLs for private audio content
- ✅ WAF + audit logs
- ✅ Minimal dependencies only

---

## 📦 Storage Plan Summary

> Full details in `STORAGE_ARCHITECTURE.md`

- Supabase buckets for profile/cover/voice notes
- Use signed URLs for private access
- Voice notes stored in `voice-memos/[user_id]/[uuid].webm`
- Future migration to Cloudflare R2 when Supabase hits 70% limit

---

## 📍 Notes

- All tasks are atomic and testable
- MVP tasks can be executed one-by-one in Taskmaster AI
- After MVP, focus on Feed Algorithms, Search, and AI features

