import { Request, Response, NextFunction } from 'express';
import {
  RequestIdMiddleware,
  sanitizeRequestId,
} from './request-id.middleware';
import { REQUEST_ID_MAX_LEN } from '../constants';

// Stable fake UUID returned by the mock
const FAKE_UUID = '00000000-0000-4000-8000-000000000001';

jest.mock('crypto', () => ({
  randomUUID: () => FAKE_UUID,
}));

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let req: Partial<Request> & { requestId?: string };
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
    req = { headers: {} };
    res = { setHeader: jest.fn() };
    next = jest.fn();
  });

  it('generates a new UUID when no header is set', () => {
    middleware.use(req as any, res as any, next);

    expect(req.requestId).toBe(FAKE_UUID);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', FAKE_UUID);
    expect(next).toHaveBeenCalled();
  });

  it('accepts a valid incoming header value', () => {
    req.headers!['x-request-id'] = 'abc-123';

    middleware.use(req as any, res as any, next);

    expect(req.requestId).toBe('abc-123');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'abc-123');
    expect(next).toHaveBeenCalled();
  });

  it('replaces a header that exceeds 64 characters with a new UUID', () => {
    req.headers!['x-request-id'] = 'a'.repeat(REQUEST_ID_MAX_LEN + 1);

    middleware.use(req as any, res as any, next);

    expect(req.requestId).toBe(FAKE_UUID);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', FAKE_UUID);
  });

  it('replaces a header with unsafe characters with a new UUID', () => {
    req.headers!['x-request-id'] = '<script>';

    middleware.use(req as any, res as any, next);

    expect(req.requestId).toBe(FAKE_UUID);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', FAKE_UUID);
  });

  it('always sets the X-Request-Id response header', () => {
    // Without incoming header
    middleware.use(req as any, res as any, next);
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      expect.any(String),
    );

    // With valid incoming header
    (res.setHeader as jest.Mock).mockClear();
    req.headers!['x-request-id'] = 'valid_id';
    middleware.use(req as any, res as any, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'valid_id');
  });
});

describe('sanitizeRequestId', () => {
  it('returns null for non-string input', () => {
    expect(sanitizeRequestId(undefined)).toBeNull();
    expect(sanitizeRequestId(null)).toBeNull();
    expect(sanitizeRequestId(42)).toBeNull();
  });

  it('returns null for empty or whitespace-only strings', () => {
    expect(sanitizeRequestId('')).toBeNull();
    expect(sanitizeRequestId('   ')).toBeNull();
  });

  it('returns trimmed value for a valid string', () => {
    expect(sanitizeRequestId('  abc-123  ')).toBe('abc-123');
  });
});
