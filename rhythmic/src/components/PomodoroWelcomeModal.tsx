interface Props {
    onYes: () => void
    onNo: () => void
}

export default function PomodoroWelcomeModal({ onYes, onNo }: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.3s_ease]"
                onClick={onNo}
            />

            {/* Modal Card */}
            <div className="relative z-10 mx-4 max-w-sm w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">

                {/* Icon */}
                <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shadow-lg">
                        🍅
                    </div>
                </div>

                {/* Heading */}
                <h2 className="text-white text-2xl font-bold text-center mb-2 tracking-tight drop-shadow">
                    Ready to focus?
                </h2>
                <p className="text-white/70 text-center text-sm leading-relaxed mb-8">
                    Would you like to use <span className="text-white font-semibold">Pomodoro Cycles</span> to structure your session with focused work intervals and restful breaks?
                </p>

                {/* Cycle preview */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {["🎯 25m", "☕ 5m", "🎯 25m", "🌿 15m"].map((label, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <div className="text-xs text-white/80 font-medium">{label}</div>
                            {i < 3 && <div className="w-4 h-px bg-white/30 mt-1" />}
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onYes}
                        className="w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg backdrop-blur-sm"
                    >
                        Yes, use Pomodoro Cycles
                    </button>
                    <button
                        onClick={onNo}
                        className="w-full py-3 rounded-xl bg-transparent hover:bg-white/10 border border-white/10 text-white/60 hover:text-white/90 font-medium transition-all duration-300 text-sm"
                    >
                        No thanks, continue freely
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </div>
    )
}
