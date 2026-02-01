/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// test/e2e/snippets.e2e-spec.ts

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
 * Snippets E2E Tests
 *
 * Tests the complete snippets CRUD flow:
 * - Create snippet
 * - List snippets
 * - Get snippet by ID
 * - Update snippet
 * - Delete snippet
 * - Access control (public/private)
 *
 * NOTE: These tests require a running database!
 */
describe('Snippets (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;
  let snippetId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Same configuration as in main.ts
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

    await app.init();

    // Register a test user and get token
    const registerDto = createRegisterDto();
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerDto);

    accessToken = registerResponse.body.tokens.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // POST /api/snippets
  // ============================================================

  describe('POST /api/snippets', () => {
    describe('with valid data', () => {
      it('should create a new snippet and return it', async () => {
        // Arrange
        const dto = {
          title: 'Test Snippet',
          description: 'A test snippet',
          code: 'console.log("Hello World");',
          language: 'javascript',
          isPublic: true,
        };

        // Act
        const response = await request(app.getHttpServer())
          .post('/api/snippets')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(dto);

        // Assert
        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(dto.title);
        expect(response.body.code).toBe(dto.code);
        expect(response.body.language).toBe(dto.language);
        expect(response.body.isPublic).toBe(true);
        expect(response.body.userId).toBe(userId);

        // Save snippet ID for other tests
        snippetId = response.body.id;
      });

      it('should create a private snippet when isPublic is false', async () => {
        // Arrange
        const dto = {
          title: 'Private Snippet',
          code: 'const secret = "hidden";',
          language: 'javascript',
          isPublic: false,
        };

        // Act
        const response = await request(app.getHttpServer())
          .post('/api/snippets')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(dto);

        // Assert
        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body.isPublic).toBe(false);
      });
    });

    describe('with invalid data', () => {
      it('should return 400 for missing required fields', async () => {
        // Arrange
        const dto = {
          title: 'Incomplete',
          // Missing code and language
        };

        // Act
        const response = await request(app.getHttpServer())
          .post('/api/snippets')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(dto);

        // Assert
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      });

      it('should return 401 when not authenticated', async () => {
        // Arrange
        const dto = {
          title: 'Test',
          code: 'test',
          language: 'javascript',
        };

        // Act
        const response = await request(app.getHttpServer())
          .post('/api/snippets')
          .send(dto);

        // Assert
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  // ============================================================
  // GET /api/snippets
  // ============================================================

  describe('GET /api/snippets', () => {
    it('should return paginated public snippets', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/api/snippets');

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should respect pagination parameters', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/api/snippets')
        .query({ page: 1, limit: 5 });

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  // ============================================================
  // GET /api/snippets/previews
  // ============================================================

  describe('GET /api/snippets/previews', () => {
    it('should return snippet previews without code', async () => {
      // Act
      const response = await request(app.getHttpServer()).get(
        '/api/snippets/previews',
      );

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('data');
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).not.toHaveProperty('code');
      }
    });
  });

  // ============================================================
  // GET /api/snippets/my
  // ============================================================

  describe('GET /api/snippets/my', () => {
    it('should return current user snippets', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/api/snippets/my')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body)).toBe(true);
      // Should have at least the snippets we created
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app.getHttpServer()).get(
        '/api/snippets/my',
      );

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  // ============================================================
  // GET /api/snippets/stats
  // ============================================================

  describe('GET /api/snippets/stats', () => {
    it('should return user snippet statistics', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/api/snippets/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('publicCount');
      expect(response.body).toHaveProperty('privateCount');
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app.getHttpServer()).get(
        '/api/snippets/stats',
      );

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  // ============================================================
  // GET /api/snippets/:id
  // ============================================================

  describe('GET /api/snippets/:id', () => {
    it('should return snippet by ID', async () => {
      // Act
      const response = await request(app.getHttpServer()).get(
        `/api/snippets/${snippetId}`,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.id).toBe(snippetId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 404 for non-existent snippet', async () => {
      // Act
      const response = await request(app.getHttpServer()).get(
        '/api/snippets/00000000-0000-0000-0000-000000000000',
      );

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  // ============================================================
  // GET /api/snippets/:id/view
  // ============================================================

  describe('GET /api/snippets/:id/view', () => {
    it('should return snippet and increment view count', async () => {
      // Act
      const response = await request(app.getHttpServer()).get(
        `/api/snippets/${snippetId}/view`,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.id).toBe(snippetId);
    });
  });

  // ============================================================
  // PATCH /api/snippets/:id
  // ============================================================

  describe('PATCH /api/snippets/:id', () => {
    it('should update snippet title', async () => {
      // Arrange
      const updateDto = {
        title: 'Updated Title',
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/api/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.title).toBe(updateDto.title);
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      const updateDto = { title: 'New Title' };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/api/snippets/${snippetId}`)
        .send(updateDto);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent snippet', async () => {
      // Arrange
      const updateDto = { title: 'New Title' };

      // Act
      const response = await request(app.getHttpServer())
        .patch('/api/snippets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  // ============================================================
  // PATCH /api/snippets/:id/toggle
  // ============================================================

  describe('PATCH /api/snippets/:id/toggle', () => {
    it('should toggle snippet public status', async () => {
      // Get current status
      const getResponse = await request(app.getHttpServer()).get(
        `/api/snippets/${snippetId}`,
      );
      const currentStatus = getResponse.body.isPublic;

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/api/snippets/${snippetId}/toggle`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.isPublic).toBe(!currentStatus);
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app.getHttpServer()).patch(
        `/api/snippets/${snippetId}/toggle`,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  // ============================================================
  // DELETE /api/snippets/:id
  // ============================================================

  describe('DELETE /api/snippets/:id', () => {
    it('should delete snippet', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .delete(`/api/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.NO_CONTENT);

      // Verify snippet is deleted
      const getResponse = await request(app.getHttpServer()).get(
        `/api/snippets/${snippetId}`,
      );
      expect(getResponse.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 401 when not authenticated', async () => {
      // Create a snippet to delete
      const createResponse = await request(app.getHttpServer())
        .post('/api/snippets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'To Delete',
          code: 'test',
          language: 'javascript',
        });

      const newSnippetId = createResponse.body.id;

      // Act
      const response = await request(app.getHttpServer()).delete(
        `/api/snippets/${newSnippetId}`,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent snippet', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .delete('/api/snippets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
