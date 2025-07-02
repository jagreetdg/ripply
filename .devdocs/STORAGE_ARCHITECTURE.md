# STORAGE_ARCHITECTURE.md

## Overview

This document outlines the media storage architecture for **Ripply**, a voice-note-based social media app. It is designed to be scalable, cost-effective (zero-cost for MVP), and easy to transition to more robust systems later. The storage handles:

- Profile Pictures
- Cover Photos
- Voice Notes (up to 60 seconds)

We currently use **Supabase** and **Cloudflare R2** with plans to scale without vendor lock-in.

---

## Tech Stack

| Component       | Usage                                 | Provider         |
|----------------|----------------------------------------|------------------|
| Supabase        | User data, profile & cover photos, short voice notes | Supabase (Free Tier) |
| Express.js API  | Handles uploads, metadata storage, access control    | Custom Backend     |
| Cloudflare R2   | Long-term voice note storage (future/migration)      | Cloudflare via GitHub Student Pack |

---

## Storage Rules

### 1. Supabase Storage Buckets

- `profile-pictures/`
- `cover-pictures/`
- `voice-memos/`

**Bucket Access:**
- Profile/Cover: `public`
- Voice Memos: `private` (serve via signed URL)

**Naming Convention:**
```
[BUCKET]/[USER_ID]/[UUID].[ext]
```

---

## Upload Flow

### 1. Profile / Cover Images

- Sent as `multipart/form-data`
- Max Size: 2MB
- Stored directly in Supabase Storage
- URL stored in user DB row

### 2. Voice Notes

- Sent as `audio/webm` or `audio/m4a` via frontend blob
- Temporarily stored in Supabase for MVP
- Max Duration: 60 seconds
- Future: Offloaded to Cloudflare R2 when Supabase bandwidth/storage is near limit

---

## Metadata Structure (Supabase DB)

**Table:** `voice_notes`

```sql
id             UUID PRIMARY KEY
user_id        UUID REFERENCES users(id)
file_path      TEXT -- Supabase or R2 path
duration       INTEGER -- in seconds
created_at     TIMESTAMP DEFAULT now()
public         BOOLEAN DEFAULT FALSE
```

---

## Future Plan: Cloudflare R2 Integration

**Use When:**
- Supabase storage limit exceeds 70%
- File size increases (more users, longer recordings)

**R2 Setup:**
- S3-compatible API
- Bucket: `voice-ripply/`
- Use signed URLs to securely upload/download files
- CDN edge-cached for fast delivery

**API Helper Function Signature:**
```ts
async function uploadVoiceNote(userId: string, blob: Blob): Promise<{ url: string }>
```

---

## Helper Function Contracts

LLMs generating code should expose these helpers:

```ts
// Uploads media and returns public or signed URL
uploadProfilePicture(userId: string, file: File): Promise<string>
uploadCoverPhoto(userId: string, file: File): Promise<string>
uploadVoiceNote(userId: string, blob: Blob): Promise<string>

// Returns URL (signed if needed)
getMediaURL(path: string, isPrivate: boolean): Promise<string>
```

---

## Security Considerations

- Voice notes are **private** by default
- Signed URLs expire in 10 mins
- Image uploads are validated for type/size before storing
- R2 and Supabase credentials are stored in `.env` and accessed via backend only

---

## Migration Plan

A `migrateToR2.ts` script (to be created) will:

- Query all voice notes in Supabase > X MB
- Download and reupload them to R2
- Update their file_path in the DB
- Delete old files from Supabase

---

## Final Notes

This architecture balances **free-tier constraints** with **future scalability** and **easy AI integration**. Any LLM or dev tool referencing this architecture should follow modular principles and environment-driven configuration for portability.