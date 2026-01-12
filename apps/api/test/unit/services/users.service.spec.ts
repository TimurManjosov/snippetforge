// test/unit/services/users.service.spec.ts

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import { UsersService } from '../../../src/modules/users/users.service';
import { createUserDto } from '../../factories';
import {
  createMockFullUser,
  createMockUsersRepository,
  type MockUsersRepository,
} from '../../mocks';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

/**
 * UsersService Unit Tests
 *
 * Testet:
 * - User CRUD Operationen
 * - Password Hashing
 * - Credential Validation
 * - Error Handling
 */
describe('UsersService', () => {
  let service: UsersService;
  let repository: MockUsersRepository;

  beforeEach(async () => {
    repository = createMockUsersRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // PASSWORD HASHING
  // ============================================================

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      // Arrange
      const password = 'SecurePass123';

      // Act
      const result = await service.hashPassword(password);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe('$2a$10$hashedPassword');
    });
  });

  describe('comparePassword', () => {
    it('should return true when passwords match', async () => {
      // Arrange
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.comparePassword('password', 'hash');

      // Assert
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hash');
    });

    it('should return false when passwords do not match', async () => {
      // Arrange
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await service.comparePassword('wrong', 'hash');

      // Assert
      expect(result).toBe(false);
    });
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const dto = createUserDto();
      const mockCreatedUser = createMockFullUser({
        email: dto.email,
        username: dto.username,
      });

      repository.findByEmailOrUsername.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(repository.findByEmailOrUsername).toHaveBeenCalledWith(
        dto.email,
        dto.username,
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          username: dto.username,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          passwordHash: expect.any(String),
        }),
      );
      expect(result.email).toBe(dto.email);
      expect(result.username).toBe(dto.username);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException when email exists', async () => {
      // Arrange
      const dto = createUserDto();
      const existingUser = createMockFullUser({
        email: dto.email.toLowerCase(),
      });
      repository.findByEmailOrUsername.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        'Email is already registered',
      );
    });

    it('should throw ConflictException when username exists', async () => {
      // Arrange
      const dto = createUserDto();
      const existingUser = createMockFullUser({
        email: 'other@email.com',
        username: dto.username,
      });
      repository.findByEmailOrUsername.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        'Username is already taken',
      );
    });

    it('should hash password before storing', async () => {
      // Arrange
      const dto = createUserDto({ password: 'MyPassword123' });
      repository.findByEmailOrUsername.mockResolvedValue(null);
      repository.create.mockResolvedValue(createMockFullUser());

      // Act
      await service.create(dto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('MyPassword123', 10);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: '$2a$10$hashedPassword',
        }),
      );
    });
  });

  // ============================================================
  // FIND BY ID
  // ============================================================

  describe('findById', () => {
    it('should return SafeUser when found', async () => {
      // Arrange
      const mockUser = createMockFullUser();
      repository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById('test-id');

      // Assert
      expect(repository.findById).toHaveBeenCalledWith('test-id');
      expect(result.id).toBe(mockUser.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // FIND BY EMAIL
  // ============================================================

  describe('findByEmail', () => {
    it('should return SafeUser when found', async () => {
      // Arrange
      const mockUser = createMockFullUser({ email: 'test@test.com' });
      repository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@test.com');

      // Assert
      expect(result.email).toBe('test@test.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when not found', async () => {
      // Arrange
      repository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByEmail('nonexistent@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return FullUser with passwordHash when found', async () => {
      // Arrange
      const mockUser = createMockFullUser();
      repository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmailWithPassword('test@test. com');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.passwordHash).toBeDefined();
    });

    it('should return null when not found', async () => {
      // Arrange
      repository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.findByEmailWithPassword(
        'nonexistent@test.com',
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  // ============================================================
  // VALIDATE CREDENTIALS
  // ============================================================

  describe('validateCredentials', () => {
    it('should return SafeUser when credentials are valid', async () => {
      // Arrange
      const mockUser = createMockFullUser();
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      repository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateCredentials(
        'test@test.com',
        'password',
      );

      // Assert
      expect(result).not.toBeNull();
      expect(result!.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null when user not found', async () => {
      // Arrange
      repository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.validateCredentials(
        'nonexistent@test.com',
        'password',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      // Arrange
      const mockUser = createMockFullUser();
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      repository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateCredentials(
        'test@test.com',
        'wrong',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should perform timing-safe check even when user not found', async () => {
      // Arrange
      repository.findByEmail.mockResolvedValue(null);

      // Act
      await service.validateCredentials('nonexistent@test.com', 'password');

      // Assert
      // comparePassword sollte aufgerufen werden um Timing-Attacks zu verhindern
      expect(bcrypt.compare).toHaveBeenCalled();
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('should update user successfully', async () => {
      // Arrange
      const mockUser = createMockFullUser();
      const updateData = { bio: 'New bio' };
      const updatedUser = { ...mockUser, ...updateData };

      repository.findById.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update('test-id', updateData);

      // Assert
      expect(result.bio).toBe('New bio');
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('nonexistent', { bio: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const mockUser = createMockFullUser();
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      repository.findById.mockResolvedValue(mockUser);
      repository.updatePassword.mockResolvedValue(true);

      // Act
      const result = await service.changePassword(
        'test-id',
        'oldPass',
        'newPass',
      );

      // Assert
      expect(result).toBe(true);
      expect(repository.updatePassword).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changePassword('nonexistent', 'old', 'new'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when current password is wrong', async () => {
      // Arrange
      const mockUser = createMockFullUser();
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      repository.findById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.changePassword('test-id', 'wrongPassword', 'newPass'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============================================================
  // DELETE
  // ============================================================

  describe('delete', () => {
    it('should delete user successfully', async () => {
      // Arrange
      repository.delete.mockResolvedValue(true);

      // Act
      const result = await service.delete('test-id');

      // Assert
      expect(result).toBe(true);
      expect(repository.delete).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      repository.delete.mockResolvedValue(false);

      // Act & Assert
      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
