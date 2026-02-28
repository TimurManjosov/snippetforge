import { render, screen } from '@testing-library/react';
import { UserStatsBadges } from '../user-stats-badges';
import type { UserStats } from '@/types/users';

const baseStats: UserStats = {
  userId: 'u1',
  publicSnippetCount: 5,
  commentCount: 3,
};

describe('UserStatsBadges', () => {
  it('renders snippet and comment counts', () => {
    render(<UserStatsBadges stats={baseStats} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not render reactions when reactionGivenCount is undefined', () => {
    render(<UserStatsBadges stats={baseStats} />);
    expect(screen.queryByText(/reactions/i)).not.toBeInTheDocument();
  });

  it('renders reactions when reactionGivenCount is a number', () => {
    render(<UserStatsBadges stats={{ ...baseStats, reactionGivenCount: 7 }} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/reactions/i)).toBeInTheDocument();
  });
});
