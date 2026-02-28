import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from '../src/shared/filters';
import { createRegisterDto } from './factories';

describe('/api/settings (E2E)', () => {
  let app: INestApplication;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    await app.init();

    // Create a test user and get token
    const dto = createRegisterDto();
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(dto);

    userToken = registerRes.body.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // GET /api/settings/me
  // ============================================================

  describe('GET /api/settings/me', () => {
    it('401 – without token', async () => {
      await request(app.getHttpServer())
        .get('/api/settings/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('200 – with valid token, returns defaults', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/settings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('defaultSnippetVisibility', false);
      expect(res.body).toHaveProperty('defaultLanguage', null);
      expect(res.body).toHaveProperty('uiTheme', 'system');
      expect(res.body).toHaveProperty('itemsPerPage', 20);
    });
  });

  // ============================================================
  // PUT /api/settings/me
  // ============================================================

  describe('PUT /api/settings/me', () => {
    it('401 – without token', async () => {
      await request(app.getHttpServer())
        .put('/api/settings/me')
        .send({ uiTheme: 'dark' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('200 – partial update: uiTheme only', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/settings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ uiTheme: 'dark' })
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('uiTheme', 'dark');
    });

    it('200 – partial update: defaultSnippetVisibility to true', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/settings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ defaultSnippetVisibility: true })
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('defaultSnippetVisibility', true);
    });

    it('200 – set defaultLanguage to null (clears it)', async () => {
      // First set a language
      await request(app.getHttpServer())
        .put('/api/settings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ defaultLanguage: 'typescript' });

      // Then clear it
      const res = await request(app.getHttpServer())
        .put('/api/settings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ defaultLanguage: null })
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('defaultLanguage', null);
    });

    it('200 – defaultLanguage gets lowercased and trimmed', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/settings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ defaultLanguage: '  TypeScript  ' })
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('defaultLanguage', 'typescript');
    });

    it('400 – itemsPerPage: 9 (below min)', async () => {
      await request(app.getHttpServer())
        .put('/api/settings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ itemsPerPage: 9 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('400 – itemsPerPage: 101 (above max)', async () => {
      await request(app.getHttpServer())
        .put('/api/settings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ itemsPerPage: 101 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('400 – invalid uiTheme value', async () => {
      await request(app.getHttpServer())
        .put('/api/settings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ uiTheme: 'purple' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('200 – empty body is valid (no-op update)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/settings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('defaultSnippetVisibility');
      expect(res.body).toHaveProperty('uiTheme');
      expect(res.body).toHaveProperty('itemsPerPage');
    });
  });
});
