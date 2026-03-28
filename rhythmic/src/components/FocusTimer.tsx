import { useState, useEffect } from "react"

interface Props {
  isPomodoro?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  onFocusComplete?: (cycle: number) => void;
  onFinish?: (minutes: number, type: string) => void;
  onSecondsChange?: (elapsed: number, total: number) => void;
  startRequestId?: number;
}

const playDing = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
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
  } catch (e) {
    console.error("Audio block failed", e);
  }
};

export default function FocusTimer({ isPomodoro, onStart, onStop, onFocusComplete, onFinish, onSecondsChange, startRequestId }: Props) {

  const FOCUS_TIME = 1500;
  const SHORT_BREAK_TIME = 300;
  const LONG_BREAK_TIME = 900;

  const [time, setTime] = useState(FOCUS_TIME)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<"focus" | "shortBreak" | "longBreak">("focus")
  const [cycle, setCycle] = useState(1)

  // Reset entirely when switching Pomodoro mode
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRunning(false)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("focus")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCycle(1)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(FOCUS_TIME)
  }, [isPomodoro])

  // External "start" requests (e.g. theme selection) should start the timer if not already running.
  useEffect(() => {
    if (!startRequestId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime((t) => {
      if (t === 0 && !isPomodoro) return FOCUS_TIME
      return t
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRunning((r) => {
      if (!r && onStart) onStart()
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startRequestId])

  useEffect(() => {
    if (!running) return

    const interval = setInterval(() => {
      setTime((t) => Math.max(0, t - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [running])

  useEffect(() => {
    if (!running) return

    if (phase === "focus" && onSecondsChange) {
      onSecondsChange(FOCUS_TIME - time, FOCUS_TIME)
    }

    if (time <= 0 && running) {
      playDing()

      if (isPomodoro) {
        if (phase === "focus") {
          const nextTime = cycle >= 4 ? LONG_BREAK_TIME : SHORT_BREAK_TIME
          setPhase(cycle >= 4 ? "longBreak" : "shortBreak")
          setRunning(false)
          setTime(nextTime)
          if (onStop) onStop()
          if (onFocusComplete) onFocusComplete(cycle)
          if (onFinish) onFinish(Math.ceil(FOCUS_TIME / 60), "focus")
        } else if (phase === "longBreak") {
          setCycle(1)
          setPhase("focus")
          setRunning(false)
          setTime(FOCUS_TIME)
          if (onStop) onStop()
          if (onFinish) onFinish(Math.ceil(LONG_BREAK_TIME / 60), "long_break")
        } else {
          setCycle(c => c + 1)
          setPhase("focus")
          setRunning(false)
          setTime(FOCUS_TIME)
          if (onStop) onStop()
          if (onFinish) onFinish(Math.ceil(SHORT_BREAK_TIME / 60), "short_break")
        }
      } else {
        setRunning(false)
        setTime(0)
        if (onStop) onStop()
        if (onFinish) onFinish(Math.ceil(FOCUS_TIME / 60), "focus")
      }
    }
  }, [time, running, isPomodoro, phase, cycle, onStop, onFocusComplete, onFinish, onSecondsChange, FOCUS_TIME, SHORT_BREAK_TIME, LONG_BREAK_TIME])

  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  return (
    <div className="flex flex-col items-center w-full">

      {isPomodoro && (
        <div className="mb-6 text-white/80 font-medium tracking-wide flex flex-col items-center">
          <span className="uppercase text-sm tracking-[0.2em] opacity-80 mb-2">
            {phase === "focus" ? "Focus" : phase === "shortBreak" ? "Short Break" : "Long Break"}
          </span>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= cycle && phase !== "longBreak" ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-white/20'
                  }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className={`text-7xl font-light font-mono tracking-wider drop-shadow-md flex items-center justify-center transition-all ${isPomodoro ? 'mb-8' : 'mb-12'}`}>
        <span>{String(minutes).padStart(2, "0")}</span>
        <span className="mx-1 pb-2 opacity-50">:</span>
        <span>{String(seconds).padStart(2, "0")}</span>
      </div>

      <div className="flex gap-4 w-full justify-center">

        <button
          className="flex-1 max-w-[120px] py-3 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm"
          onClick={() => {
            if (time === 0 && !isPomodoro) setTime(FOCUS_TIME)
            if (!running && onStart && (!isPomodoro || phase === "focus")) onStart()
            if (running && onStop) onStop()
            setRunning(!running)
          }}
        >
          {running ? "Pause" : "Start"}
        </button>

        <button
          className="flex-1 max-w-[120px] py-3 bg-black/20 hover:bg-black/40 border border-white/10 text-white/90 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm"
          onClick={() => {
            setRunning(false)
            setPhase("focus")
            setCycle(1)
            setTime(FOCUS_TIME)
            if (onStop) onStop()
          }}
        >
          Reset
        </button>

      </div>

    </div>
  )
}
