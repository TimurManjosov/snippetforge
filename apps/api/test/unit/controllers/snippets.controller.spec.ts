// test/unit/controllers/snippets.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { SnippetsController } from '../../../src/modules/snippets/snippets.controller';
import { SnippetsService } from '../../../src/modules/snippets/snippets.service';
import { createMockSnippet, createMockSnippets } from '../../mocks';
import { type SnippetStats } from '../../../src/modules/snippets';
import { type SafeUser } from '../../../src/modules/users';

const mockService = {
  create: jest.fn(),
  findPublicPreviews: jest.fn(),
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
  bio: null,
  avatarUrl: null,
  role: 'USER',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
};

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
    const response = { data: previews, meta: { page: 1, limit: 20 } } as any;
    mockService.findPublicPreviews.mockResolvedValue(response);

    const result = await controller.findPublic({});

    expect(result).toEqual(response);
    expect(mockService.findPublicPreviews).toHaveBeenCalledWith(1, 20);
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

    const result = await controller.update(snippet.id, mockUser, dto);

    expect(result).toEqual(snippet);
    expect(mockService.update).toHaveBeenCalledWith(
      snippet.id,
      mockUser.id,
      mockUser.role,
      dto,
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

    const result = await controller.delete('snippet-id', mockUser);

    expect(result).toEqual({ message: 'Snippet deleted successfully' });
    expect(mockService.delete).toHaveBeenCalledWith(
      'snippet-id',
      mockUser.id,
      mockUser.role,
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
