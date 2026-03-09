import { createApiClient } from '@/lib/api-client';

export interface UserDirectoryItem {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  publicSnippetCount: number;
}

export interface UserDirectoryMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserDirectoryResponse {
  items: UserDirectoryItem[];
  meta: UserDirectoryMeta;
}

export interface ListUsersParams {
  q?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'publicSnippetCount';
  order?: 'asc' | 'desc';
}

export async function listUsers(
  params: ListUsersParams = {},
  signal?: AbortSignal,
): Promise<UserDirectoryResponse> {
  const apiClient = createApiClient(
    process.env.NEXT_PUBLIC_API_URL ?? '',
    () => null,
  );

  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);

  const qs = searchParams.toString();
  const path = qs ? `/users?${qs}` : '/users';

  const result = await apiClient.get<UserDirectoryResponse>(path, { signal });
  return result ?? { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
}
