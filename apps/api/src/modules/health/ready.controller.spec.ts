// E2E SMOKE (manual / integration test):
// - GET /api/live → 200, body enthält { status: 'ok', uptimeSeconds: <number> }
// - GET /api/ready → 200 wenn DB erreichbar, 503 wenn nicht
// - GET /api/metrics (METRICS_ENABLED=false) → 404
// - GET /api/metrics (METRICS_ENABLED=true, kein Token) → 200, Prometheus text format
// - GET /api/metrics (METRICS_ENABLED=true, falscher Token) → 401

import { ServiceUnavailableException } from '@nestjs/common';
import { ReadyController } from './ready.controller';

describe('ReadyController', () => {
  let controller: ReadyController;
  let mockDb: { healthCheck: jest.Mock };

  beforeEach(() => {
    mockDb = { healthCheck: jest.fn() };
    controller = new ReadyController(mockDb as any);
  });

  it('returns ok when DB healthCheck succeeds', async () => {
    mockDb.healthCheck.mockResolvedValue(true);

    const result = await controller.ready();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        checks: { db: 'ok' },
      }),
    );
    expect(result.timestamp).toBeDefined();
    expect(mockDb.healthCheck).toHaveBeenCalled();
  });

  it('throws ServiceUnavailableException when DB healthCheck fails', async () => {
    mockDb.healthCheck.mockRejectedValue(new Error('Connection refused'));

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
