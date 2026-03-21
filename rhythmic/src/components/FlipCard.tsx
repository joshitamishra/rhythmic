import FocusTimer from "./FocusTimer"
import Stopwatch from "./Stopwatch"

type Props = {
  mode: "focus" | "stopwatch"
  isPomodoro?: boolean
  onTimerStart?: () => void
  onTimerStop?: () => void
  onFocusComplete?: (cycle: number) => void
  onFinish?: (minutes: number, type: string) => void
  onSecondsChange?: (elapsed: number, total: number) => void
  startRequestId?: number
}

export default function FlipCard({ mode, isPomodoro, onTimerStart, onTimerStop, onFocusComplete, onFinish, onSecondsChange, startRequestId }: Props) {

  return (
    <div className="w-80 h-80 bg-transparent flex items-center justify-center text-white transition-all duration-500 overflow-hidden relative">

      <div className="relative z-10 w-full flex items-center justify-center p-6">
        {mode === "focus" ? (
          <FocusTimer
            isPomodoro={isPomodoro}
            onStart={onTimerStart}
            onStop={onTimerStop}
            onFocusComplete={onFocusComplete}
            onFinish={onFinish}
            onSecondsChange={onSecondsChange}
            startRequestId={startRequestId}
          />
        ) : (
          <Stopwatch />
        )}
      </div>
    </div>
  )
}
