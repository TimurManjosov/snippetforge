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

describe('Comments (E2E)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let ownerToken: string;
  let foreignToken: string;
  let adminToken: string;
  let publicSnippetId: string;
  let privateSnippetId: string;
  let commentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    await app.init();

    databaseService = app.get(DatabaseService);

    // Register owner
    const ownerDto = createRegisterDto();
    const ownerRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(ownerDto);
    ownerToken = ownerRegister.body.tokens.accessToken;

    // Register foreign user
    const foreignDto = createRegisterDto();
    const foreignRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(foreignDto);
    foreignToken = foreignRegister.body.tokens.accessToken;

    // Register and promote admin
    const adminDto = createRegisterDto();
    const adminRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(adminDto);

    await databaseService.drizzle
      .update(users)
      .set({ role: 'ADMIN' })
      .where(eq(users.id, adminRegister.body.user.id));

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminDto.email, password: adminDto.password });
    adminToken = adminLogin.body.tokens.accessToken;

    // Create public snippet
    const publicSnippetRes = await request(app.getHttpServer())
      .post('/api/snippets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Public Snippet for Comments',
        code: 'console.log("hello")',
        language: 'typescript',
        isPublic: true,
      });
    publicSnippetId = publicSnippetRes.body.id;

    // Create private snippet
    const privateSnippetRes = await request(app.getHttpServer())
      .post('/api/snippets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Private Snippet for Comments',
        code: 'console.log("secret")',
        language: 'typescript',
        isPublic: false,
      });
    privateSnippetId = privateSnippetRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // POST /api/snippets/:id/comments
  // ============================================================

  it('POST /api/snippets/:id/comments - 201 auth + public snippet', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/snippets/${publicSnippetId}/comments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ body: 'First comment!' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.body).toBe('First comment!');
    expect(res.body.id).toBeDefined();
    commentId = res.body.id;
  });

  it('POST /api/snippets/:id/comments - 404 private snippet foreign user', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/snippets/${privateSnippetId}/comments`)
      .set('Authorization', `Bearer ${foreignToken}`)
      .send({ body: 'Should not work' });

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('POST /api/snippets/:id/comments - 401 without auth', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/snippets/${publicSnippetId}/comments`)
      .send({ body: 'No auth' });

    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  // ============================================================
  // GET /api/snippets/:id/comments
  // ============================================================

  it('GET /api/snippets/:id/comments - 200 public snippet', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/snippets/${publicSnippetId}/comments`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items).toBeDefined();
    expect(res.body.meta).toBeDefined();
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    // Only visible (non-deleted) comments
    for (const item of res.body.items) {
      expect(item.deletedAt).toBeNull();
    }
  });

  it('GET /api/snippets/:id/comments - 404 private snippet without auth', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/snippets/${privateSnippetId}/comments`);

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ============================================================
  // GET /api/comments/:commentId
  // ============================================================

  it('GET /api/comments/:commentId - 200 visible comment', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/comments/${commentId}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.id).toBe(commentId);
  });

  // ============================================================
  // PUT /api/comments/:commentId
  // ============================================================

  it('PUT /api/comments/:commentId - owner 200', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ body: 'Updated comment' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.body).toBe('Updated comment');
    expect(res.body.editedAt).not.toBeNull();
  });

  it('PUT /api/comments/:commentId - admin 200', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ body: 'Admin updated comment' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.body).toBe('Admin updated comment');
  });

  it('PUT /api/comments/:commentId - foreign user 404', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${foreignToken}`)
      .send({ body: 'Should fail' });

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ============================================================
  // POST /api/comments/:commentId/flags
  // ============================================================

  it('POST flags - 200; duplicate 200 (idempotent)', async () => {
    const res1 = await request(app.getHttpServer())
      .post(`/api/comments/${commentId}/flags`)
      .set('Authorization', `Bearer ${foreignToken}`)
      .send({ reason: 'spam' });

    expect(res1.status).toBe(HttpStatus.OK);
    expect(res1.body).toEqual({ flagged: true });

    // Duplicate flag - idempotent
    const res2 = await request(app.getHttpServer())
      .post(`/api/comments/${commentId}/flags`)
      .set('Authorization', `Bearer ${foreignToken}`)
      .send({ reason: 'spam' });

    expect(res2.status).toBe(HttpStatus.OK);
    expect(res2.body).toEqual({ flagged: true });
  });

  // ============================================================
  // DELETE /api/comments/:commentId/flags/:reason
  // ============================================================

  it('DELETE flags - 204; not found 204 (idempotent)', async () => {
    const res1 = await request(app.getHttpServer())
      .delete(`/api/comments/${commentId}/flags/spam`)
      .set('Authorization', `Bearer ${foreignToken}`);

    expect(res1.status).toBe(HttpStatus.NO_CONTENT);

    // Already removed - idempotent
    const res2 = await request(app.getHttpServer())
      .delete(`/api/comments/${commentId}/flags/spam`)
      .set('Authorization', `Bearer ${foreignToken}`);

    expect(res2.status).toBe(HttpStatus.NO_CONTENT);
  });

  // ============================================================
  // DELETE /api/comments/:commentId
  // ============================================================

  it('DELETE /api/comments/:commentId - foreign user 404', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${foreignToken}`);

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('DELETE /api/comments/:commentId - owner 204', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(HttpStatus.NO_CONTENT);
  });

  it('DELETE /api/comments/:commentId - idempotent 204', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(HttpStatus.NO_CONTENT);
  });
});
