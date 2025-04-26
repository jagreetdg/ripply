-- Ripply Mock Data Cleanup Script
-- Run this in the Supabase SQL Editor to clean up all mock data while preserving the schema

-- Disable triggers temporarily to avoid foreign key constraint issues during deletion
SET session_replication_role = 'replica';

-- Clear data from all tables in reverse order of dependencies
-- This preserves the table structure but removes all data

-- First, check if tables exist and clear them if they do
DO $$
BEGIN
    -- Clear dependent tables first
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voice_note_shares') THEN
        TRUNCATE TABLE public.voice_note_shares CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voice_note_plays') THEN
        TRUNCATE TABLE public.voice_note_plays CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voice_note_comments') THEN
        TRUNCATE TABLE public.voice_note_comments CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voice_note_likes') THEN
        TRUNCATE TABLE public.voice_note_likes CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voice_note_tags') THEN
        TRUNCATE TABLE public.voice_note_tags CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voice_bios') THEN
        TRUNCATE TABLE public.voice_bios CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
        TRUNCATE TABLE public.follows CASCADE;
    END IF;
    
    -- Then clear the main tables
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'voice_notes') THEN
        TRUNCATE TABLE public.voice_notes CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        TRUNCATE TABLE public.users CASCADE;
    END IF;
END $$;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Add a verification user for testing (optional)
INSERT INTO public.users (
  id, 
  username, 
  display_name, 
  email, 
  bio, 
  avatar_url, 
  cover_photo_url, 
  is_verified, 
  profile_photos, 
  created_at, 
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ripplyadmin',
  'Ripply Admin',
  'admin@ripply.app',
  'Official Ripply admin account',
  'https://ui-avatars.com/api/?name=Ripply+Admin&background=0D8ABC&color=fff',
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1974&auto=format&fit=crop',
  true,
  '[]',
  NOW(),
  NOW()
);

-- Output success message
SELECT 'Mock data cleanup completed successfully. Database is now clean.' as result;
