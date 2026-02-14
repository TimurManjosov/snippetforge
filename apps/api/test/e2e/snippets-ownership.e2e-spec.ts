/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// test/e2e/snippets-ownership.e2e-spec.ts

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { snippets, users } from '../../src/lib/db/schema';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from '../../src/shared/filters';
import { DatabaseService } from '../../src/shared/database';
import { createRegisterDto } from '../factories';

describe('Snippets Ownership (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let otherToken: string;
  let adminToken: string;
  let adminUserId: string;
  let snippetId: string;
  let databaseService: DatabaseService;
  const suffix = Date.now().toString();
  let taggedSnippetId: string;
  let singleTagSnippetId: string;
  let pythonSnippetId: string;
  let firstTagSlug: string;
  let secondTagSlug: string;

  const createSnippetPayload = {
    title: 'Owner Snippet',
    description: 'Owned snippet',
    code: 'console.log("owned")',
    language: 'typescript',
    isPublic: true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

    await app.init();
    databaseService = app.get(DatabaseService);

    const ownerDto = createRegisterDto();
    const ownerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(ownerDto);
    ownerToken = ownerResponse.body.tokens.accessToken;

    const otherDto = createRegisterDto();
    const otherResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(otherDto);
    otherToken = otherResponse.body.tokens.accessToken;

    const adminDto = createRegisterDto();
    const adminRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(adminDto);
    adminUserId = adminRegister.body.user.id;

    await databaseService.drizzle
      .update(users)
      .set({ role: 'ADMIN' })
      .where(eq(users.id, adminUserId));
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminDto.email, password: adminDto.password });
    adminToken = adminLogin.body.tokens.accessToken;

    const snippetResponse = await request(app.getHttpServer())
      .post('/api/snippets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(createSnippetPayload);
    snippetId = snippetResponse.body.id;

    const firstTagResponse = await request(app.getHttpServer())
      .post('/api/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `search-tag-${suffix}-one` });
    firstTagSlug =
      firstTagResponse.body.slug ?? `search-tag-${suffix}-one`.toLowerCase();

    const secondTagResponse = await request(app.getHttpServer())
      .post('/api/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `search-tag-${suffix}-two` });
    secondTagSlug =
      secondTagResponse.body.slug ?? `search-tag-${suffix}-two`.toLowerCase();

    const taggedSnippetResponse = await request(app.getHttpServer())
      .post('/api/snippets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: `Search ${suffix} React Node`,
        description: 'React and Node backend snippet',
        code: 'console.log("react node")',
        language: 'typescript',
        isPublic: true,
      });
    taggedSnippetId = taggedSnippetResponse.body.id;

    const singleTagSnippetResponse = await request(app.getHttpServer())
      .post('/api/snippets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: `Search ${suffix} React`,
        description: 'React only snippet',
        code: 'console.log("react")',
        language: 'typescript',
        isPublic: true,
      });
    singleTagSnippetId = singleTagSnippetResponse.body.id;

    const pythonSnippetResponse = await request(app.getHttpServer())
      .post('/api/snippets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: `Search ${suffix} Python`,
        description: 'Python snippet',
        code: 'print("python")',
        language: 'python',
        isPublic: true,
      });
    pythonSnippetId = pythonSnippetResponse.body.id;

    await request(app.getHttpServer())
      .post(`/api/snippets/${taggedSnippetId}/tags`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ tags: [firstTagSlug, secondTagSlug] });
    await request(app.getHttpServer())
      .post(`/api/snippets/${singleTagSnippetId}/tags`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ tags: [firstTagSlug] });

    await databaseService.drizzle
      .update(snippets)
      .set({ viewCount: 30 })
      .where(eq(snippets.id, taggedSnippetId));
    await databaseService.drizzle
      .update(snippets)
      .set({ viewCount: 10 })
      .where(eq(snippets.id, singleTagSnippetId));
    await databaseService.drizzle
      .update(snippets)
      .set({ viewCount: 20 })
      .where(eq(snippets.id, pythonSnippetId));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PUT /api/snippets/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/snippets/${snippetId}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 with foreign token', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should allow owner', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Owner Updated' });

      expect(response.status).toBe(HttpStatus.OK);
    });

    it('should allow admin', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Updated' });

      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  describe('DELETE /api/snippets/:id', () => {
    let deleteSnippetId: string;

    beforeEach(async () => {
      const snippetResponse = await request(app.getHttpServer())
        .post('/api/snippets')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...createSnippetPayload, title: 'Delete target' });
      deleteSnippetId = snippetResponse.body.id;
    });

    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer()).delete(
        `/api/snippets/${deleteSnippetId}`,
      );

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 with foreign token', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/snippets/${deleteSnippetId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should allow owner', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/snippets/${deleteSnippetId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(HttpStatus.NO_CONTENT);
    });

    it('should allow admin', async () => {
      const snippetResponse = await request(app.getHttpServer())
        .post('/api/snippets')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...createSnippetPayload, title: 'Admin delete target' });
      const adminDeleteId = snippetResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/api/snippets/${adminDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.NO_CONTENT);
    });
  });

  describe('GET /api/snippets search and filters', () => {
    it('should return paginated preview items with meta and no code field', async () => {
      const response = await request(app.getHttpServer()).get('/api/snippets');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toEqual(
        expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          totalPages: expect.any(Number),
          hasNextPage: expect.any(Boolean),
          hasPreviousPage: expect.any(Boolean),
        }),
      );
      if (response.body.items.length > 0) {
        expect(response.body.items[0]).not.toHaveProperty('code');
      }
    });

    it('should filter by q, language, tags and normalize sort/page/limit', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/snippets?q=search ${suffix}&language=typescript&tags=${firstTagSlug},${secondTagSlug}&sort=views&order=asc&page=0&limit=999`,
      );

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(100);
      expect(
        response.body.items.some(
          (item: { id: string }) => item.id === taggedSnippetId,
        ),
      ).toBe(true);
      expect(
        response.body.items.some(
          (item: { id: string }) => item.id === singleTagSnippetId,
        ),
      ).toBe(false);
      expect(
        response.body.items.every(
          (item: { language: string }) => item.language === 'typescript',
        ),
      ).toBe(true);
      expect(
        response.body.items.every(
          (
            item: { viewCount: number },
            index: number,
            items: Array<{ viewCount: number }>,
          ) => index === 0 || items[index - 1].viewCount <= item.viewCount,
        ),
      ).toBe(true);
      expect(response.body.items[0]).not.toHaveProperty('code');
    });

    it('should filter by language only', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/snippets')
        .query({ language: 'python', q: `search ${suffix}` });

      expect(response.status).toBe(HttpStatus.OK);
      expect(
        response.body.items.some(
          (item: { id: string }) => item.id === pythonSnippetId,
        ),
      ).toBe(true);
      expect(
        response.body.items.every(
          (item: { language: string }) => item.language === 'python',
        ),
      ).toBe(true);
    });
  });
});
