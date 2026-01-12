/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// test/e2e/health.e2e-spec.ts

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Health E2E Tests
 *
 * Testet die öffentlichen Health-Check Endpoints
 */
describe('Health (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // GET /api
  // ============================================================

  describe('GET /api', () => {
    it('should return welcome message', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/api');

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.text).toBe('Hello World!');
    });

    it('should be accessible without authentication', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/api');

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  // ============================================================
  // GET /api/health
  // ============================================================

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/api/health');

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'snippetforge-api');
      expect(response.body).toHaveProperty('version');
    });

    it('should be accessible without authentication', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/api/health');

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
    });

    it('should return valid ISO timestamp', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/api/health');

      // Assert
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});
