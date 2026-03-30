import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PomodoroPage from './PomodoroPage';

// Mock the API client
vi.mock('../api/client', () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
}));

// Mock window.Audio
const audioMock = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  src: '',
};
vi.stubGlobal('Audio', vi.fn().mockImplementation(() => audioMock));

// Need to mock URL.createObjectURL or similar if used, but here it's just new URL()
// Mock window.location.origin
vi.stubGlobal('location', { origin: 'http://localhost:3000' });

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
    clear: vi.fn(() => { store = {}; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

describe('PomodoroPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders the page title', () => {
    render(
      <MemoryRouter>
        <PomodoroPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Rhythm')).toBeInTheDocument();
  });

  it('changes theme when a theme button is clicked', async () => {
    render(
      <MemoryRouter>
        <PomodoroPage />
      </MemoryRouter>
    );

    const violinButton = screen.getByText(/violin/i);
    await act(async () => {
      fireEvent.click(violinButton);
    });

    expect(localStorage.getItem('preferred_theme_id')).toBe('violin');
    // It should also trigger play if it was already playing or just clicked
  });

  it('toggles music play/pause', async () => {
    render(
      <MemoryRouter>
        <PomodoroPage />
      </MemoryRouter>
    );

    const playButton = screen.getByText(/play music/i);
    await act(async () => {
      fireEvent.click(playButton);
    });

    expect(screen.getByText(/pause music/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText(/pause music/i));
    });
    expect(screen.getByText(/play music/i)).toBeInTheDocument();
  });

  it('detects idle state', async () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <PomodoroPage />
      </MemoryRouter>
    );

    // Initial state should not be idle
    const topPanel = screen.getByTitle(/change background/i).closest('div');
    expect(topPanel?.parentElement).not.toHaveClass('opacity-0');

    // Fast-forward 7 seconds (idle threshold is 6s)
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    // Check for idle class
    const topPanelAfter = screen.getByTitle(/change background/i).closest('.absolute');
    expect(topPanelAfter).toHaveClass('opacity-0');

    vi.useRealTimers();
  });
});
