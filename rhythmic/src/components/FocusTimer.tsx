import { useState, useEffect } from "react"

interface Props {
  onStart?: () => void;
  onStop?: () => void;
}

export default function FocusTimer({ onStart, onStop }: Props) {

  const [time, setTime] = useState(1500)
  const [running, setRunning] = useState(false)

  useEffect(() => {

    if (!running) return

    const interval = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(interval)
          setRunning(false)
          if (onStop) onStop()
          return 0 // Stop at 0 as it's over
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)

  }, [running])

  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  return (
    <div className="flex flex-col items-center w-full">

      <div className="text-7xl font-light mb-10 font-mono tracking-wider drop-shadow-md flex items-center justify-center">
        <span>{String(minutes).padStart(2, "0")}</span>
        <span className="mx-1 pb-2 opacity-50">:</span>
        <span>{String(seconds).padStart(2, "0")}</span>
      </div>

      <div className="flex gap-4 w-full justify-center">

        <button
          className="flex-1 max-w-[120px] py-3 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm"
          onClick={() => {
            if (time === 0) setTime(1500)
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
            setTime(1500)
            if (onStop) onStop()
          }}
        >
          Reset
        </button>

      </div>

    </div>
  )
}
