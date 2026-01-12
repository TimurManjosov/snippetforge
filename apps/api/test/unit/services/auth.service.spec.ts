// test/unit/services/auth.service.spec. ts

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { UsersService } from '../../../src/modules/users/users.service';
import { createLoginDto, createRegisterDto } from '../../factories';
import {
  createMockJwtService,
  createMockSafeUser,
  createMockUsersService,
  type MockJwtService,
  type MockUsersService,
} from '../../mocks';

/**
 * AuthService Unit Tests
 *
 * Testet:
 * - Registration
 * - Login
 * - Token Generation
 * - Error Handling
 */
describe('AuthService', () => {
  let service: AuthService;
  let usersService: MockUsersService;
  let jwtService: MockJwtService;

  beforeEach(async () => {
    usersService = createMockUsersService();
    jwtService = createMockJwtService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRES_IN: '15m',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // REGISTER
  // ============================================================

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      // Arrange
      const dto = createRegisterDto();
      const mockUser = createMockSafeUser({
        email: dto.email,
        username: dto.username,
      });
      usersService.create.mockResolvedValue(mockUser);

      // Act
      const result = await service.register(dto);

      // Assert
      expect(usersService.create).toHaveBeenCalledWith({
        email: dto.email,
        username: dto.username,
        password: dto.password,
      });
      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.tokenType).toBe('Bearer');
    });

    it('should generate JWT with correct payload', async () => {
      // Arrange
      const dto = createRegisterDto();
      const mockUser = createMockSafeUser({
        id: 'user-123',
        email: dto.email,
        role: 'USER',
      });
      usersService.create.mockResolvedValue(mockUser);

      // Act
      await service.register(dto);

      // Assert
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          email: dto.email,
          role: 'USER',
        }),
      );
    });

    it('should propagate ConflictException from UsersService', async () => {
      // Arrange
      const dto = createRegisterDto();
      usersService.create.mockRejectedValue(
        new Error('Email is already registered'),
      );

      // Act & Assert
      await expect(service.register(dto)).rejects.toThrow();
    });
  });

  // ============================================================
  // LOGIN
  // ============================================================

  describe('login', () => {
    it('should login user and return tokens', async () => {
      // Arrange
      const dto = createLoginDto();
      const mockUser = createMockSafeUser({ email: dto.email });
      usersService.validateCredentials.mockResolvedValue(mockUser);

      // Act
      const result = await service.login(dto);

      // Assert
      expect(usersService.validateCredentials).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(result.user).toEqual(mockUser);
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      // Arrange
      const dto = createLoginDto();
      usersService.validateCredentials.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should generate JWT with correct payload on login', async () => {
      // Arrange
      const dto = createLoginDto();
      const mockUser = createMockSafeUser({
        id: 'user-456',
        email: dto.email,
        role: 'ADMIN',
      });
      usersService.validateCredentials.mockResolvedValue(mockUser);

      // Act
      await service.login(dto);

      // Assert
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-456',
          email: dto.email,
          role: 'ADMIN',
        }),
      );
    });
  });

  // ============================================================
  // TOKEN GENERATION
  // ============================================================

  describe('token generation', () => {
    it('should include expiresIn in token response', async () => {
      // Arrange
      const dto = createRegisterDto();
      usersService.create.mockResolvedValue(createMockSafeUser());

      // Act
      const result = await service.register(dto);

      // Assert
      expect(result.tokens.expiresIn).toBeDefined();
      expect(typeof result.tokens.expiresIn).toBe('number');
    });

    it('should set tokenType to Bearer', async () => {
      // Arrange
      const dto = createLoginDto();
      usersService.validateCredentials.mockResolvedValue(createMockSafeUser());

      // Act
      const result = await service.login(dto);

      // Assert
      expect(result.tokens.tokenType).toBe('Bearer');
    });
  });

  // ============================================================
  // VALIDATE USER BY ID
  // ============================================================

  describe('validateUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = createMockSafeUser();
      usersService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUserById('user-123');

      // Assert
      expect(usersService.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);
    });

    it('should propagate NotFoundException from UsersService', async () => {
      // Arrange
      usersService.findById.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(service.validateUserById('nonexistent')).rejects.toThrow();
    });
  });

  // ============================================================
  // GET CURRENT USER
  // ============================================================

  describe('getCurrentUser', () => {
    it('should return user by id', async () => {
      // Arrange
      const mockUser = createMockSafeUser({ id: 'current-user-id' });
      usersService.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.getCurrentUser('current-user-id');

      // Assert
      expect(result).toEqual(mockUser);
    });
  });
});
