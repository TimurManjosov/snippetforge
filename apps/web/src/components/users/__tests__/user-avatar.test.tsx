import { render, screen } from '@testing-library/react';
import { UserAvatar } from '../user-avatar';

describe('UserAvatar', () => {
  it('renders img when avatarUrl is provided', () => {
    render(<UserAvatar username="alice" avatarUrl="https://example.com/a.png" />);
    expect(screen.getByRole('img', { name: /alice avatar/i })).toHaveAttribute(
      'src',
      'https://example.com/a.png'
    );
  });

  it('renders initials fallback when avatarUrl is null', () => {
    render(<UserAvatar username="bob" avatarUrl={null} />);
    expect(screen.getByRole('img', { name: /bob avatar/i })).toHaveTextContent('B');
  });

  it('uses displayName for label and initial when provided', () => {
    render(<UserAvatar username="bob" displayName="Bob Smith" avatarUrl={null} />);
    expect(screen.getByRole('img', { name: /bob smith avatar/i })).toHaveTextContent('B');
  });
});
