import { ApiClientError, createApiClient } from '@/lib/api-client';
import type { PublicUser, UserStats } from '@/types/users';

export async function getUserProfile(userId: string): Promise<PublicUser> {
  const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', () => null);
  const result = await apiClient.get<PublicUser>(`/users/${userId}`);
  if (!result) {
    throw new ApiClientError(502, 'User profile response missing from API');
  }
  return result;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', () => null);
  const result = await apiClient.get<UserStats>(`/users/${userId}/stats`);
  if (!result) {
    throw new ApiClientError(502, 'User stats response missing from API');
  }
  return result;
}
