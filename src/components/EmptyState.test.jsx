import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState.jsx';

describe('EmptyState', () => {
  it('renders the invitation and example chips', () => {
    render(<EmptyState onPick={() => {}} />);
    expect(screen.getByText(/try an example/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3);
  });

  it('calls onPick with the example password when a chip is clicked', async () => {
    const onPick = vi.fn();
    render(<EmptyState onPick={onPick} />);
    await userEvent.click(screen.getByRole('button', { name: /password123/ }));
    expect(onPick).toHaveBeenCalledWith('password123');
  });
});
