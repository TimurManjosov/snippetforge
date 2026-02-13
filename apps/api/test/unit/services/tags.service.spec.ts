import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TagsRepository } from '../../../src/modules/tags/tags.repository';
import { TagsService } from '../../../src/modules/tags/tags.service';
import {
  createMockTag,
  createMockTagWithSnippetCount,
  createMockTagsRepository,
  type MockTagsRepository,
} from '../../mocks/tags.mock';

describe('TagsService', () => {
  let service: TagsService;
  let repository: MockTagsRepository;

  beforeEach(async () => {
    repository = createMockTagsRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: TagsRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates tag with normalized slug', async () => {
      const createdTag = createMockTag({ slug: 'backend-api' });
      repository.create.mockResolvedValue(createdTag);

      const result = await service.create({ name: 'Backend API' });

      expect(result).toEqual(createdTag);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Backend API',
        slug: 'backend-api',
      });
    });

    it('throws conflict for duplicate slug violations', async () => {
      repository.create.mockRejectedValue({ code: '23505' });

      await expect(service.create({ name: 'TypeScript' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('returns tags with snippet counts', async () => {
      const tags = [
        createMockTagWithSnippetCount({ slug: 'backend', snippetCount: 2 }),
      ];
      repository.findAllWithSnippetCount.mockResolvedValue(tags);

      await expect(service.findAll()).resolves.toEqual(tags);
    });
  });

  describe('attachToSnippet', () => {
    it('attaches only existing tags and returns summary', async () => {
      repository.findBySlugs.mockResolvedValue([
        createMockTag({ id: 'tag-1', slug: 'typescript' }),
      ]);
      repository.attachTagsToSnippet.mockResolvedValue(1);

      const result = await service.attachToSnippet('snippet-1', [
        'TypeScript',
        'missing-tag',
      ]);

      expect(repository.findBySlugs).toHaveBeenCalledWith([
        'typescript',
        'missing-tag',
      ]);
      expect(result).toEqual({
        attached: 1,
        totalRequested: 2,
        resolvedTags: ['typescript'],
      });
    });

    it('throws not found if no valid tags resolve', async () => {
      repository.findBySlugs.mockResolvedValue([]);

      await expect(
        service.attachToSnippet('snippet-1', ['not-existing']),
      ).rejects.toThrow(NotFoundException);
    });

    it('deduplicates normalized tags before attach', async () => {
      repository.findBySlugs.mockResolvedValue([
        createMockTag({ id: 'tag-1', slug: 'typescript' }),
      ]);
      repository.attachTagsToSnippet.mockResolvedValue(0);

      await service.attachToSnippet('snippet-1', ['TypeScript', 'typescript']);

      expect(repository.findBySlugs).toHaveBeenCalledWith(['typescript']);
    });
  });

  describe('removeFromSnippet', () => {
    it('removes an existing relation', async () => {
      repository.findBySlug.mockResolvedValue(createMockTag({ id: 'tag-1' }));
      repository.removeTagFromSnippet.mockResolvedValue(true);

      await expect(
        service.removeFromSnippet('snippet-1', 'TypeScript'),
      ).resolves.toEqual({ removed: true });
    });

    it('throws not found when tag does not exist', async () => {
      repository.findBySlug.mockResolvedValue(null);

      await expect(
        service.removeFromSnippet('snippet-1', 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws not found when relation does not exist', async () => {
      repository.findBySlug.mockResolvedValue(createMockTag({ id: 'tag-1' }));
      repository.removeTagFromSnippet.mockResolvedValue(false);

      await expect(
        service.removeFromSnippet('snippet-1', 'typescript'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
