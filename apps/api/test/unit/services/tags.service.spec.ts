// test/unit/services/tags.service.spec.ts

import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SnippetsRepository } from '../../../src/modules/snippets/snippets.repository';
import { TagsRepository } from '../../../src/modules/tags/tags.repository';
import { TagsService } from '../../../src/modules/tags/tags.service';
import {
  createMockSnippet,
  createMockSnippetsRepository,
  createMockTag,
  createMockTagsRepository,
  type MockSnippetsRepository,
  type MockTagsRepository,
} from '../../mocks';

/**
 * TagsService Unit Tests
 *
 * Tests:
 * - Tag Creation (Business Logic: slug generation, duplicate check)
 * - Tag Listing
 * - Tag Attachment (idempotency, validation)
 * - Tag Detachment
 */
describe('TagsService', () => {
  let service: TagsService;
  let tagsRepository: MockTagsRepository;
  let snippetsRepository: MockSnippetsRepository;

  const mockTag = createMockTag();
  const mockSnippet = createMockSnippet();

  beforeEach(async () => {
    tagsRepository = createMockTagsRepository();
    snippetsRepository = createMockSnippetsRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: TagsRepository,
          useValue: tagsRepository,
        },
        {
          provide: SnippetsRepository,
          useValue: snippetsRepository,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // CREATE TAG
  // ============================================================

  describe('createTag', () => {
    it('should create a new tag with generated slug', async () => {
      // Arrange
      const tagName = 'TypeScript React';
      const expectedSlug = 'typescript-react';
      tagsRepository.findTagBySlug.mockResolvedValue(null);
      tagsRepository.createTag.mockResolvedValue({
        ...mockTag,
        name: tagName,
        slug: expectedSlug,
      });

      // Act
      const result = await service.createTag(tagName);

      // Assert
      expect(result.name).toBe(tagName);
      expect(result.slug).toBe(expectedSlug);
      expect(tagsRepository.findTagBySlug).toHaveBeenCalledWith(expectedSlug);
      expect(tagsRepository.createTag).toHaveBeenCalledWith({
        name: tagName,
        slug: expectedSlug,
      });
    });

    it('should throw ConflictException for duplicate slug', async () => {
      // Arrange
      const tagName = 'TypeScript';
      tagsRepository.findTagBySlug.mockResolvedValue(mockTag);

      // Act & Assert
      await expect(service.createTag(tagName)).rejects.toThrow(
        ConflictException,
      );
      expect(tagsRepository.createTag).not.toHaveBeenCalled();
    });

    it('should normalize tag name to slug', async () => {
      // Arrange
      const tagName = 'Node.js';
      const expectedSlug = 'nodejs';
      tagsRepository.findTagBySlug.mockResolvedValue(null);
      tagsRepository.createTag.mockResolvedValue(mockTag);

      // Act
      await service.createTag(tagName);

      // Assert
      expect(tagsRepository.findTagBySlug).toHaveBeenCalledWith(expectedSlug);
      expect(tagsRepository.createTag).toHaveBeenCalledWith({
        name: tagName,
        slug: expectedSlug,
      });
    });
  });

  // ============================================================
  // LIST TAGS
  // ============================================================

  describe('listTags', () => {
    it('should return all tags with snippet count', async () => {
      // Arrange
      const tagsWithCount = [
        { ...mockTag, snippetCount: 5 },
        { ...createMockTag({ id: 'tag-2', name: 'React', slug: 'react' }), snippetCount: 3 },
      ];
      tagsRepository.findAllTagsWithCount.mockResolvedValue(tagsWithCount);

      // Act
      const result = await service.listTags();

      // Assert
      expect(result).toEqual(tagsWithCount);
      expect(tagsRepository.findAllTagsWithCount).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no tags exist', async () => {
      // Arrange
      tagsRepository.findAllTagsWithCount.mockResolvedValue([]);

      // Act
      const result = await service.listTags();

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // FIND TAG BY SLUG
  // ============================================================

  describe('findTagBySlug', () => {
    it('should return tag when found', async () => {
      // Arrange
      tagsRepository.findTagBySlug.mockResolvedValue(mockTag);

      // Act
      const result = await service.findTagBySlug('typescript');

      // Assert
      expect(result).toEqual(mockTag);
    });

    it('should throw NotFoundException when tag not found', async () => {
      // Arrange
      tagsRepository.findTagBySlug.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findTagBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // ATTACH TAGS TO SNIPPET
  // ============================================================

  describe('attachTagsToSnippet', () => {
    it('should attach tags to snippet successfully', async () => {
      // Arrange
      const dto = { slugs: ['typescript', 'react'] };
      const foundTags = [
        mockTag,
        createMockTag({ id: 'tag-2', name: 'React', slug: 'react' }),
      ];
      snippetsRepository.findById.mockResolvedValue(mockSnippet);
      tagsRepository.findTagsBySlugs.mockResolvedValue(foundTags);
      tagsRepository.findExistingTagRelations.mockResolvedValue([]);
      tagsRepository.attachTagsToSnippet.mockResolvedValue(2);

      // Act
      const result = await service.attachTagsToSnippet(mockSnippet.id, dto);

      // Assert
      expect(result).toEqual({
        attached: 2,
        alreadyAttached: 0,
        notFound: [],
      });
      expect(snippetsRepository.findById).toHaveBeenCalledWith(mockSnippet.id);
      expect(tagsRepository.findTagsBySlugs).toHaveBeenCalledWith(['typescript', 'react']);
    });

    it('should throw NotFoundException when snippet not found', async () => {
      // Arrange
      const dto = { slugs: ['typescript'] };
      snippetsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.attachTagsToSnippet('nonexistent-id', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when tags not found', async () => {
      // Arrange
      const dto = { slugs: ['typescript', 'nonexistent'] };
      snippetsRepository.findById.mockResolvedValue(mockSnippet);
      tagsRepository.findTagsBySlugs.mockResolvedValue([mockTag]); // only typescript found

      // Act & Assert
      await expect(
        service.attachTagsToSnippet(mockSnippet.id, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should be idempotent - handle already attached tags', async () => {
      // Arrange
      const dto = { slugs: ['typescript', 'react'] };
      const foundTags = [
        mockTag,
        createMockTag({ id: 'tag-2', name: 'React', slug: 'react' }),
      ];
      snippetsRepository.findById.mockResolvedValue(mockSnippet);
      tagsRepository.findTagsBySlugs.mockResolvedValue(foundTags);
      tagsRepository.findExistingTagRelations.mockResolvedValue([mockTag.id]); // typescript already attached
      tagsRepository.attachTagsToSnippet.mockResolvedValue(1); // only react attached

      // Act
      const result = await service.attachTagsToSnippet(mockSnippet.id, dto);

      // Assert
      expect(result).toEqual({
        attached: 1,
        alreadyAttached: 1,
        notFound: [],
      });
    });

    it('should normalize slugs before lookup', async () => {
      // Arrange
      const dto = { slugs: ['TypeScript', ' React '] };
      snippetsRepository.findById.mockResolvedValue(mockSnippet);
      tagsRepository.findTagsBySlugs.mockResolvedValue([]);

      // Act
      await expect(
        service.attachTagsToSnippet(mockSnippet.id, dto),
      ).rejects.toThrow(NotFoundException);

      // Assert
      expect(tagsRepository.findTagsBySlugs).toHaveBeenCalledWith(['typescript', 'react']);
    });
  });

  // ============================================================
  // DETACH TAG FROM SNIPPET
  // ============================================================

  describe('detachTagFromSnippet', () => {
    it('should detach tag from snippet successfully', async () => {
      // Arrange
      snippetsRepository.findById.mockResolvedValue(mockSnippet);
      tagsRepository.findTagBySlug.mockResolvedValue(mockTag);
      tagsRepository.detachTagFromSnippet.mockResolvedValue(true);

      // Act
      await service.detachTagFromSnippet(mockSnippet.id, 'typescript');

      // Assert
      expect(snippetsRepository.findById).toHaveBeenCalledWith(mockSnippet.id);
      expect(tagsRepository.findTagBySlug).toHaveBeenCalledWith('typescript');
      expect(tagsRepository.detachTagFromSnippet).toHaveBeenCalledWith(
        mockSnippet.id,
        mockTag.id,
      );
    });

    it('should throw NotFoundException when snippet not found', async () => {
      // Arrange
      snippetsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.detachTagFromSnippet('nonexistent-id', 'typescript'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when tag not found', async () => {
      // Arrange
      snippetsRepository.findById.mockResolvedValue(mockSnippet);
      tagsRepository.findTagBySlug.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.detachTagFromSnippet(mockSnippet.id, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when relation not found', async () => {
      // Arrange
      snippetsRepository.findById.mockResolvedValue(mockSnippet);
      tagsRepository.findTagBySlug.mockResolvedValue(mockTag);
      tagsRepository.detachTagFromSnippet.mockResolvedValue(false); // not attached

      // Act & Assert
      await expect(
        service.detachTagFromSnippet(mockSnippet.id, 'typescript'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should normalize slug before lookup', async () => {
      // Arrange
      snippetsRepository.findById.mockResolvedValue(mockSnippet);
      tagsRepository.findTagBySlug.mockResolvedValue(mockTag);
      tagsRepository.detachTagFromSnippet.mockResolvedValue(true);

      // Act
      await service.detachTagFromSnippet(mockSnippet.id, 'TypeScript');

      // Assert
      expect(tagsRepository.findTagBySlug).toHaveBeenCalledWith('typescript');
    });
  });

  // ============================================================
  // FIND TAGS BY SNIPPET ID
  // ============================================================

  describe('findTagsBySnippetId', () => {
    it('should return tags for snippet', async () => {
      // Arrange
      const tags = [mockTag, createMockTag({ id: 'tag-2', slug: 'react' })];
      tagsRepository.findTagsBySnippetId.mockResolvedValue(tags);

      // Act
      const result = await service.findTagsBySnippetId(mockSnippet.id);

      // Assert
      expect(result).toEqual(tags);
      expect(tagsRepository.findTagsBySnippetId).toHaveBeenCalledWith(mockSnippet.id);
    });

    it('should return empty array when snippet has no tags', async () => {
      // Arrange
      tagsRepository.findTagsBySnippetId.mockResolvedValue([]);

      // Act
      const result = await service.findTagsBySnippetId(mockSnippet.id);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
