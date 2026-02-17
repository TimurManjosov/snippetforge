// test/unit/guards/ownership.guard.spec.ts

import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { OwnershipGuard } from '../../../src/modules/snippets/guards/ownership.guard';
import { SnippetsRepository } from '../../../src/modules/snippets/snippets.repository';
import {
  createMockSafeUser,
  createMockSnippet,
  createMockSnippetsRepository,
  type MockSnippetsRepository,
} from '../../mocks';
import { createMockExecutionContext } from '../../setup/test-utils';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;
  let repository: MockSnippetsRepository;

  beforeEach(() => {
    repository = createMockSnippetsRepository();
    guard = new OwnershipGuard(repository as unknown as SnippetsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow owner', async () => {
    const user = createMockSafeUser({ id: 'owner-id' });
    const snippet = createMockSnippet({ userId: 'owner-id' });
    repository.findById.mockResolvedValue(snippet);

    const context = createMockExecutionContext({
      request: {
        user,
        params: { id: snippet.id },
      },
    }) as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith(snippet.id);
    expect(context.switchToHttp().getRequest().snippet).toEqual(snippet);
  });

  it('should allow admin', async () => {
    const user = createMockSafeUser({ role: 'ADMIN', id: 'admin-id' });
    const snippet = createMockSnippet({ userId: 'owner-id' });
    repository.findById.mockResolvedValue(snippet);

    const context = createMockExecutionContext({
      request: {
        user,
        params: { id: snippet.id },
      },
    }) as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(repository.findById).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when snippet not found', async () => {
    const user = createMockSafeUser();
    repository.findById.mockResolvedValue(null);

    const context = createMockExecutionContext({
      request: {
        user,
        params: { id: 'missing-id' },
      },
    }) as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(repository.findById).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when user is not owner', async () => {
    const user = createMockSafeUser({ id: 'other-user' });
    const snippet = createMockSnippet({ userId: 'owner-id' });
    repository.findById.mockResolvedValue(snippet);

    const context = createMockExecutionContext({
      request: {
        user,
        params: { id: snippet.id },
      },
    }) as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(repository.findById).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when no user is present', async () => {
    repository.findById.mockResolvedValue(createMockSnippet());

    const context = createMockExecutionContext({
      request: {
        user: undefined,
        params: { id: 'snippet-id' },
      },
    }) as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    expect(repository.findById).not.toHaveBeenCalled();
  });
});
