import type { ApiClient } from '@/lib/api-client';
import type { Comment, FlagReason, PaginatedResponse } from '@/types/comments';

export interface ListCommentsParams {
  parentId?: string;
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}

export async function listComments(
  client: ApiClient,
  snippetId: string,
  params: ListCommentsParams = {},
): Promise<PaginatedResponse<Comment>> {
  const query = new URLSearchParams();
  if (params.parentId) query.set('parentId', params.parentId);
  if (params.page != null) query.set('page', String(params.page));
  if (params.limit != null) query.set('limit', String(params.limit));
  if (params.order) query.set('order', params.order);
  const qs = query.toString();
  const path = `/snippets/${snippetId}/comments${qs ? `?${qs}` : ''}`;
  const result = await client.get<PaginatedResponse<Comment>>(path);
  return result ?? { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
}

export async function createComment(
  client: ApiClient,
  snippetId: string,
  body: string,
  parentId?: string,
): Promise<Comment> {
  const payload: { body: string; parentId?: string } = { body };
  if (parentId) payload.parentId = parentId;
  const result = await client.post<Comment>(`/snippets/${snippetId}/comments`, payload);
  if (!result) throw new Error('Comment response missing from API');
  return result;
}

export async function updateComment(
  client: ApiClient,
  commentId: string,
  body: string,
): Promise<Comment> {
  const result = await client.put<Comment>(`/comments/${commentId}`, { body });
  if (!result) throw new Error('Comment response missing from API');
  return result;
}

export async function deleteComment(
  client: ApiClient,
  commentId: string,
): Promise<void> {
  await client.delete(`/comments/${commentId}`);
}

export async function flagComment(
  client: ApiClient,
  commentId: string,
  reason: FlagReason,
  message?: string,
): Promise<void> {
  const payload: { reason: FlagReason; message?: string } = { reason };
  if (message) payload.message = message;
  await client.post(`/comments/${commentId}/flags`, payload);
}

export async function unflagComment(
  client: ApiClient,
  commentId: string,
  reason: FlagReason,
): Promise<void> {
  await client.delete(`/comments/${commentId}/flags/${reason}`);
}
