'use client';

import React from 'react';
import type { UserStats } from '@/types/users';

type UserStatsBadgesProps = {
  stats: UserStats;
};

export function UserStatsBadges({ stats }: UserStatsBadgesProps) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <span>
        <strong>{stats.publicSnippetCount}</strong> public snippets
      </span>
      <span>
        <strong>{stats.commentCount}</strong> comments
      </span>
      {typeof stats.reactionGivenCount === 'number' && (
        <span>
          <strong>{stats.reactionGivenCount}</strong> reactions
        </span>
      )}
    </div>
  );
}
