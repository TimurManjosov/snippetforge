import { type ExecutionContext } from '@nestjs/common';
import { currentUserFactory } from '../../../src/modules/auth/decorators/current-user.decorator';
import { createMockExecutionContext } from '../../setup/test-utils';

describe('CurrentUser decorator', () => {
  it('returns undefined when no user is present', () => {
    const ctx = createMockExecutionContext();

    const result = currentUserFactory(
      undefined,
      ctx as unknown as ExecutionContext,
    );

    expect(result).toBeUndefined();
  });

  it('returns full user when no property is requested', () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      username: 'tester',
    };
    const ctx = createMockExecutionContext({ request: { user } });

    const result = currentUserFactory(
      undefined,
      ctx as unknown as ExecutionContext,
    );

    expect(result).toEqual(user);
  });

  it('returns a single property when key is provided', () => {
    const user = {
      id: 'user-2',
      email: 'user2@example.com',
      username: 'tester2',
    };
    const ctx = createMockExecutionContext({ request: { user } });

    const result = currentUserFactory(
      'email',
      ctx as unknown as ExecutionContext,
    );

    expect(result).toBe(user.email);
  });
});
