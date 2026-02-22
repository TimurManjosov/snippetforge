import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from '../../src/shared/filters';
import { createRegisterDto } from '../factories';

describe('Collections (E2E)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let foreignToken: string;
  let snippetId: string;
  let collectionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    await app.init();

    // Create owner user
    const ownerDto = createRegisterDto();
    const ownerRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(ownerDto);
    ownerToken = ownerRegister.body.tokens.accessToken;

    // Create foreign user
    const foreignDto = createRegisterDto();
    const foreignRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(foreignDto);
    foreignToken = foreignRegister.body.tokens.accessToken;

    // Create a public snippet
    const snippetResponse = await request(app.getHttpServer())
      .post('/api/snippets')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Collection Snippet',
        description: 'For collection tests',
        code: 'console.log("collect")',
        language: 'typescript',
      });
    snippetId = snippetResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/collections => 201 Created', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/collections')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'My Collection', description: 'Test', isPublic: false });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body.name).toBe('My Collection');
    collectionId = response.body.id;
  });

  it('POST /api/collections/:id/items => 200 (add item)', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/collections/${collectionId}/items`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ snippetId });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.ok).toBe(true);
    expect(response.body.position).toBeDefined();
  });

  it('GET /api/collections/:id as other user => 404 (private)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/collections/${collectionId}`)
      .set('Authorization', `Bearer ${foreignToken}`);

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('PUT /api/collections/:id toggle isPublic => 200', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/collections/${collectionId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isPublic: true });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.isPublic).toBe(true);
  });

  it('GET /api/collections/:id as other user now => 200 (public)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/collections/${collectionId}`)
      .set('Authorization', `Bearer ${foreignToken}`);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.collection).toBeDefined();
    expect(response.body.items).toBeInstanceOf(Array);
    expect(response.body.meta).toBeDefined();
  });

  it('DELETE /api/collections/:id => 204 and cascade', async () => {
    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/collections/${collectionId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(deleteResponse.status).toBe(HttpStatus.NO_CONTENT);

    // After delete, GET should 404
    const getResponse = await request(app.getHttpServer())
      .get(`/api/collections/${collectionId}`);

    expect(getResponse.status).toBe(HttpStatus.NOT_FOUND);
  });
});
