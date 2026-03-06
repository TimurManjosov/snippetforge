import { ApiClientError, createApiClient } from '@/lib/api-client';
import type { UpdateUserSettings, UserSettings } from '@/types/settings';

/** Fetch the authenticated user's settings. */
export async function getMySettings(token: string): Promise<UserSettings> {
  const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', () => token);
  const result = await apiClient.get<UserSettings>('/settings/me');
  if (!result) {
    throw new ApiClientError(502, 'Settings response missing from API');
  }
  return result;
}

/** Persist partial setting updates for the authenticated user. */
export async function updateMySettings(
  token: string,
  dto: UpdateUserSettings,
): Promise<UserSettings> {
  const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL ?? '', () => token);
  const result = await apiClient.put<UserSettings>('/settings/me', dto);
  if (!result) {
    throw new ApiClientError(502, 'Settings response missing from API');
  }
  return result;
}
