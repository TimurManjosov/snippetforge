// test/unit/controllers/snippets.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { type SnippetStats } from '../../../src/modules/snippets';
import { OwnershipGuard } from '../../../src/modules/snippets/guards';
import { SnippetsController } from '../../../src/modules/snippets/snippets.controller';
import { SnippetsRepository } from '../../../src/modules/snippets/snippets.repository';
import { SnippetsService } from '../../../src/modules/snippets/snippets.service';
import { type SafeUser } from '../../../src/modules/users';
import {
  createMockSnippet,
  createMockSnippets,
  createMockSnippetsRepository,
} from '../../mocks';

const mockService = {
  create: jest.fn(),
  listPublicWithQuery: jest.fn(),
  findUserSnippets: jest.fn(),
  findByLanguage: jest.fn(),
  findByIdAndIncrementViews: jest.fn(),
  update: jest.fn(),
  togglePublic: jest.fn(),
  delete: jest.fn(),
  getUserStats: jest.fn(),
};

const mockUser: SafeUser = {
  id: 'user-123',
  email: 'user@example.com',
  username: 'user',
  displayName: null,
  bio: null,
  avatarUrl: null,
  websiteUrl: null,
  role: 'USER',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
};

const mockRepository = createMockSnippetsRepository();

describe('SnippetsController', () => {
  let controller: SnippetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SnippetsController],
      providers: [
        {
          provide: SnippetsService,
          useValue: mockService,
        },
        {
          provide: SnippetsRepository,
          useValue: mockRepository,
        },
        OwnershipGuard,
      ],
    }).compile();

    controller = module.get<SnippetsController>(SnippetsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a snippet for current user', async () => {
    const snippet = createMockSnippet({ userId: mockUser.id });
    mockService.create.mockResolvedValue(snippet);

    const dto = {
      title: snippet.title,
      description: snippet.description ?? undefined,
      code: snippet.code,
      language: snippet.language,
      isPublic: snippet.isPublic,
    };

    const result = await controller.create(mockUser, dto);

    expect(result).toEqual(snippet);
    expect(mockService.create).toHaveBeenCalledWith(mockUser.id, dto);
  });

  it('lists public snippets with pagination defaults', async () => {
    const previews = createMockSnippets(2).map((snippet) => ({
      ...snippet,
      code: undefined,
    }));
    const response = {
      items: previews,
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    } as any;
    mockService.listPublicWithQuery.mockResolvedValue(response);

    const result = await controller.findPublic({
      q: undefined,
      tags: undefined,
      language: undefined,
      sort: 'createdAt',
      order: 'desc',
      page: 1,
      limit: 20,
    });

    expect(result).toEqual(response);
    expect(mockService.listPublicWithQuery).toHaveBeenCalledWith({
      q: undefined,
      tags: undefined,
      language: undefined,
      sort: 'createdAt',
      order: 'desc',
      page: 1,
      limit: 20,
    });
  });

  it('lists current user snippets', async () => {
    const snippets = [createMockSnippet({ userId: mockUser.id })];
    mockService.findUserSnippets.mockResolvedValue(snippets);

    const result = await controller.findMine(mockUser, { limit: 5 });

    expect(result).toEqual(snippets);
    expect(mockService.findUserSnippets).toHaveBeenCalledWith(mockUser.id, 5);
  });

  it('returns snippet previews for a language', async () => {
    const snippets = createMockSnippets(2, { language: 'typescript' });
    mockService.findByLanguage.mockResolvedValue(snippets);

    const result = await controller.findByLanguage('typescript', { limit: 10 });

    expect(result).toHaveLength(2);
    expect(mockService.findByLanguage).toHaveBeenCalledWith('typescript', 10);
  });

  it('returns snippet detail', async () => {
    const snippet = createMockSnippet();
    mockService.findByIdAndIncrementViews.mockResolvedValue(snippet);

    const result = await controller.findById(snippet.id, mockUser);

    expect(result).toEqual(snippet);
    expect(mockService.findByIdAndIncrementViews).toHaveBeenCalledWith(
      snippet.id,
      mockUser.id,
    );
  });

  it('updates a snippet for current user', async () => {
    const snippet = createMockSnippet({ userId: mockUser.id });
    mockService.update.mockResolvedValue(snippet);

    const dto = { title: 'Updated' };
    const request = { snippet } as unknown as Parameters<
      typeof controller.update
    >[3];

    const result = await controller.update(snippet.id, mockUser, dto, request);

    expect(result).toEqual(snippet);
    expect(mockService.update).toHaveBeenCalledWith(
      snippet.id,
      mockUser.id,
      mockUser.role,
      dto,
      snippet,
    );
  });

  it('toggles snippet visibility', async () => {
    const snippet = createMockSnippet({ userId: mockUser.id });
    mockService.togglePublic.mockResolvedValue(snippet);

    const result = await controller.togglePublic(snippet.id, mockUser);

    expect(result).toEqual(snippet);
    expect(mockService.togglePublic).toHaveBeenCalledWith(
      snippet.id,
      mockUser.id,
      mockUser.role,
    );
  });

  it('deletes a snippet', async () => {
    mockService.delete.mockResolvedValue(undefined);

    const snippet = createMockSnippet({ userId: mockUser.id });
    const request = { snippet } as unknown as Parameters<
      typeof controller.delete
    >[2];

    const result = await controller.delete('snippet-id', mockUser, request);

    expect(result).toBeUndefined();
    expect(mockService.delete).toHaveBeenCalledWith(
      'snippet-id',
      mockUser.id,
      mockUser.role,
      snippet,
    );
  });

  it('returns current user stats', async () => {
    const stats: SnippetStats = {
      total: 2,
      public: 1,
      private: 1,
      totalViews: 20,
    };
    mockService.getUserStats.mockResolvedValue(stats);

    const result = await controller.getMyStats(mockUser);

    expect(result).toEqual(stats);
    expect(mockService.getUserStats).toHaveBeenCalledWith(mockUser.id);
  });
});
