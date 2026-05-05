import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from '../../src/shared/filters';
import { createRegisterDto, createUpdateProfileDto } from '../factories';

describe('Users (E2E)', () => {
  let app: INestApplication;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    await app.init();

    // Create user and get token
    const dto = createRegisterDto();
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(dto);
    userToken = registerRes.body.tokens.accessToken;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // GET /api/users/:id (public profile)
  // ============================================================

  describe('GET /api/users/:id', () => {
    it('200 – returns public fields', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('createdAt');
      // Profile fields should exist (nullable)
      expect(res.body).toHaveProperty('displayName');
      expect(res.body).toHaveProperty('bio');
      expect(res.body).toHaveProperty('avatarUrl');
      expect(res.body).toHaveProperty('websiteUrl');
    });

    it('200 – does NOT contain email, password, or passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .expect(HttpStatus.OK);

      expect(res.body).not.toHaveProperty('email');
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('404 – for non-existing UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('404 – for invalid UUID format', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/users/not-a-uuid',
      );

      // Could be 400 or 404 depending on validation pipes
      expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
        res.status,
      );
    });
  });

  // ============================================================
  // GET /api/users/:id/stats
  // ============================================================

  describe('GET /api/users/:id/stats', () => {
    it('200 – returns stats with correct shape', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${userId}/stats`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('userId', userId);
      expect(res.body).toHaveProperty('publicSnippetCount');
      expect(res.body).toHaveProperty('commentCount');
      expect(res.body).toHaveProperty('reactionGivenCount');
    });

    it('200 – all counts are numbers, not strings', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${userId}/stats`)
        .expect(HttpStatus.OK);

      expect(typeof res.body.publicSnippetCount).toBe('number');
      expect(typeof res.body.commentCount).toBe('number');
      expect(typeof res.body.reactionGivenCount).toBe('number');
    });

    it('404 – for non-existing user', async () => {
      await request(app.getHttpServer())
        .get('/api/users/00000000-0000-0000-0000-000000000000/stats')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // ============================================================
  // PUT /api/users/me
  // ============================================================

  describe('PUT /api/users/me', () => {
    it('401 – without Authorization header', async () => {
      await request(app.getHttpServer())
        .put('/api/users/me')
        .send(createUpdateProfileDto())
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('401 – with invalid token', async () => {
      await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .send(createUpdateProfileDto())
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('200 – updates all profile fields', async () => {
      const payload = createUpdateProfileDto();
      const res = await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('id', userId);
      expect(res.body.displayName).toBe(payload.displayName);
      expect(res.body.bio).toBe(payload.bio);
      expect(res.body.avatarUrl).toBe(payload.avatarUrl);
      expect(res.body.websiteUrl).toBe(payload.websiteUrl);
    });

    it('200 – partial update leaves other fields unchanged', async () => {
      // First set all fields
      const initial = createUpdateProfileDto({ displayName: 'Initial Name', bio: 'Initial bio' });
      await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send(initial)
        .expect(HttpStatus.OK);

      // Update only bio — displayName must stay
      const res = await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bio: 'New bio only' })
        .expect(HttpStatus.OK);

      expect(res.body.bio).toBe('New bio only');
      expect(res.body.displayName).toBe('Initial Name');
    });

    it('200 – clears a field when null is sent', async () => {
      await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ displayName: 'Has Name' })
        .expect(HttpStatus.OK);

      const res = await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ displayName: null })
        .expect(HttpStatus.OK);

      expect(res.body.displayName).toBeNull();
    });

    it('400 – rejects displayName longer than 80 chars', async () => {
      await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ displayName: 'a'.repeat(81) })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('400 – rejects bio longer than 500 chars', async () => {
      await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bio: 'b'.repeat(501) })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('400 – rejects unknown fields (strict schema)', async () => {
      await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ unknownField: 'hacking attempt' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('200 – response does NOT contain passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bio: 'Safe bio' })
        .expect(HttpStatus.OK);

      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('password');
    });
  });

  // ============================================================
  // GET /api/users/me
  // ============================================================

  describe('GET /api/users/me', () => {
    it('401 – without Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/users/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('401 – with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('200 – with valid JWT returns email + public fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('displayName');
      expect(res.body).toHaveProperty('bio');
      expect(res.body).toHaveProperty('avatarUrl');
      expect(res.body).toHaveProperty('websiteUrl');
      expect(res.body).toHaveProperty('createdAt');
    });

    it('200 – does NOT contain password or passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });
});
