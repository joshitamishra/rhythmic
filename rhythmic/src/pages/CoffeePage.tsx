import { useNavigate } from "react-router-dom"
import { BACKGROUNDS } from "../constants"

export default function CoffeePage() {
    const navigate = useNavigate()

    return (
        <div
            className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-cover bg-center"
            style={{
                backgroundImage: `url(${BACKGROUNDS[0]})`
            }}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div className="relative z-10 p-10 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col items-center text-center max-w-lg w-full mx-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 shadow-inner text-4xl">
                    ☕
                </div>

                <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-md tracking-tight">
                    Buy Us a Coffee
                </h1>

                <p className="text-white/80 text-lg leading-relaxed mb-8">
                    If you're enjoying Rhythmic and finding it helpful for your focus and productivity, consider supporting us! Your contribution helps keep the app running and improving.
                </p>

                <div className="mb-8 flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95">
                    <a
                        href="https://pages.razorpay.com/pl_SWXfLwNjb0ftzv/view"
                        target="_self"
                        rel="noopener noreferrer"
                        className="px-8 py-3.5 rounded-[4px] bg-[#528FF0] hover:bg-[#407ee0] text-white font-bold text-[15px] shadow-md transition-colors w-full max-w-[240px]"
                    >
                        Buy Us Coffee
                    </a>
                    <div className="flex items-center gap-1 px-2 py-0.5 mt-1 bg-white rounded-[4px] shadow-sm">
                        <span className="text-[10px] text-gray-500 font-medium">Powered by</span>
                        <span className="text-[10px] text-[#0A2540] font-black italic tracking-tight">Razorpay</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate("/")}
                    className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                >
                    Return Home
                </button>
            </div>
        </div>
    )
}
