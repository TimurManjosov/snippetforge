import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from '../../src/shared/filters';
import { createRegisterDto } from '../factories';

describe('Favorites (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let snippetId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    await app.init();

    // Create user and get token
    const ownerDto = createRegisterDto();
    const ownerRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(ownerDto);
    ownerToken = ownerRegister.body.tokens.accessToken;

    // Create a public snippet to favorite
    const snippetResponse = await request(app.getHttpServer())
      .post('/api/snippets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Favoritable Snippet',
        description: 'For favorite tests',
        code: 'console.log("fav")',
        language: 'typescript',
      });
    snippetId = snippetResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/favorites without auth => 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/favorites')
      .send({ snippetId });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/favorites with auth + snippetId => 200', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/favorites')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ snippetId });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual({ ok: true });
  });

  it('POST /api/favorites duplicate => 200 (idempotent)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/favorites')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ snippetId });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual({ ok: true });
  });

  it('GET /api/favorites => returns list with snippet preview', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/favorites')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.items).toBeInstanceOf(Array);
    expect(response.body.items.length).toBeGreaterThanOrEqual(1);
    expect(response.body.meta).toBeDefined();
    expect(response.body.meta.page).toBe(1);

    // Verify preview does not include code
    const preview = response.body.items[0];
    expect(preview).toHaveProperty('id');
    expect(preview).toHaveProperty('title');
    expect(preview).not.toHaveProperty('code');
  });

  it('DELETE /api/favorites/:snippetId => 204', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/favorites/${snippetId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(HttpStatus.NO_CONTENT);
  });

  it('DELETE /api/favorites/:snippetId again => 204 (idempotent)', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/favorites/${snippetId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(HttpStatus.NO_CONTENT);
  });
});
