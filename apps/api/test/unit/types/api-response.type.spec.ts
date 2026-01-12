// test/unit/types/api-response.type.spec.ts

import {
  isErrorResponse,
  isSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
  type ApiResult,
} from '../../../src/shared/types/api-response.type';

describe('API Response Types', () => {
  describe('isSuccessResponse', () => {
    it('should return true for success response', () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: 'test-id' },
      };

      expect(isSuccessResponse(response)).toBe(true);
    });

    it('should return false for error response', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: 'ERROR',
          message: 'Test error',
        },
      };

      expect(isSuccessResponse(response)).toBe(false);
    });

    it('should narrow type correctly', () => {
      const response: ApiResult<{ id: string }> = {
        success: true,
        data: { id: 'test-id' },
      };

      if (isSuccessResponse(response)) {
        // TypeScript knows response.data exists
        expect(response.data.id).toBe('test-id');
      }
    });
  });

  describe('isErrorResponse', () => {
    it('should return true for error response', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: 'ERROR',
          message: 'Test error',
        },
      };

      expect(isErrorResponse(response)).toBe(true);
    });

    it('should return false for success response', () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: 'test-id' },
      };

      expect(isErrorResponse(response)).toBe(false);
    });

    it('should narrow type correctly', () => {
      const response: ApiResult = {
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
        },
      };

      if (isErrorResponse(response)) {
        // TypeScript knows response.error exists
        expect(response.error.code).toBe('TEST_ERROR');
        expect(response.error.message).toBe('Test error message');
      }
    });

    it('should work with error details', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: { field: 'email', issue: 'Invalid format' },
        },
      };

      if (isErrorResponse(response)) {
        expect(response.error.details).toEqual({
          field: 'email',
          issue: 'Invalid format',
        });
      }
    });
  });

  describe('ApiResponse with meta', () => {
    it('should handle meta information', () => {
      const response: ApiResponse<string[]> = {
        success: true,
        data: ['item1', 'item2'],
        meta: {
          timestamp: '2026-01-12T10:00:00Z',
          requestId: 'req-123',
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
      };

      expect(response.meta?.pagination?.total).toBe(2);
      expect(response.meta?.requestId).toBe('req-123');
    });
  });
});
