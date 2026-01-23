// test/mocks/database.mock.ts

/**
 * Database Service Mock
 *
 * Mockt den DatabaseService für Unit Tests.
 * Keine echte DB-Verbindung nötig.
 */

export const createMockDatabaseService = () => ({
  drizzle: {
    query: {
      // ========================================
      // USERS TABLE
      // ========================================
      users: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },

      // ========================================
      // SNIPPETS TABLE (NEU!)
      // ========================================
      snippets: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    },

    // ========================================
    // QUERY BUILDER METHODS
    // ========================================
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn(),
      }),
    }),

    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn(),
        }),
      }),
    }),

    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn(),
      }),
    }),

    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockReturnValue({
            orderBy: jest.fn(),
          }),
        }),
        limit: jest.fn().mockReturnValue({
          offset: jest.fn().mockReturnValue({
            orderBy: jest.fn(),
          }),
        }),
        orderBy: jest.fn(),
      }),
    }),
  },

  // ========================================
  // DATABASE SERVICE METHODS
  // ========================================
  healthCheck: jest.fn().mockResolvedValue(true),
  onModuleInit: jest.fn(),
  onModuleDestroy: jest.fn(),
});

export type MockDatabaseService = ReturnType<typeof createMockDatabaseService>;
