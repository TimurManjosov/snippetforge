'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/use-settings';
import { UpdateSettingsSchema } from '@/schemas/settings.schemas';
import { updateMyProfile } from '@/lib/users-api';
import type { UiTheme } from '@/types/settings';

export default function SettingsPage() {
  const { user, token, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  // Auth gate — redirect before any protected content renders
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const { settings, loading, error, update } = useSettings(!!user);

  // ── App settings form state ──────────────────────────────────
  const [visibility, setVisibility] = useState(false);
  const [language, setLanguage] = useState('');
  const [theme, setTheme] = useState<UiTheme>('system');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // ── Profile form state ───────────────────────────────────────
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Sync app settings form from fetched settings (once)
  useEffect(() => {
    if (!settings) return;
    setVisibility(settings.defaultSnippetVisibility);
    setLanguage(settings.defaultLanguage ?? '');
    setTheme(settings.uiTheme ?? 'system');
    setItemsPerPage(settings.itemsPerPage ?? 20);
  }, [settings]);

  // Sync profile form from auth user (once, then user controls the form)
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? '');
    setBio(user.bio ?? '');
    setAvatarUrl(user.avatarUrl ?? '');
    setWebsiteUrl(user.websiteUrl ?? '');
  }, [user]);

  const handleSaveSettings = useCallback(
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
        setSaveMsg('Saved ✓');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save settings';
        setSaveMsg(message);
      } finally {
        setSaving(false);
      }
    },
    [visibility, language, theme, itemsPerPage, update],
  );

  const handleSaveProfile = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setProfileMsg(null);
      setProfileSaving(true);

      try {
        await updateMyProfile(
          {
            displayName: displayName.trim() || null,
            bio: bio.trim() || null,
            avatarUrl: avatarUrl.trim() || null,
            websiteUrl: websiteUrl.trim() || null,
          },
          () => token,
        );
        await refreshUser();
        setProfileMsg('Profile saved ✓');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save profile';
        setProfileMsg(message);
      } finally {
        setProfileSaving(false);
      }
    },
    [displayName, bio, avatarUrl, websiteUrl, token, refreshUser],
  );

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

      {/* ── Profile section ── */}
      <section className="snippet-form-card" aria-label="Profile settings">
        <h2 className="snippet-form-section-title">Profile</h2>
        <form onSubmit={handleSaveProfile} noValidate className="snippet-form">
          {profileMsg && (
            <div
              role="status"
              className={profileMsg.includes('✓') ? 'snippet-form-helper' : 'snippet-form-error'}
            >
              {profileMsg}
            </div>
          )}

          <div className="snippet-form-field">
            <label htmlFor="profile-display-name" className="snippet-form-label">
              Display name
            </label>
            <input
              id="profile-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="snippet-form-input"
              placeholder="Your full name or handle"
              maxLength={80}
              disabled={profileSaving}
            />
          </div>

          <div className="snippet-form-field">
            <label htmlFor="profile-bio" className="snippet-form-label">
              Bio
            </label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="snippet-form-input"
              placeholder="A short bio about yourself"
              rows={3}
              maxLength={500}
              disabled={profileSaving}
            />
            <p className="snippet-form-helper">{bio.length}/500</p>
          </div>

          <div className="snippet-form-field">
            <label htmlFor="profile-avatar-url" className="snippet-form-label">
              Avatar URL
            </label>
            <input
              id="profile-avatar-url"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="snippet-form-input"
              placeholder="https://example.com/your-photo.jpg"
              maxLength={500}
              disabled={profileSaving}
            />
          </div>

          <div className="snippet-form-field">
            <label htmlFor="profile-website-url" className="snippet-form-label">
              Website
            </label>
            <input
              id="profile-website-url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="snippet-form-input"
              placeholder="https://yourwebsite.com"
              maxLength={200}
              disabled={profileSaving}
            />
          </div>

          <div className="snippet-form-actions">
            <button type="submit" className="snippet-submit" disabled={profileSaving}>
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </section>

      {/* ── App settings section ── */}
      <section className="snippet-form-card" aria-label="Application settings">
        <h2 className="snippet-form-section-title">Preferences</h2>
        <form onSubmit={handleSaveSettings} noValidate className="snippet-form">
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
      </section>
    </main>
  );
}
