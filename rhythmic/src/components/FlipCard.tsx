import FocusTimer from "./FocusTimer"
import Stopwatch from "./Stopwatch"

type Props = {
  mode: "focus" | "stopwatch"
  isPomodoro?: boolean
  onTimerStart?: () => void
  onTimerStop?: () => void
}

export default function FlipCard({ mode, isPomodoro, onTimerStart, onTimerStop }: Props) {

  return (
    <div className="w-80 h-80 bg-transparent flex items-center justify-center text-white transition-all duration-500 overflow-hidden relative">

      <div className="relative z-10 w-full flex items-center justify-center p-6">
        {mode === "focus" ? <FocusTimer isPomodoro={isPomodoro} onStart={onTimerStart} onStop={onTimerStop} /> : <Stopwatch />}
      </div>
    </div>
  )
}
