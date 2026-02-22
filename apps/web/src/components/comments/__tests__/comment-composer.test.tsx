import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CommentComposer from '../comment-composer';

describe('CommentComposer', () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    onSubmit.mockClear();
  });

  it('blocks empty body (min 1)', async () => {
    const user = userEvent.setup();
    render(<CommentComposer onSubmit={onSubmit} isLoggedIn={true} />);

    await user.click(screen.getByRole('button', { name: /comment/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Comment cannot be empty');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks whitespace-only body', async () => {
    const user = userEvent.setup();
    render(<CommentComposer onSubmit={onSubmit} isLoggedIn={true} />);

    const textarea = screen.getByLabelText('Comment');
    await user.type(textarea, '   ');
    await user.click(screen.getByRole('button', { name: /comment/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Comment cannot be empty');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks body > 5000 characters', async () => {
    const user = userEvent.setup();
    render(<CommentComposer onSubmit={onSubmit} isLoggedIn={true} />);

    const textarea = screen.getByLabelText('Comment');
    await user.click(textarea);
    // Use fireEvent for large paste to avoid slow typing
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(5001) } });
    await user.click(screen.getByRole('button', { name: /comment/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Comment must be at most 5000 characters');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const slowSubmit = jest.fn(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve; }),
    );

    render(<CommentComposer onSubmit={slowSubmit} isLoggedIn={true} />);

    const textarea = screen.getByLabelText('Comment');
    await user.type(textarea, 'Test comment');
    await user.click(screen.getByRole('button', { name: /comment/i }));

    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();

    resolveSubmit!();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /comment/i })).toBeEnabled(),
    );
  });

  it('shows login CTA and disables textarea when logged out', () => {
    render(<CommentComposer onSubmit={onSubmit} isLoggedIn={false} />);

    expect(screen.getByLabelText('Comment')).toBeDisabled();
    expect(screen.getByText('Log in to comment')).toHaveAttribute('href', '/login');
  });

  it('submits valid body and clears textarea', async () => {
    const user = userEvent.setup();
    render(<CommentComposer onSubmit={onSubmit} isLoggedIn={true} />);

    const textarea = screen.getByLabelText('Comment');
    await user.type(textarea, 'Hello world');
    await user.click(screen.getByRole('button', { name: /comment/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Hello world'));
    expect(textarea).toHaveValue('');
  });
});
