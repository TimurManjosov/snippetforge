import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from '../../src/shared/filters';
import { createRegisterDto } from '../factories';

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
