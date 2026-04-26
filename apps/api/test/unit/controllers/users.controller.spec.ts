import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../src/modules/users/users.controller';
import { UsersService } from '../../../src/modules/users/users.service';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import {
  createMockUsersService,
  createMockUsersRepository,
} from '../../mocks/users.mock';

describe('UsersController', () => {
  let controller: UsersController;
  let mockService: ReturnType<typeof createMockUsersService>;
  let mockRepository: ReturnType<typeof createMockUsersRepository>;

  beforeEach(async () => {
    mockService = createMockUsersService();
    mockRepository = createMockUsersRepository();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockService },
        { provide: UsersRepository, useValue: mockRepository },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('GET /users (listUsers)', () => {
    const mockListResult = {
      items: [
        {
          id: 'user-1',
          username: 'alice',
          displayName: 'Alice Smith',
          avatarUrl: null,
          createdAt: '2025-01-01T00:00:00Z',
          publicSnippetCount: 5,
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

    it('delegates to repository.listUsers with parsed query', async () => {
      mockRepository.listUsers.mockResolvedValue(mockListResult);

      const query = {
        page: 1,
        limit: 20,
        sort: 'createdAt' as const,
        order: 'desc' as const,
      };
      const result = await controller.listUsers(query);

      expect(mockRepository.listUsers).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockListResult);
    });

    it('returns items with publicSnippetCount', async () => {
      mockRepository.listUsers.mockResolvedValue(mockListResult);

      const result = await controller.listUsers({
        page: 1,
        limit: 20,
        sort: 'createdAt' as const,
        order: 'desc' as const,
      });
      expect(result.items[0]).toHaveProperty('publicSnippetCount', 5);
    });

    it('passes q parameter for search', async () => {
      mockRepository.listUsers.mockResolvedValue({
        items: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const query = {
        q: 'alice',
        page: 1,
        limit: 20,
        sort: 'createdAt' as const,
        order: 'desc' as const,
      };
      await controller.listUsers(query);

      expect(mockRepository.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'alice' }),
      );
    });
  });
});
