interface Props {
    isOpen: boolean
    onConfirm: () => void
    onClose: () => void
}

export default function PomodoroWelcomeModal({ isOpen, onConfirm, onClose }: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.3s_ease]"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative z-10 max-w-sm w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">

                {/* Close X */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shadow-lg ring-1 ring-white/10">
                        🍅
                    </div>
                </div>

                {/* Heading */}
                <h2 className="text-white text-2xl font-bold text-center mb-2 tracking-tight drop-shadow">
                    Ready to focus?
                </h2>
                <p className="text-white/60 text-center text-sm leading-relaxed mb-8 px-2">
                    Structure your session with <span className="text-white font-semibold">Pomodoro Cycles</span>: focused work intervals and restful breaks.
                </p>

                {/* Cycle preview grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Focus</div>
                        <div className="text-white font-medium text-sm">25 Minutes</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Break</div>
                        <div className="text-white font-medium text-sm">5 Minutes</div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full py-4 rounded-2xl bg-white text-black font-semibold transition-all duration-300 hover:bg-white/90 active:scale-[0.98] shadow-xl shadow-white/5"
                    >
                        Start Pomodoro Sessions
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-medium transition-all duration-300 text-sm"
                    >
                        Continue Freely
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
