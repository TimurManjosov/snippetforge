'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/use-settings';
import { UpdateSettingsSchema } from '@/schemas/settings.schemas';
import type { UiTheme } from '@/types/settings';

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Auth gate — redirect before any protected content renders
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const { settings, loading, error, update } = useSettings(!!user);

  // Form state with safe defaults
  const [visibility, setVisibility] = useState(false);
  const [language, setLanguage] = useState('');
  const [theme, setTheme] = useState<UiTheme>('system');
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Sync form fields from fetched settings (once)
  useEffect(() => {
    if (!settings) return;
    setVisibility(settings.defaultSnippetVisibility);
    setLanguage(settings.defaultLanguage ?? '');
    setTheme(settings.uiTheme ?? 'system');
    setItemsPerPage(settings.itemsPerPage ?? 20);
  }, [settings]);

  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSaveMsg(null);

      const parsed = UpdateSettingsSchema.safeParse({
        defaultSnippetVisibility: visibility,
        defaultLanguage: language || null,
        uiTheme: theme,
        itemsPerPage,
      });

      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        setSaveMsg(firstIssue?.message ?? 'Validation failed');
        return;
      }

      setSaving(true);
      try {
        await update(parsed.data);
        setSaveMsg('Saved \u2713');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save settings';
        setSaveMsg(message);
      } finally {
        setSaving(false);
      }
    },
    [visibility, language, theme, itemsPerPage, update],
  );

  // Auth loading — render nothing to prevent flash
  if (authLoading) return null;
  if (!user) return null;

  if (loading) {
    return (
      <main className="snippet-page">
        <div className="snippet-page-header">
          <h1 className="snippet-page-title">Settings</h1>
        </div>
        <p className="snippet-form-helper">Loading settings…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="snippet-page">
        <div className="snippet-page-header">
          <h1 className="snippet-page-title">Settings</h1>
        </div>
        <div role="alert" className="snippet-form-error">
          {error}
        </div>
      </main>
    );
  }

  if (!settings) return null;

  return (
    <main className="snippet-page">
      <div className="snippet-page-header">
        <h1 className="snippet-page-title">Settings</h1>
        <p className="snippet-page-subtitle">Manage your SnippetForge preferences.</p>
      </div>

      <div className="snippet-form-card">
        <form onSubmit={handleSave} noValidate className="snippet-form">
          {saveMsg && (
            <div role="status" className="snippet-form-helper">
              {saveMsg}
            </div>
          )}

          <div className="snippet-form-field">
            <label htmlFor="settings-visibility" className="snippet-form-label">
              Default snippet visibility
            </label>
            <select
              id="settings-visibility"
              value={visibility ? 'public' : 'private'}
              onChange={(e) => setVisibility(e.target.value === 'public')}
              className="snippet-form-input"
              disabled={saving}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="snippet-form-field">
            <label htmlFor="settings-language" className="snippet-form-label">
              Default language
            </label>
            <input
              id="settings-language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="snippet-form-input"
              placeholder="e.g. typescript, python"
              disabled={saving}
            />
          </div>

          <div className="snippet-form-field">
            <label htmlFor="settings-theme" className="snippet-form-label">
              Theme
            </label>
            <select
              id="settings-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as UiTheme)}
              className="snippet-form-input"
              disabled={saving}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <p className="snippet-form-helper">
              Theme switching will be applied in a future update.
            </p>
          </div>

          <div className="snippet-form-field">
            <label htmlFor="settings-items-per-page" className="snippet-form-label">
              Items per page
            </label>
            <input
              id="settings-items-per-page"
              type="number"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="snippet-form-input"
              min={10}
              max={100}
              disabled={saving}
            />
          </div>

          <div className="snippet-form-actions">
            <button type="submit" className="snippet-submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
