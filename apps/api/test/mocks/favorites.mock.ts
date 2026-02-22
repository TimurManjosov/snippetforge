export const createMockFavoritesRepository = () => ({
  add: jest.fn(),
  remove: jest.fn(),
  listByUser: jest.fn(),
});

export type MockFavoritesRepository = ReturnType<
  typeof createMockFavoritesRepository
>;
