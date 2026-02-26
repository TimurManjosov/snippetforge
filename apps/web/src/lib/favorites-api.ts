import type { ApiClient } from './api-client';
import type { FavoritesListResponse } from '@/types/favorites';

export async function addFavorite(
  client: ApiClient,
  snippetId: string,
): Promise<void> {
  await client.post('/favorites', { snippetId });
}

export async function removeFavorite(
  client: ApiClient,
  snippetId: string,
): Promise<void> {
  await client.delete(`/favorites/${snippetId}`);
}

export async function listFavorites(
  client: ApiClient,
  page = 1,
  limit = 20,
): Promise<FavoritesListResponse> {
  const result = await client.get<FavoritesListResponse>(
    `/favorites?page=${page}&limit=${limit}`,
  );
  return result ?? { data: [], total: 0, page, limit };
}
