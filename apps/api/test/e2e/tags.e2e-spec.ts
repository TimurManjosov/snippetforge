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

describe('Tags (E2E)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let adminToken: string;
  let ownerToken: string;
  let foreignToken: string;
  let snippetId: string;
  let createdTagSlug: string;
  const suffix = Date.now().toString();

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
    const ownerRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(ownerDto);
    ownerToken = ownerRegister.body.tokens.accessToken;

    const foreignDto = createRegisterDto();
    const foreignRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(foreignDto);
    foreignToken = foreignRegister.body.tokens.accessToken;

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

    const snippetResponse = await request(app.getHttpServer())
      .post('/api/snippets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: `Taggable Snippet ${suffix}`,
        description: 'For tag tests',
        code: 'console.log("tagging")',
        language: 'typescript',
      });

    snippetId = snippetResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/tags should require admin role', async () => {
    const noAuth = await request(app.getHttpServer())
      .post('/api/tags')
      .send({ name: `Tag ${suffix}` });
    expect(noAuth.status).toBe(HttpStatus.UNAUTHORIZED);

    const asUser = await request(app.getHttpServer())
      .post('/api/tags')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `Tag ${suffix}` });
    expect(asUser.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('POST /api/tags should create tag and reject duplicate slug', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Tag ${suffix}` });

    expect(createResponse.status).toBe(HttpStatus.CREATED);
    expect(createResponse.body.slug).toBe(`tag-${suffix}`);
    createdTagSlug = createResponse.body.slug;

    const duplicateResponse = await request(app.getHttpServer())
      .post('/api/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Tag ${suffix}` });

    expect(duplicateResponse.status).toBe(HttpStatus.CONFLICT);
  });

  it('GET /api/tags should be public and include snippetCount', async () => {
    const response = await request(app.getHttpServer()).get('/api/tags');
    const tags = response.body as Array<{ slug: string; snippetCount: number }>;

    expect(response.status).toBe(HttpStatus.OK);
    const tag = tags.find((item) => item.slug === createdTagSlug);
    expect(tag).toBeDefined();
    expect(tag?.snippetCount).toEqual(expect.any(Number));
  });

  it('POST /api/snippets/:id/tags should enforce ownership and be idempotent', async () => {
    const forbidden = await request(app.getHttpServer())
      .post(`/api/snippets/${snippetId}/tags`)
      .set('Authorization', `Bearer ${foreignToken}`)
      .send({ tags: [createdTagSlug] });

    expect(forbidden.status).toBe(HttpStatus.NOT_FOUND);

    const firstAttach = await request(app.getHttpServer())
      .post(`/api/snippets/${snippetId}/tags`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ tags: [createdTagSlug] });

    expect(firstAttach.status).toBe(HttpStatus.OK);
    expect(firstAttach.body.attached).toBe(1);

    const secondAttach = await request(app.getHttpServer())
      .post(`/api/snippets/${snippetId}/tags`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ tags: [createdTagSlug] });

    expect(secondAttach.status).toBe(HttpStatus.OK);
    expect(secondAttach.body.attached).toBe(0);
  });

  it('POST /api/snippets/:id/tags should return 404 when no known tags provided', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/snippets/${snippetId}/tags`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ tags: ['this-tag-does-not-exist'] });

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('DELETE /api/snippets/:id/tags/:slug should remove tag relation', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/snippets/${snippetId}/tags/${createdTagSlug}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual({ removed: true });

    const secondDelete = await request(app.getHttpServer())
      .delete(`/api/snippets/${snippetId}/tags/${createdTagSlug}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(secondDelete.status).toBe(HttpStatus.NOT_FOUND);
  });
});
