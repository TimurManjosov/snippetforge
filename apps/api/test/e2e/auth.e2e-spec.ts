/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// test/e2e/auth.e2e-spec.ts

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from '../../src/shared/filters';
import { createRegisterDto, invalidAuthData } from '../factories';

/**
 * Auth E2E Tests
 *
 * Testet den vollständigen Auth-Flow:
 * - Registration
 * - Login
 * - Protected Routes
 * - Error Handling
 *
 * HINWEIS: Diese Tests benötigen eine laufende Datenbank!
 * Für CI/CD sollte eine Test-DB verwendet werden.
 */
describe('Auth (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Gleiche Konfiguration wie in main.ts
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  // POST /api/auth/register
  // ============================================================

  describe('POST /api/auth/register', () => {
    describe('with valid data', () => {
      it('should register a new user and return tokens', async () => {
        // Arrange
        const dto = createRegisterDto();

        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(dto);

        // Assert
        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('tokens');
        expect(response.body.user.email).toBe(dto.email);
        expect(response.body.user.username).toBe(dto.username);
        expect(response.body.user).not.toHaveProperty('passwordHash');
        expect(response.body.tokens.accessToken).toBeDefined();
        expect(response.body.tokens.tokenType).toBe('Bearer');
      });

      it('should return user with correct role', async () => {
        // Arrange
        const dto = createRegisterDto();

        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(dto);

        // Assert
        expect(response.body.user.role).toBe('USER');
      });
    });

    describe('with invalid data', () => {
      it('should return 400 for invalid email', async () => {
        // Arrange
        const dto = invalidAuthData.register.invalidEmail;

        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(dto);

        // Assert
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 for weak password', async () => {
        // Arrange
        const dto = invalidAuthData.register.weakPassword;

        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(dto);

        // Assert
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.body.error.details).toBeDefined();
      });

      it('should return 400 for missing fields', async () => {
        // Arrange
        const dto = invalidAuthData.register.missingEmail;

        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(dto);

        // Assert
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      });
    });

    describe('with duplicate data', () => {
      it('should return 409 for duplicate email', async () => {
        // Arrange
        const dto = createRegisterDto();

        // First registration
        await request(app.getHttpServer()).post('/api/auth/register').send(dto);

        // Act - Second registration with same email
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ ...dto, username: 'different_username' });

        // Assert
        expect(response.status).toBe(HttpStatus.CONFLICT);
        expect(response.body.error.code).toBe('USER_EMAIL_EXISTS');
      });

      it('should return 409 for duplicate username', async () => {
        // Arrange
        const dto = createRegisterDto();

        // First registration
        await request(app.getHttpServer()).post('/api/auth/register').send(dto);

        // Act - Second registration with same username
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ ...dto, email: 'different@email.com' });

        // Assert
        expect(response.status).toBe(HttpStatus.CONFLICT);
        expect(response.body.error.code).toBe('USER_USERNAME_EXISTS');
      });
    });
  });

  // ============================================================
  // POST /api/auth/login
  // ============================================================

  describe('POST /api/auth/login', () => {
    let registeredUser: { email: string; password: string };

    beforeAll(async () => {
      // Register a user for login tests
      const dto = createRegisterDto();
      await request(app.getHttpServer()).post('/api/auth/register').send(dto);

      registeredUser = {
        email: dto.email,
        password: dto.password,
      };
    });

    describe('with valid credentials', () => {
      it('should login and return tokens', async () => {
        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send(registeredUser);

        // Assert
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('tokens');
        expect(response.body.tokens.accessToken).toBeDefined();
      });

      it('should return user without passwordHash', async () => {
        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send(registeredUser);

        // Assert
        expect(response.body.user).not.toHaveProperty('passwordHash');
      });
    });

    describe('with invalid credentials', () => {
      it('should return 401 for wrong password', async () => {
        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: registeredUser.email,
            password: 'WrongPassword123',
          });

        // Assert
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
      });

      it('should return 401 for non-existent email', async () => {
        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@email.com',
            password: 'SomePassword123',
          });

        // Assert
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(response.body.error.message).toBe('Invalid email or password');
      });

      it('should return same error message for wrong email and wrong password', async () => {
        // Security: Prevent user enumeration

        // Wrong email
        const wrongEmailResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'wrong@email.com', password: 'Pass123!' });

        // Wrong password
        const wrongPasswordResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: registeredUser.email, password: 'WrongPass123' });

        // Assert - Same message for both
        expect(wrongEmailResponse.body.error.message).toBe(
          wrongPasswordResponse.body.error.message,
        );
      });
    });

    describe('with invalid data', () => {
      it('should return 400 for invalid email format', async () => {
        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send(invalidAuthData.login.invalidEmail);

        // Assert
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      });

      it('should return 400 for missing password', async () => {
        // Act
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send(invalidAuthData.login.missingPassword);

        // Assert
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      });
    });
  });

  // ============================================================
  // GET /api/auth/me
  // ============================================================

  describe('GET /api/auth/me', () => {
    let accessToken: string;
    let userEmail: string;

    beforeAll(async () => {
      // Register and get token
      const dto = createRegisterDto();
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(dto);

      accessToken = response.body.tokens.accessToken;
      userEmail = dto.email;
    });

    describe('with valid token', () => {
      it('should return current user profile', async () => {
        // Act
        const response = await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`);

        // Assert
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.email).toBe(userEmail);
        expect(response.body).not.toHaveProperty('passwordHash');
      });

      it('should return user with all expected fields', async () => {
        // Act
        const response = await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`);

        // Assert
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email');
        expect(response.body).toHaveProperty('username');
        expect(response.body).toHaveProperty('bio');
        expect(response.body).toHaveProperty('avatarUrl');
        expect(response.body).toHaveProperty('role');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
      });
    });

    describe('without token', () => {
      it('should return 401', async () => {
        // Act
        const response = await request(app.getHttpServer()).get('/api/auth/me');

        // Assert
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(response.body.error.code).toBe('AUTH_TOKEN_INVALID');
      });
    });

    describe('with invalid token', () => {
      it('should return 401 for malformed token', async () => {
        // Act
        const response = await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token');

        // Assert
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it('should return 401 for expired token', async () => {
        // Arrange - Create an expired token (this is a simplified example)
        const expiredToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.invalid';

        // Act
        const response = await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${expiredToken}`);

        // Assert
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

      it('should return 401 for wrong authorization scheme', async () => {
        // Act
        const response = await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Basic ${accessToken}`);

        // Assert
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  // ============================================================
  // FULL AUTH FLOW
  // ============================================================

  describe('Full Auth Flow', () => {
    it('should complete register -> login -> me flow', async () => {
      // 1. Register
      const registerDto = createRegisterDto();
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto);

      expect(registerResponse.status).toBe(HttpStatus.CREATED);

      // 2. Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: registerDto.email,
          password: registerDto.password,
        });

      expect(loginResponse.status).toBe(HttpStatus.OK);
      const token = loginResponse.body.tokens.accessToken;

      // 3. Get Profile
      const meResponse = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meResponse.status).toBe(HttpStatus.OK);
      expect(meResponse.body.email).toBe(registerDto.email);
    });
  });
});
