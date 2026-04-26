// MANUAL VERIFICATION CHECKLIST:
// API:
// 1. Setze SENTRY_DSN_API in .env.local, starte API.
// 2. Rufe einen Endpoint auf, der einen 500-Fehler wirft.
// 3. Prüfe in Sentry: Event erscheint mit Tags requestId, method, path.
// 4. Prüfe: Authorization-Header ist NICHT im Sentry-Event sichtbar.
//
// Web:
// 1. Setze NEXT_PUBLIC_SENTRY_DSN in .env.local, starte Web.
// 2. Löse einen unhandled client-side Error aus (throw in Component).
// 3. Prüfe in Sentry: Event erscheint.
// 4. Rufe API-Endpoint auf, der 500 zurückgibt.
// 5. Prüfe in Sentry: Event enthält Tag requestId aus X-Request-Id Header.

import { SENTRY_DSN_API_ENV } from './sentry.constants';

// Mock @sentry/node before importing initSentry
const mockInit = jest.fn();

jest.mock('@sentry/node', () => ({
  init: mockInit,
}));

import { initSentry } from './sentry.init';

describe('initSentry', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env[SENTRY_DSN_API_ENV];
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should not call Sentry.init when SENTRY_DSN_API is not set', () => {
    initSentry();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('should call Sentry.init exactly once when SENTRY_DSN_API is set', () => {
    process.env[SENTRY_DSN_API_ENV] =
      'https://examplePublicKey@o0.ingest.sentry.io/0';
    initSentry();
    expect(mockInit).toHaveBeenCalledTimes(1);
  });

  describe('tracesSampleRate', () => {
    const DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';

    it('should default to 0 when env var is not set', () => {
      process.env[SENTRY_DSN_API_ENV] = DSN;
      initSentry();
      expect(mockInit.mock.calls[0][0].tracesSampleRate).toBe(0);
    });

    it('should use valid numeric value from env var', () => {
      process.env[SENTRY_DSN_API_ENV] = DSN;
      process.env['SENTRY_TRACES_SAMPLE_RATE'] = '0.5';
      initSentry();
      expect(mockInit.mock.calls[0][0].tracesSampleRate).toBe(0.5);
    });

    it('should clamp values above 1 to 1', () => {
      process.env[SENTRY_DSN_API_ENV] = DSN;
      process.env['SENTRY_TRACES_SAMPLE_RATE'] = '2';
      initSentry();
      expect(mockInit.mock.calls[0][0].tracesSampleRate).toBe(1);
    });

    it('should clamp values below 0 to 0', () => {
      process.env[SENTRY_DSN_API_ENV] = DSN;
      process.env['SENTRY_TRACES_SAMPLE_RATE'] = '-1';
      initSentry();
      expect(mockInit.mock.calls[0][0].tracesSampleRate).toBe(0);
    });

    it('should default to 0 for non-numeric env var value', () => {
      process.env[SENTRY_DSN_API_ENV] = DSN;
      process.env['SENTRY_TRACES_SAMPLE_RATE'] = 'invalid';
      initSentry();
      expect(mockInit.mock.calls[0][0].tracesSampleRate).toBe(0);
    });
  });

  describe('beforeSend callback', () => {
    let beforeSend: (event: any) => any;

    beforeEach(() => {
      process.env[SENTRY_DSN_API_ENV] =
        'https://examplePublicKey@o0.ingest.sentry.io/0';
      initSentry();
      beforeSend = mockInit.mock.calls[0][0].beforeSend;
    });

    it('should remove authorization header from event', () => {
      const event = {
        request: {
          headers: {
            authorization: 'Bearer secret-token',
            'content-type': 'application/json',
          },
        },
      };

      const result = beforeSend(event);

      expect(result.request.headers).not.toHaveProperty('authorization');
    });

    it('should remove Authorization header (mixed case) from event', () => {
      const event = {
        request: {
          headers: {
            Authorization: 'Bearer secret-token',
            'content-type': 'application/json',
          },
        },
      };

      const result = beforeSend(event);

      expect(result.request.headers).not.toHaveProperty('Authorization');
    });

    it('should remove cookie header from event', () => {
      const event = {
        request: {
          headers: {
            cookie: 'session=abc123',
            'content-type': 'application/json',
          },
        },
      };

      const result = beforeSend(event);

      expect(result.request.headers).not.toHaveProperty('cookie');
    });

    it('should remove Cookie header (mixed case) from event', () => {
      const event = {
        request: {
          headers: {
            Cookie: 'session=abc123',
            'content-type': 'application/json',
          },
        },
      };

      const result = beforeSend(event);

      expect(result.request.headers).not.toHaveProperty('Cookie');
    });

    it('should preserve other headers like content-type', () => {
      const event = {
        request: {
          headers: {
            authorization: 'Bearer secret',
            cookie: 'session=abc',
            'content-type': 'application/json',
          },
        },
      };

      const result = beforeSend(event);

      expect(result.request.headers['content-type']).toBe('application/json');
    });

    it('should handle event without request headers gracefully', () => {
      const event = { message: 'test error' };
      const result = beforeSend(event);
      expect(result).toEqual({ message: 'test error' });
    });
  });
});
