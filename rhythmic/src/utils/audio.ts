// Singleton AudioContext — Chrome caps instances (~6 max); reusing prevents silent failures
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    if (!_audioCtx || _audioCtx.state === "closed") _audioCtx = new AC();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch { return null; }
}

export const playDing = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  } catch (e) { console.error("playDing failed", e); }
};

// Soft C-major synth chord for break transitions
export const playBreakChord = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const notes = [261.63, 329.63, 392.00]; // C4, E4, G4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.1 + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + 2.4);
    });
  } catch (e) { console.error("playBreakChord failed", e); }
};
// Drone nodes for break session
let _droneGain: GainNode | null = null;
let _droneOscs: OscillatorNode[] = [];

export const startBreakSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    stopBreakSound();
    const gain = ctx.createGain();
    _droneGain = gain;
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);

    const freqs = [110, 164.81, 220]; // A2, E3, A3
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.1 + i * 0.05, ctx.currentTime);
      lfoGain.gain.setValueAtTime(2, ctx.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      osc.connect(gain);
      osc.start();
      lfo.start();
      _droneOscs.push(osc, lfo);
    });
  } catch (e) { console.error("startBreakSound failed", e); }
};

export const stopBreakSound = () => {
  const ctx = getAudioCtx();
  if (_droneGain && ctx) {
    try {
      const g = _droneGain;
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      setTimeout(() => {
        _droneOscs.forEach(o => { try { o.stop(); } catch {} });
        _droneOscs = [];
        _droneGain = null;
      }, 1600);
    } catch (e) { console.error("stopBreakSound failed", e); }
  }
};
