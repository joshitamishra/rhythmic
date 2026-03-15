import { useState, useEffect } from "react"

export default function Stopwatch() {

  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {

    if (!running) return

    const interval = setInterval(() => {
      setTime((t) => t + 10)
    }, 10)

    return () => clearInterval(interval)

  }, [running])

  const seconds = (time / 1000).toFixed(2)

  return (
    <div className="flex flex-col items-center w-full">

      <div className="text-7xl font-light mb-10 font-mono tracking-wider drop-shadow-md">
        {seconds}
      </div>

      <button
        className={`w-36 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm ${running
            ? "bg-red-500/80 hover:bg-red-500 text-white shadow-red-500/20"
            : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
          }`}
        onClick={() => setRunning(!running)}
      >
        {running ? "Stop" : "Start"}
      </button>

    </div>
  )
}
