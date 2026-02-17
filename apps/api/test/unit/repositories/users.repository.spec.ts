/* eslint-disable @typescript-eslint/unbound-method */

// test/unit/repositories/users.repository.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import type { NewUser, User } from '../../../src/lib/db/schema';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import { DatabaseService } from '../../../src/shared/database';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mockDbService: Partial<DatabaseService>;

  const mockUser: User = {
    id: 'test-id-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    bio: null,
    avatarUrl: null,
  };

  beforeEach(async () => {
    mockDbService = {
      drizzle: {
        query: {
          users: {
            findFirst: jest.fn(),
          },
        },
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn(),
          }),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn(),
            }),
          }),
        }),
        delete: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn(),
          }),
        }),
        select: jest.fn().mockReturnValue({
          from: jest.fn(),
        }),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      (
        mockDbService.drizzle!.query.users.findFirst as jest.Mock
      ).mockResolvedValue(mockUser);

      const result = await repository.findById('test-id-123');

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (
        mockDbService.drizzle!.query.users.findFirst as jest.Mock
      ).mockResolvedValue(undefined);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      (
        mockDbService.drizzle!.query.users.findFirst as jest.Mock
      ).mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      (
        mockDbService.drizzle!.query.users.findFirst as jest.Mock
      ).mockResolvedValue(undefined);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      (
        mockDbService.drizzle!.query.users.findFirst as jest.Mock
      ).mockResolvedValue(mockUser);

      const result = await repository.findByUsername('testuser');

      expect(result).toEqual(mockUser);
    });

    it('should return null when username not found', async () => {
      (
        mockDbService.drizzle!.query.users.findFirst as jest.Mock
      ).mockResolvedValue(undefined);

      const result = await repository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmailOrUsername', () => {
    it('should find user by email or username', async () => {
      (
        mockDbService.drizzle!.query.users.findFirst as jest.Mock
      ).mockResolvedValue(mockUser);

      const result = await repository.findByEmailOrUsername(
        'test@example.com',
        'testuser',
      );

      expect(result).toEqual(mockUser);
    });

    it('should return null when neither exists', async () => {
      (
        mockDbService.drizzle!.query.users.findFirst as jest.Mock
      ).mockResolvedValue(undefined);

      const result = await repository.findByEmailOrUsername(
        'new@example.com',
        'newuser',
      );

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new user', async () => {
      const newUserData: NewUser = {
        email: 'new@example.com',
        username: 'newuser',
        passwordHash: 'hashed',
        role: 'USER',
      };

      const insertMock = mockDbService.drizzle!.insert as jest.Mock;
      const valuesMock = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockUser]),
      });
      insertMock.mockReturnValue({
        values: valuesMock,
      });

      const result = await repository.create(newUserData);

      expect(result).toEqual(mockUser);
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
        }),
      );
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = { username: 'updateduser' };

      const updateMock = mockDbService.drizzle!.update as jest.Mock;
      const setMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ ...mockUser, ...updateData }]),
        }),
      });
      updateMock.mockReturnValue({
        set: setMock,
      });

      const result = await repository.update('test-id-123', updateData);

      expect(result).toBeDefined();
      expect(result?.username).toBe('updateduser');
    });

    it('should return null when user not found', async () => {
      const updateMock = mockDbService.drizzle!.update as jest.Mock;
      const setMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });
      updateMock.mockReturnValue({
        set: setMock,
      });

      const result = await repository.update('non-existent-id', {
        username: 'test',
      });

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const updateMock = mockDbService.drizzle!.update as jest.Mock;
      const setMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'test-id-123' }]),
        }),
      });
      updateMock.mockReturnValue({
        set: setMock,
      });

      const result = await repository.updatePassword('test-id-123', 'new-hash');

      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      const updateMock = mockDbService.drizzle!.update as jest.Mock;
      const setMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });
      updateMock.mockReturnValue({
        set: setMock,
      });

      const result = await repository.updatePassword(
        'non-existent-id',
        'new-hash',
      );

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const deleteMock = mockDbService.drizzle!.delete as jest.Mock;
      deleteMock.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'test-id-123' }]),
        }),
      });

      const result = await repository.delete('test-id-123');

      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      const deleteMock = mockDbService.drizzle!.delete as jest.Mock;
      deleteMock.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return count of users', async () => {
      const selectMock = mockDbService.drizzle!.select as jest.Mock;
      selectMock.mockReturnValue({
        from: jest
          .fn()
          .mockResolvedValue([
            { count: 'user1' },
            { count: 'user2' },
            { count: 'user3' },
          ]),
      });

      const result = await repository.count();

      expect(result).toBe(3);
    });
  });
});
