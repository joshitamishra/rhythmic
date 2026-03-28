import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { BACKGROUNDS } from "../constants"

export default function CoffeePage() {
    const navigate = useNavigate()

    useEffect(() => {
        const d = document
        const scriptId = 'razorpay-embed-btn-js'
        const existingScript = d.getElementById(scriptId)

        if (!existingScript) {
            const s = d.createElement('script')
            s.defer = true
            s.id = scriptId
            s.src = 'https://cdn.razorpay.com/static/embed_btn/bundle.js'
            d.body.appendChild(s)
        } else {
            const rzp = (window as any)['__rzp__']
            if (rzp && rzp.init) rzp.init()
        }
    }, [])

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

                <div className="mb-8 overflow-hidden rounded-xl transition-all hover:scale-105 active:scale-95">
                    <div
                        className="razorpay-embed-btn"
                        data-url="https://pages.razorpay.com/pl_SWXfLwNjb0ftzv/view"
                        data-text="Buy Us Coffee"
                        data-color="#528FF0"
                        data-size="large"
                    />
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
