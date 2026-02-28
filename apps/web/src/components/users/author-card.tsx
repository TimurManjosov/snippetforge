'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicUser, UserStats } from '@/types/users';
import { getUserProfile, getUserStats } from '@/lib/users-api';
import { UserAvatar } from './user-avatar';
import { UserStatsBadges } from './user-stats-badges';

type AuthorCardProps = {
  userId: string;
  compact?: boolean;
};

export function AuthorCard({ userId, compact = false }: AuthorCardProps) {
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [p, s] = await Promise.all([
          getUserProfile(userId),
          getUserStats(userId),
        ]);
        if (!cancelled) {
          setProfile(p);
          setStats(s);
        }
      } catch {
        if (!cancelled) setError('Could not load author');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (error) {
    return (
      <div style={{ border: '1px solid #333', borderRadius: 12, padding: 12, opacity: 0.6 }}>
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ border: '1px solid #333', borderRadius: 12, padding: 12 }}>
        Loading author…
      </div>
    );
  }

  const name = profile.displayName || profile.username;

  return (
    <div style={{ border: '1px solid #333', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <UserAvatar
          username={profile.username}
          displayName={profile.displayName}
          avatarUrl={profile.avatarUrl}
          size={compact ? 36 : 48}
        />
        <div>
          <Link href={`/users/${profile.id}`} style={{ fontWeight: 700 }}>
            {name}
          </Link>
          <div style={{ opacity: 0.8 }}>@{profile.username}</div>
        </div>
      </div>

      {!compact && profile.bio && (
        <p style={{ marginTop: 10 }}>{profile.bio}</p>
      )}

      {!compact && stats && (
        <div style={{ marginTop: 10 }}>
          <UserStatsBadges stats={stats} />
        </div>
      )}
    </div>
  );
}
