import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentsRepository } from '../../../src/modules/comments/comments.repository';
import { CommentsService } from '../../../src/modules/comments/comments.service';
import { SnippetsRepository } from '../../../src/modules/snippets/snippets.repository';
import {
  createMockComment,
  createMockCommentsRepository,
  type MockCommentsRepository,
} from '../../mocks/comments.mock';
import { createMockSnippet } from '../../mocks/snippets.mock';
import { type SafeUser } from '../../../src/modules/users';

const ownerUser: SafeUser = {
  id: 'user-test-id-123',
  email: 'owner@test.com',
  username: 'owner',
  displayName: null,
  bio: null,
  avatarUrl: null,
  websiteUrl: null,
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const adminUser: SafeUser = {
  id: 'admin-test-id-456',
  email: 'admin@test.com',
  username: 'admin',
  displayName: null,
  bio: null,
  avatarUrl: null,
  websiteUrl: null,
  role: 'ADMIN',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const foreignUser: SafeUser = {
  id: 'foreign-test-id-789',
  email: 'foreign@test.com',
  username: 'foreign',
  displayName: null,
  bio: null,
  avatarUrl: null,
  websiteUrl: null,
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: MockCommentsRepository;
  let snippetsRepository: { findById: jest.Mock };

  beforeEach(async () => {
    repository = createMockCommentsRepository();
    snippetsRepository = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: CommentsRepository, useValue: repository },
        { provide: SnippetsRepository, useValue: snippetsRepository },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {
    it('creates a comment on a public snippet', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);

      const comment = createMockComment();
      repository.create.mockResolvedValue(comment);

      const result = await service.create(
        snippet.id,
        ownerUser,
        'Test comment',
      );

      expect(result).toEqual(comment);
      expect(repository.create).toHaveBeenCalledWith({
        snippetId: snippet.id,
        userId: ownerUser.id,
        body: 'Test comment',
        parentId: undefined,
      });
    });

    it('creates a reply and increments replyCount', async () => {
      const snippet = createMockSnippet({ isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);

      const parentComment = createMockComment({ id: 'parent-id', snippetId: snippet.id });
      repository.findById.mockResolvedValue(parentComment);

      const reply = createMockComment({ parentId: 'parent-id' });
      repository.create.mockResolvedValue(reply);
      repository.incrementReplyCount.mockResolvedValue(undefined);

      const result = await service.create(
        snippet.id,
        ownerUser,
        'Reply comment',
        'parent-id',
      );

      expect(result).toEqual(reply);
      expect(repository.incrementReplyCount).toHaveBeenCalledWith('parent-id');
    });

    it('throws 404 when parent comment does not belong to snippet', async () => {
      const snippet = createMockSnippet({ id: 'snippet-1', isPublic: true });
      snippetsRepository.findById.mockResolvedValue(snippet);

      const parentComment = createMockComment({
        id: 'parent-id',
        snippetId: 'different-snippet',
      });
      repository.findById.mockResolvedValue(parentComment);

      await expect(
        service.create('snippet-1', ownerUser, 'Reply', 'parent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 for private snippet from foreign user', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);

      await expect(
        service.create(snippet.id, foreignUser, 'Comment'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // GET
  // ============================================================

  describe('get', () => {
    it('returns a visible comment', async () => {
      const comment = createMockComment();
      repository.findById.mockResolvedValue(comment);

      const result = await service.get(comment.id);
      expect(result).toEqual(comment);
    });

    it('throws 404 when comment not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.get('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 for soft-deleted comment for non-owner', async () => {
      const comment = createMockComment({
        deletedAt: new Date(),
        userId: ownerUser.id,
      });
      repository.findById.mockResolvedValue(comment);

      await expect(service.get(comment.id, foreignUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns soft-deleted comment for owner', async () => {
      const comment = createMockComment({
        deletedAt: new Date(),
        userId: ownerUser.id,
      });
      repository.findById.mockResolvedValue(comment);

      const result = await service.get(comment.id, ownerUser);
      expect(result).toEqual(comment);
    });

    it('returns soft-deleted comment for admin', async () => {
      const comment = createMockComment({
        deletedAt: new Date(),
        userId: ownerUser.id,
      });
      repository.findById.mockResolvedValue(comment);

      const result = await service.get(comment.id, adminUser);
      expect(result).toEqual(comment);
    });

    it('throws 404 for hidden comment for non-owner', async () => {
      const comment = createMockComment({
        status: 'hidden',
        userId: ownerUser.id,
      });
      repository.findById.mockResolvedValue(comment);

      await expect(service.get(comment.id, foreignUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================

  describe('update', () => {
    it('allows owner to update comment', async () => {
      const comment = createMockComment({ userId: ownerUser.id });
      repository.findById.mockResolvedValue(comment);

      const updated = createMockComment({
        ...comment,
        body: 'Updated body',
        editedAt: new Date(),
      });
      repository.updateBody.mockResolvedValue(updated);

      const result = await service.update(comment.id, ownerUser, 'Updated body');
      expect(result).toEqual(updated);
      expect(repository.updateBody).toHaveBeenCalledWith(
        comment.id,
        'Updated body',
      );
    });

    it('allows admin to update any comment', async () => {
      const comment = createMockComment({ userId: ownerUser.id });
      repository.findById.mockResolvedValue(comment);

      const updated = createMockComment({ body: 'Admin edit' });
      repository.updateBody.mockResolvedValue(updated);

      const result = await service.update(comment.id, adminUser, 'Admin edit');
      expect(result).toEqual(updated);
    });

    it('throws 404 for non-owner/non-admin', async () => {
      const comment = createMockComment({ userId: ownerUser.id });
      repository.findById.mockResolvedValue(comment);

      await expect(
        service.update(comment.id, foreignUser, 'Nope'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when comment does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', ownerUser, 'No'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================
  // SOFT DELETE
  // ============================================================

  describe('softDelete', () => {
    it('soft-deletes comment for owner', async () => {
      const comment = createMockComment({ userId: ownerUser.id });
      repository.findById.mockResolvedValue(comment);
      repository.softDelete.mockResolvedValue({ ...comment, deletedAt: new Date() });

      await service.softDelete(comment.id, ownerUser);
      expect(repository.softDelete).toHaveBeenCalledWith(comment.id);
    });

    it('decrements parent replyCount when deleting a reply', async () => {
      const reply = createMockComment({
        userId: ownerUser.id,
        parentId: 'parent-id',
      });
      repository.findById.mockResolvedValue(reply);
      repository.softDelete.mockResolvedValue({ ...reply, deletedAt: new Date() });
      repository.decrementReplyCount.mockResolvedValue(undefined);

      await service.softDelete(reply.id, ownerUser);
      expect(repository.decrementReplyCount).toHaveBeenCalledWith('parent-id');
    });

    it('is idempotent - already deleted returns silently', async () => {
      const comment = createMockComment({
        userId: ownerUser.id,
        deletedAt: new Date(),
      });
      repository.findById.mockResolvedValue(comment);

      await service.softDelete(comment.id, ownerUser);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('throws 404 for non-owner/non-admin', async () => {
      const comment = createMockComment({ userId: ownerUser.id });
      repository.findById.mockResolvedValue(comment);

      await expect(
        service.softDelete(comment.id, foreignUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows admin to soft-delete any comment', async () => {
      const comment = createMockComment({ userId: ownerUser.id });
      repository.findById.mockResolvedValue(comment);
      repository.softDelete.mockResolvedValue({ ...comment, deletedAt: new Date() });

      await service.softDelete(comment.id, adminUser);
      expect(repository.softDelete).toHaveBeenCalledWith(comment.id);
    });
  });

  // ============================================================
  // FLAGS
  // ============================================================

  describe('flag', () => {
    it('flags a comment', async () => {
      const comment = createMockComment();
      repository.findById.mockResolvedValue(comment);
      repository.addFlag.mockResolvedValue(null);

      const result = await service.flag(comment.id, ownerUser, 'spam');
      expect(result).toEqual({ flagged: true });
      expect(repository.addFlag).toHaveBeenCalledWith(
        comment.id,
        ownerUser.id,
        'spam',
        undefined,
      );
    });

    it('is idempotent - duplicate flag returns flagged true', async () => {
      const comment = createMockComment();
      repository.findById.mockResolvedValue(comment);
      repository.addFlag.mockResolvedValue(null); // onConflictDoNothing

      const result = await service.flag(
        comment.id,
        ownerUser,
        'spam',
        'Test message',
      );
      expect(result).toEqual({ flagged: true });
    });

    it('throws 404 when comment does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.flag('nonexistent', ownerUser, 'spam'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unflag', () => {
    it('removes a flag', async () => {
      repository.removeFlag.mockResolvedValue(true);

      const result = await service.unflag('comment-id', ownerUser, 'spam');
      expect(result).toEqual({ unflagged: true });
    });

    it('is idempotent - non-existent flag still returns', async () => {
      repository.removeFlag.mockResolvedValue(false);

      const result = await service.unflag('comment-id', ownerUser, 'spam');
      expect(result).toEqual({ unflagged: true });
    });
  });

  // ============================================================
  // SNIPPET ACCESS
  // ============================================================

  describe('assertSnippetReadable (via list)', () => {
    it('throws 404 for private snippet from foreign user', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);

      await expect(
        service.list(snippet.id, foreignUser, {
          page: 1,
          limit: 20,
          order: 'asc',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows owner to list comments on private snippet', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.listVisibleBySnippet.mockResolvedValue({
        items: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      });

      const result = await service.list(snippet.id, ownerUser, {
        page: 1,
        limit: 20,
        order: 'asc',
      });

      expect(result.items).toEqual([]);
    });

    it('allows admin to list comments on private snippet', async () => {
      const snippet = createMockSnippet({
        isPublic: false,
        userId: ownerUser.id,
      });
      snippetsRepository.findById.mockResolvedValue(snippet);
      repository.listVisibleBySnippet.mockResolvedValue({
        items: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      });

      const result = await service.list(snippet.id, adminUser, {
        page: 1,
        limit: 20,
        order: 'asc',
      });

      expect(result.items).toEqual([]);
    });

    it('throws 404 when snippet not found', async () => {
      snippetsRepository.findById.mockResolvedValue(null);

      await expect(
        service.list('nonexistent', ownerUser, {
          page: 1,
          limit: 20,
          order: 'asc',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
