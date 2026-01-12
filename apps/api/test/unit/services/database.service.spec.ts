/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// test/unit/services/database.service.spec.ts

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../../src/shared/database/database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockConfigService: Partial<ConfigService>;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      end: jest.fn().mockResolvedValue(undefined),
      unsafe: jest.fn().mockResolvedValue([]),
    };

    // Mock postgres constructor
    jest.mock('postgres', () => {
      return jest.fn(() => mockClient);
    });

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'DATABASE_URL')
          return 'postgresql://test:test@localhost:5432/test';
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  describe('onModuleDestroy', () => {
    it('should close database connection', async () => {
      // Set up client
      (service as any).client = mockClient;

      await service.onModuleDestroy();

      expect(mockClient.end).toHaveBeenCalled();
    });

    it('should handle missing client gracefully', async () => {
      (service as any).client = null;

      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('drizzle getter', () => {
    it('should throw error when database not initialized', () => {
      expect(() => service.drizzle).toThrow('Database not initialized');
    });
  });

  describe('executeRaw', () => {
    it('should execute raw SQL', async () => {
      (service as any).client = mockClient;
      mockClient.unsafe.mockResolvedValue([{ result: 'success' }]);

      const result = await service.executeRaw('SELECT 1');

      expect(result).toEqual([{ result: 'success' }]);
      expect(mockClient.unsafe).toHaveBeenCalledWith('SELECT 1');
    });
  });
});
