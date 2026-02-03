/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// test/e2e/snippets-ownership.e2e-spec.ts

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { users } from '../../src/lib/db/schema';
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
});
