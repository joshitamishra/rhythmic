import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FlipCard from './FlipCard';

// Mock components used inside FlipCard
vi.mock('./FocusTimer', () => ({
  default: () => <div data-testid="focus-timer">Focus Timer Mock</div>
}));

vi.mock('./Stopwatch', () => ({
  default: () => <div data-testid="stopwatch">Stopwatch Mock</div>
}));

describe('FlipCard', () => {
  it('renders FocusTimer when mode is "focus"', () => {
    render(<FlipCard mode="focus" />);
    expect(screen.getByTestId('focus-timer')).toBeInTheDocument();
    expect(screen.queryByTestId('stopwatch')).not.toBeInTheDocument();
  });

  it('renders Stopwatch when mode is "stopwatch"', () => {
    render(<FlipCard mode="stopwatch" />);
    expect(screen.getByTestId('stopwatch')).toBeInTheDocument();
    expect(screen.queryByTestId('focus-timer')).not.toBeInTheDocument();
  });
});
