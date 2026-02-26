import type { ApiClient } from './api-client';
import type {
  Collection,
  CollectionWithItems,
  CreateCollectionDto,
  UpdateCollectionDto,
} from '@/types/collections';

export async function createCollection(
  client: ApiClient,
  dto: CreateCollectionDto,
): Promise<Collection> {
  const result = await client.post<Collection>('/collections', dto);
  if (!result) throw new Error('Collection response missing from API');
  return result;
}

export async function listMyCollections(
  client: ApiClient,
): Promise<Collection[]> {
  const result = await client.get<Collection[]>('/collections/me');
  return result ?? [];
}

export async function getCollection(
  client: ApiClient,
  id: string,
): Promise<CollectionWithItems> {
  const result = await client.get<CollectionWithItems>(`/collections/${id}`);
  if (!result) throw new Error('Collection response missing from API');
  return result;
}

export async function updateCollection(
  client: ApiClient,
  id: string,
  dto: UpdateCollectionDto,
): Promise<Collection> {
  const result = await client.put<Collection>(`/collections/${id}`, dto);
  if (!result) throw new Error('Collection response missing from API');
  return result;
}

export async function deleteCollection(
  client: ApiClient,
  id: string,
): Promise<void> {
  await client.delete(`/collections/${id}`);
}

export async function addItem(
  client: ApiClient,
  collectionId: string,
  snippetId: string,
): Promise<void> {
  await client.post(`/collections/${collectionId}/items`, { snippetId });
}

export async function removeItem(
  client: ApiClient,
  collectionId: string,
  snippetId: string,
): Promise<void> {
  await client.delete(`/collections/${collectionId}/items/${snippetId}`);
}
