// test/unit/strategies/jwt.strategy.spec.ts

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { JwtPayload } from '../../../src/modules/auth/auth.types';
import { JwtStrategy } from '../../../src/modules/auth/strategies/jwt.strategy';
import type { SafeUser } from '../../../src/modules/users';
import { UsersService } from '../../../src/modules/users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockUsersService: Partial<UsersService>;
  let mockConfigService: Partial<ConfigService>;

  const mockUser: SafeUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    bio: null,
    avatarUrl: null,
  };

  beforeEach(async () => {
    mockUsersService = {
      findById: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('should return user when found', async () => {
      const payload: JwtPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        role: 'USER',
      };

      (mockUsersService.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith('test-user-id');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload: JwtPayload = {
        sub: 'non-existent-id',
        email: 'test@example.com',
        role: 'USER',
      };

      (mockUsersService.findById as jest.Mock).mockRejectedValue(
        new Error('User not found'),
      );

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found or has been deleted',
      );
    });
  });
});
