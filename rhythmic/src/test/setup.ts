import '@testing-library/jest-dom';
import { vi } from 'vitest';

const createOscillatorMock = vi.fn().mockReturnValue({
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  type: 'sine',
  frequency: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
});

const createGainMock = vi.fn().mockReturnValue({
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  },
});

const MockAudioContext = vi.fn().mockImplementation(() => ({
  state: 'suspended',
  currentTime: 0,
  resume: vi.fn().mockResolvedValue(undefined),
  createOscillator: createOscillatorMock,
  createGain: createGainMock,
  destination: {},
  close: vi.fn(),
}));

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);

