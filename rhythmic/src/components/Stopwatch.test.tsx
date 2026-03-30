import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Stopwatch from './Stopwatch';

describe('Stopwatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders initial state', () => {
    render(<Stopwatch />);
    expect(screen.getByText('0.00')).toBeInTheDocument();
  });

  it('starts and stops when clicked', () => {
    render(<Stopwatch />);
    const button = screen.getByRole('button', { name: /start/i });
    
    fireEvent.click(button);
    expect(screen.getByText(/stop/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/stop/i));
    expect(screen.getByText(/start/i)).toBeInTheDocument();
  });

  it('increments time when running', () => {
    render(<Stopwatch />);
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });
});
