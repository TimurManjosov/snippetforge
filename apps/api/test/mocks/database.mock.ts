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
      users: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    },
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
        where: jest.fn(),
      }),
    }),
  },
  healthCheck: jest.fn().mockResolvedValue(true),
  onModuleInit: jest.fn(),
  onModuleDestroy: jest.fn(),
});

export type MockDatabaseService = ReturnType<typeof createMockDatabaseService>;
