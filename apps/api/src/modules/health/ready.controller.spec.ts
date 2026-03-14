// E2E SMOKE (manual / integration test):
// - GET /api/health → 200, body enthält { status: 'ok', uptimeSeconds: <number> }
// - GET /api/ready → 200 wenn DB erreichbar, 503 wenn nicht
// - GET /api/metrics (METRICS_ENABLED=false) → 404
// - GET /api/metrics (METRICS_ENABLED=true, kein Token) → 200, Prometheus text format
// - GET /api/metrics (METRICS_ENABLED=true, falscher Token) → 401

import { ServiceUnavailableException } from '@nestjs/common';
import { ReadyController } from './ready.controller';

describe('ReadyController', () => {
  let controller: ReadyController;
  let mockDb: { drizzle: { execute: jest.Mock } };

  beforeEach(() => {
    mockDb = { drizzle: { execute: jest.fn() } };
    controller = new ReadyController(mockDb as any);
  });

  it('returns ok when DB query succeeds', async () => {
    mockDb.drizzle.execute.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.ready();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        checks: { db: 'ok' },
      }),
    );
    expect(result.timestamp).toBeDefined();
    expect(mockDb.drizzle.execute).toHaveBeenCalledWith('select 1');
  });

  it('throws ServiceUnavailableException when DB query fails', async () => {
    mockDb.drizzle.execute.mockRejectedValue(new Error('Connection refused'));

    try {
      await controller.ready();
      fail('Expected ServiceUnavailableException');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      const response = (error as ServiceUnavailableException).getResponse();
      expect(response).toEqual(
        expect.objectContaining({
          status: 'fail',
          checks: { db: 'fail' },
        }),
      );
    }
  });
});
