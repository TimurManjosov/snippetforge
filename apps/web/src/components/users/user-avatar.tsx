'use client';

import React from 'react';

type UserAvatarProps = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: number;
};

export function UserAvatar({ username, displayName, avatarUrl, size = 48 }: UserAvatarProps) {
  const label = (displayName || username || '?').trim();
  const initials = label.slice(0, 1).toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${label} avatar`}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: '999px', objectFit: 'cover' }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${label} avatar`}
      style={{
        width: size,
        height: size,
        borderRadius: '999px',
        display: 'grid',
        placeItems: 'center',
        background: '#2b2b2b',
        color: 'white',
        fontWeight: 700,
        fontSize: Math.max(12, size * 0.4),
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
