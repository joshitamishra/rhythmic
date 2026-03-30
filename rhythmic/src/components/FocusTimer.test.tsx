import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FocusTimer from './FocusTimer';
import * as audioUtils from '../utils/audio';

// Mock the audio utilities
vi.mock('../utils/audio', () => ({
    playDing: vi.fn(),
    playBreakChord: vi.fn(),
    startBreakSound: vi.fn(),
    stopBreakSound: vi.fn(),
}));

describe('FocusTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('renders the initial focus time', () => {
        render(<FocusTimer />);
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('00', { exact: false })).toBeInTheDocument();
    });

    it('starts and pauses the timer when the button is clicked', () => {
        const onStart = vi.fn();
        const onStop = vi.fn();
        render(<FocusTimer onStart={onStart} onStop={onStop} />);

        const startButton = screen.getByText('Start');
        fireEvent.click(startButton);

        expect(onStart).toHaveBeenCalled();
        expect(screen.getByText('Pause')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Pause'));
        expect(onStop).toHaveBeenCalled();
        expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('decrements time every second when running', () => {
        render(<FocusTimer />);
        const startButton = screen.getByText('Start');
        fireEvent.click(startButton);

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText('24')).toBeInTheDocument();
        expect(screen.getByText('59')).toBeInTheDocument();
    });

    it('resets the timer when reset button is clicked', () => {
        render(<FocusTimer />);
        const startButton = screen.getByText('Start');
        fireEvent.click(startButton);

        act(() => {
            vi.advanceTimersByTime(10000); // 10 seconds
        });

        fireEvent.click(screen.getByText('Reset'));

        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('00')).toBeInTheDocument();
        expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('switches between focus and break phases in Pomodoro mode', () => {
        const onFocusComplete = vi.fn();
        render(<FocusTimer isPomodoro={true} onFocusComplete={onFocusComplete} />);

        // Set to Focus phase
        expect(screen.getByText(/focus/i)).toBeInTheDocument();

        const startButton = screen.getByText('Start');
        fireEvent.click(startButton);

        // Advance past focus time (1500 seconds / 25 minutes)
        act(() => {
            vi.advanceTimersByTime(1500 * 1000);
        });

        expect(onFocusComplete).toHaveBeenCalledWith(1);
        expect(screen.getByText(/short break/i)).toBeInTheDocument();
        expect(screen.getByText('05')).toBeInTheDocument(); // Short break is 5 mins (300s)
    });

    it('plays both a ding and a break chord sound when focus session ends', () => {
        render(<FocusTimer isPomodoro={true} />);
        fireEvent.click(screen.getByText('Start'));

        // Advance past focus time
        act(() => {
            vi.advanceTimersByTime(1500 * 1000);
        });

        expect(audioUtils.playDing).toHaveBeenCalled();
        expect(audioUtils.playBreakChord).toHaveBeenCalled();
        // Break sound should NOT start automatically anymore
        expect(audioUtils.startBreakSound).not.toHaveBeenCalled();
    });

    it('plays a sound when a short break is completed to notify focus start', () => {
        render(<FocusTimer isPomodoro={true} />);
        fireEvent.click(screen.getByText('Start'));

        // 1. Complete Focus (1500s)
        act(() => {
            vi.advanceTimersByTime(1500 * 1000);
        });

        expect(screen.getByText(/short break/i)).toBeInTheDocument();
        vi.clearAllMocks();

        // 2. Start Break manually
        fireEvent.click(screen.getByText('Start'));
        expect(audioUtils.startBreakSound).toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(300 * 1000);
        });

        expect(audioUtils.playDing).toHaveBeenCalled();
        expect(audioUtils.stopBreakSound).toHaveBeenCalled();
        expect(screen.getByText(/focus/i)).toBeInTheDocument();
    });
});
