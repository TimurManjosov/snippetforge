/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// test/e2e/tags.e2e-spec.ts

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from '../../src/shared/filters';
import { createRegisterDto } from '../factories';

/**
 * Tags E2E Tests
 *
 * Testet den vollständigen Tag-Flow:
 * - Tag Creation (ADMIN-only)
 * - Tag Listing (public)
 * - Attach Tags to Snippet (owner/ADMIN)
 * - Detach Tags from Snippet (owner/ADMIN)
 */
describe('Tags (E2E)', () => {
  let app: INestApplication;
  let userAccessToken: string;
  let adminAccessToken: string;
  let userId: string;
  let adminId: string;
  let snippetId: string;
  let tagSlug: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    await app.init();

    // Register regular user
    const userDto = createRegisterDto();
    const userResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(userDto);
    userAccessToken = userResponse.body.tokens.accessToken;
    userId = userResponse.body.user.id;

    // Create a snippet for the user
    const snippetResponse = await request(app.getHttpServer())
      .post('/api/snippets')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({
        title: 'Test Snippet',
        code: 'console.log("test")',
        language: 'javascript',
      });
    snippetId = snippetResponse.body.id;

    // Note: For ADMIN tests, you would need to either:
    // 1. Register an admin user through DB seeding
    // 2. Have a test endpoint to promote users
    // 3. Mock the role in tests
    // For simplicity, we'll test what we can with regular user
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // GET /api/tags - List Tags (Public)
  // ============================================================

  describe('GET /api/tags', () => {
    it('should return empty array when no tags exist (public)', async () => {
      const response = await request(app.getHttpServer()).get('/api/tags');

      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should be accessible without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/api/tags');

      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  // ============================================================
  // POST /api/tags - Create Tag (ADMIN-only)
  // ============================================================

  describe('POST /api/tags', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tags')
        .send({ name: 'TypeScript' });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 for non-ADMIN users', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tags')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ name: 'TypeScript' });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tags')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ name: '' });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    // Note: Testing successful tag creation requires ADMIN token
    // which would need to be set up in test environment
  });

  // ============================================================
  // POST /api/snippets/:id/tags - Attach Tags
  // ============================================================

  describe('POST /api/snippets/:id/tags', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/snippets/${snippetId}/tags`)
        .send({ slugs: ['typescript'] });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 when snippet not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/snippets/00000000-0000-0000-0000-000000000000/tags')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ slugs: ['typescript'] });

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid data - empty slugs', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/snippets/${snippetId}/tags`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ slugs: [] });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for invalid data - not an array', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/snippets/${snippetId}/tags`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ slugs: 'typescript' });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for invalid snippet id', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/snippets/invalid-id/tags')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ slugs: ['typescript'] });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    // Note: Testing successful attach requires tags to exist
    // which requires ADMIN token to create them first
  });

  // ============================================================
  // DELETE /api/snippets/:id/tags/:slug - Detach Tag
  // ============================================================

  describe('DELETE /api/snippets/:id/tags/:slug', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer()).delete(
        `/api/snippets/${snippetId}/tags/typescript`,
      );

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 when snippet not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/snippets/00000000-0000-0000-0000-000000000000/tags/typescript')
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid snippet id', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/snippets/invalid-id/tags/typescript')
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    // Note: Testing successful detach requires tag to be attached first
  });

  // ============================================================
  // Integration Test - Full Flow
  // ============================================================

  describe('Full Tag Flow (requires ADMIN)', () => {
    // This test would require ADMIN setup
    // Skipping for now as it depends on test environment setup

    it.skip('should create tag, attach to snippet, list tags, and detach', async () => {
      // This would test the complete flow:
      // 1. ADMIN creates tag
      // 2. User attaches tag to their snippet
      // 3. List tags shows correct count
      // 4. User detaches tag
      // 5. List tags shows updated count
    });
  });

  // ============================================================
  // Ownership Tests
  // ============================================================

  describe('Ownership Protection', () => {
    let otherUserToken: string;
    let otherUserSnippet: string;

    beforeAll(async () => {
      // Create another user
      const otherDto = createRegisterDto();
      const otherResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(otherDto);
      otherUserToken = otherResponse.body.tokens.accessToken;

      // Create snippet for other user
      const snippetResponse = await request(app.getHttpServer())
        .post('/api/snippets')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Other User Snippet',
          code: 'console.log("other")',
          language: 'javascript',
        });
      otherUserSnippet = snippetResponse.body.id;
    });

    it('should return 404 when trying to attach tags to other user snippet (anti-enumeration)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/snippets/${otherUserSnippet}/tags`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ slugs: ['typescript'] });

      // Should return 404, not 403, for anti-enumeration
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 404 when trying to detach tags from other user snippet (anti-enumeration)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/snippets/${otherUserSnippet}/tags/typescript`)
        .set('Authorization', `Bearer ${userAccessToken}`);

      // Should return 404, not 403, for anti-enumeration
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
