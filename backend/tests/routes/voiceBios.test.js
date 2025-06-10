/**
 * Voice Bios Routes Tests
 * Tests all voice bio functionality including CRUD operations
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { TestDatabase } = require('../helpers/testDatabase');

// Mock the dependencies
jest.mock('../../src/config/supabase');
jest.mock('../../src/middleware/auth');

const mockSupabase = require('../../src/config/supabase');
const mockAuth = require('../../src/middleware/auth');

// Setup Express app with voice bios routes
const app = express();
app.use(express.json());
app.use(require('../../src/routes/voiceBios'));

describe('Voice Bios Routes', () => {
  let testDb;
  let mockUser;
  let authToken;

  beforeEach(() => {
    testDb = new TestDatabase();
    jest.clearAllMocks();

    mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      display_name: 'Test User',
    };

    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    authToken = jwt.sign(
      { id: mockUser.id, email: mockUser.email, username: mockUser.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Mock authentication middleware
    mockAuth.authenticateToken.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe('POST /', () => {
    it('should create a new voice bio', async () => {
      const newVoiceBio = {
        audio_url: 'https://example.com/bio.mp3',
        duration: 30,
        transcript: 'Hello, this is my voice bio',
      };

      const createdBio = {
        id: 'bio-123',
        user_id: 'user-123',
        ...newVoiceBio,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock check for existing voice bio (none found)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });

      // Mock insert new voice bio
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: createdBio, error: null }),
          }),
        }),
      });

      const response = await request(app)
        .post('/')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newVoiceBio)
        .expect(201);

      expect(response.body).toEqual(createdBio);
    });

    it('should update existing voice bio instead of creating new one', async () => {
      const voiceBioData = {
        audio_url: 'https://example.com/new-bio.mp3',
        duration: 45,
        transcript: 'Updated voice bio',
      };

      const existingBio = {
        id: 'bio-123',
        user_id: 'user-123',
        audio_url: 'https://example.com/old-bio.mp3',
        duration: 30,
        transcript: 'Old voice bio',
      };

      const updatedBio = {
        ...existingBio,
        ...voiceBioData,
        updated_at: new Date().toISOString(),
      };

      // Mock check for existing voice bio (found)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingBio, error: null }),
          }),
        }),
      });

      // Mock update existing voice bio
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updatedBio, error: null }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .post('/')
        .set('Authorization', `Bearer ${authToken}`)
        .send(voiceBioData)
        .expect(200);

      expect(response.body).toEqual(updatedBio);
    });

    it('should reject voice bio creation without required fields', async () => {
      const incompleteData = {
        duration: 30,
        // Missing audio_url
      };

      const response = await request(app)
        .post('/')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject unauthenticated request', async () => {
      mockAuth.authenticateToken.mockImplementation((req, res, next) => {
        res.status(401).json({ message: 'Authentication required' });
      });

      const voiceBioData = {
        audio_url: 'https://example.com/bio.mp3',
        duration: 30,
        transcript: 'Voice bio',
      };

      const response = await request(app)
        .post('/')
        .send(voiceBioData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authentication required');
    });
  });

  describe('GET /:userId', () => {
    it('should get voice bio for user', async () => {
      const voiceBio = {
        id: 'bio-123',
        user_id: 'user-456',
        audio_url: 'https://example.com/bio.mp3',
        duration: 30,
        transcript: 'Voice bio content',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: voiceBio, error: null }),
          }),
        }),
      });

      const response = await request(app)
        .get('/user-456')
        .expect(200);

      expect(response.body).toEqual(voiceBio);
    });

    it('should return 404 when user has no voice bio', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });

      const response = await request(app)
        .get('/user-456')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Voice bio not found');
    });
  });

  describe('PUT /:id', () => {
    it('should update voice bio by owner', async () => {
      const updateData = {
        audio_url: 'https://example.com/updated-bio.mp3',
        duration: 60,
        transcript: 'Updated voice bio content',
      };

      const existingBio = {
        id: 'bio-123',
        user_id: 'user-123',
        audio_url: 'https://example.com/old-bio.mp3',
        duration: 30,
        transcript: 'Old content',
      };

      const updatedBio = {
        ...existingBio,
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      // Mock ownership check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingBio, error: null }),
          }),
        }),
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updatedBio, error: null }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .put('/bio-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedBio);
    });

    it('should reject update by non-owner', async () => {
      const updateData = {
        audio_url: 'https://example.com/hacker-bio.mp3',
        duration: 60,
        transcript: 'Hacker content',
      };

      const existingBio = {
        id: 'bio-123',
        user_id: 'different-user',
        audio_url: 'https://example.com/bio.mp3',
        duration: 30,
        transcript: 'Original content',
      };

      // Mock ownership check - different user
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingBio, error: null }),
          }),
        }),
      });

      const response = await request(app)
        .put('/bio-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Not authorized to update this voice bio');
    });

    it('should return 404 for non-existent voice bio', async () => {
      const updateData = {
        audio_url: 'https://example.com/bio.mp3',
        duration: 30,
        transcript: 'Content',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });

      const response = await request(app)
        .put('/non-existent-bio')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Voice bio not found');
    });
  });

  describe('DELETE /:id', () => {
    it('should delete voice bio by owner', async () => {
      const existingBio = {
        id: 'bio-123',
        user_id: 'user-123',
        audio_url: 'https://example.com/bio.mp3',
      };

      // Mock ownership check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingBio, error: null }),
          }),
        }),
      });

      // Mock delete
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const response = await request(app)
        .delete('/bio-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Voice bio deleted successfully');
    });

    it('should reject delete by non-owner', async () => {
      const existingBio = {
        id: 'bio-123',
        user_id: 'different-user',
        audio_url: 'https://example.com/bio.mp3',
      };

      // Mock ownership check - different user
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingBio, error: null }),
          }),
        }),
      });

      const response = await request(app)
        .delete('/bio-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Not authorized to delete this voice bio');
    });

    it('should return 404 for non-existent voice bio', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });

      const response = await request(app)
        .delete('/non-existent-bio')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Voice bio not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      });

      const response = await request(app)
        .get('/user-456')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Server error');
    });

    it('should validate audio_url format', async () => {
      const invalidData = {
        audio_url: 'not-a-valid-url',
        duration: 30,
        transcript: 'Voice bio',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });

      const response = await request(app)
        .post('/')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('Invalid audio URL format');
    });

    it('should validate duration is positive number', async () => {
      const invalidData = {
        audio_url: 'https://example.com/bio.mp3',
        duration: -5, // Invalid negative duration
        transcript: 'Voice bio',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });

      const response = await request(app)
        .post('/')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('Duration must be a positive number');
    });

    it('should limit transcript length', async () => {
      const invalidData = {
        audio_url: 'https://example.com/bio.mp3',
        duration: 30,
        transcript: 'A'.repeat(1001), // Too long transcript
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });

      const response = await request(app)
        .post('/')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('Transcript must be 1000 characters or less');
    });
  });
}); 