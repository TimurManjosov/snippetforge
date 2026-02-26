import type { ApiClient } from './api-client';
import type { ReactionsResponse, ReactionType } from '@/types/reactions';

export async function getSnippetReactions(
  client: ApiClient,
  snippetId: string,
): Promise<ReactionsResponse> {
  const result = await client.get<ReactionsResponse>(`/snippets/${snippetId}/reactions`);
  return result ?? { counts: [], viewer: [] };
}

export async function setReaction(
  client: ApiClient,
  snippetId: string,
  type: ReactionType,
): Promise<void> {
  await client.post(`/snippets/${snippetId}/reactions`, { type });
}

export async function removeReaction(
  client: ApiClient,
  snippetId: string,
  type: ReactionType,
): Promise<void> {
  await client.delete(`/snippets/${snippetId}/reactions/${type}`);
}
