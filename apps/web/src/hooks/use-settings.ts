'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getMySettings, updateMySettings } from '@/lib/settings-api';
import type { UpdateUserSettings, UserSettings } from '@/types/settings';

/** Module-level cache so settings survive re-mounts without a new network request. */
let cached: UserSettings | null = null;

type UseSettingsReturn = {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (dto: UpdateUserSettings) => Promise<UserSettings>;
};

export function useSettings(enabled: boolean): UseSettingsReturn {
  const { token } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(() => cached);
  const [loading, setLoading] = useState(!cached && enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMySettings(token);
      cached = data;
      setSettings(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const update = useCallback(
    async (dto: UpdateUserSettings): Promise<UserSettings> => {
      if (!token) throw new Error('Not authenticated');
      const data = await updateMySettings(token, dto);
      cached = data;
      setSettings(data);
      return data;
    },
    [token],
  );

  useEffect(() => {
    if (!enabled || cached) return;
    refresh();
  }, [enabled, refresh]);

  return { settings, loading, error, refresh, update };
}
