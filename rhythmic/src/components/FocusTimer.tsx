import { useState, useEffect } from "react"

interface Props {
  isPomodoro?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  startRequestId?: number;
}

export default function FocusTimer({ isPomodoro, onStart, onStop, startRequestId }: Props) {

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
  }, [startRequestId, isPomodoro, onStart])

  useEffect(() => {

    if (!running) return

    const interval = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(interval)

          if (isPomodoro) {
            if (phase === "focus") {
              // Focus phase done → stop music, auto-start the break countdown silently
              const nextTime = cycle >= 4 ? LONG_BREAK_TIME : SHORT_BREAK_TIME
              setPhase(cycle >= 4 ? "longBreak" : "shortBreak")
              setRunning(true)     // break timer ticks automatically
              if (onStop) onStop() // music off during break
              return nextTime
            } else {
              if (phase === "longBreak") {
                // Full 4-cycle Pomodoro done — stop everything, wait for user
                setCycle(1)
                setPhase("focus")
                setRunning(false)
                if (onStop) onStop()
                return FOCUS_TIME
              } else {
                // Short break done → auto-start next focus AND resume music
                setCycle(c => c + 1)
                setPhase("focus")
                setRunning(true)
                if (onStart) onStart() // music resumes with focus
                return FOCUS_TIME
              }
            }
          }

          // Non-pomodoro focus timer: stop at 0
          setRunning(false)
          if (onStop) onStop()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)

  }, [running, isPomodoro, phase, cycle, onStart, onStop]) // Depend on cycle and phase so the closure is fresh

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
            if (!running && onStart) onStart()
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
