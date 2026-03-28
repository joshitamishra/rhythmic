import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import FlipCard from "../components/FlipCard"
import PomodoroWelcomeModal from "../components/PomodoroWelcomeModal"
import { BACKGROUNDS, getMusicThemeById, MUSIC_THEMES } from "../constants"
import { apiFetch } from "../api/client"

export default function HomePage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [mode, setMode] = useState<"focus" | "stopwatch">("focus")
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [focusStartRequestId, setFocusStartRequestId] = useState(0)
    const [selectedThemeId, setSelectedThemeId] = useState(() => localStorage.getItem("preferred_theme_id") || "piano")

    const [bgIndex, setBgIndex] = useState(() => {
        const saved = localStorage.getItem("preferred_bg_index")
        return saved !== null ? Number(saved) : 0
    })

    const audioRef = useRef<HTMLAudioElement>(null)
    const [isIdle, setIsIdle] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
    const [evolveIndex, setEvolveIndex] = useState<number | null>(null)

    const idleTimerRef = useRef<number | null>(null)

    const currentTheme = getMusicThemeById(selectedThemeId)
    const themeTracks = currentTheme.tracks

    useEffect(() => {
        localStorage.setItem("preferred_theme_id", selectedThemeId)
        localStorage.setItem("preferred_bg_index", bgIndex.toString())
    }, [selectedThemeId, bgIndex])

    const handlePomodoroYes = () => {
        setShowModal(false)
        navigate("/pomodoro")
    }

    const handlePomodoroNo = () => {
        setShowModal(false)
    }

    const toggleMusic = () => {
        if (isPlaying) {
            pauseMusic()
        } else {
            void playSelectedTheme()
        }
    }

    const playSelectedTheme = async () => {
        const audio = audioRef.current
        if (!audio) return

        const track = themeTracks[currentTrackIndex] ?? themeTracks[0]
        const trackUrl = new URL(track, window.location.origin).href
        if (audio.src !== trackUrl) {
            audio.src = trackUrl
            audio.load()
        }

        if (audio.ended || (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration - 0.25)) {
            audio.currentTime = 0
        }

        try {
            await audio.play()
            setIsPlaying(true)
        } catch (e) {
            console.error("Audio play failed:", e)
            setIsPlaying(false)
        }
    }

    const pauseMusic = () => {
        const audio = audioRef.current
        audio?.pause()
        setIsPlaying(false)
    }

    const recordSession = (minutes: number, type: string) => {
        apiFetch("/api/sessions", {
            method: "POST",
            body: JSON.stringify({ minutes, type })
        }).catch((err: any) => console.error("Failed to record session:", err));
    }

    const selectTheme = async (themeId: string) => {
        setSelectedThemeId(themeId)
        setCurrentTrackIndex(0)
        setEvolveIndex(null) // Reset evolution when manually switching themes

        const nextTheme = getMusicThemeById(themeId)
        setBgIndex(nextTheme.backgroundIndex ?? 0)

        if (mode === "focus") {
            setFocusStartRequestId(n => n + 1)
        }
    }

    const handleSecondsChange = (elapsed: number, total: number) => {
        const theme = getMusicThemeById(selectedThemeId)
        if (!theme.evolution) {
            if (evolveIndex !== null) setEvolveIndex(null)
            return
        }

        // Calculate stage (0-3) based on percentage
        const percent = (elapsed / total) * 100
        let stage = 0
        if (percent > 75) stage = 3
        else if (percent > 50) stage = 2
        else if (percent > 25) stage = 1

        if (stage !== evolveIndex) {
            setEvolveIndex(stage)
        }
    }

    useEffect(() => {
        if (isPlaying) {
            void playSelectedTheme()
        }
    }, [currentTrackIndex])

    const handleTrackEnd = () => {
        if (themeTracks.length <= 1) {
            void playSelectedTheme()
        } else {
            const next = (currentTrackIndex + 1) % themeTracks.length
            setCurrentTrackIndex(next)
        }
    }

    useEffect(() => {
        const handleActivity = () => {
            setIsIdle(false)
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
            idleTimerRef.current = window.setTimeout(() => {
                setIsIdle(true)
            }, 6000)
        }

        window.addEventListener("mousemove", handleActivity)
        window.addEventListener("keydown", handleActivity)
        handleActivity()

        return () => {
            window.removeEventListener("mousemove", handleActivity)
            window.removeEventListener("keydown", handleActivity)
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
        }
    }, [])

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search)
        if (queryParams.get("payment") === "success") {
            setShowPaymentSuccess(true)
            setTimeout(() => {
                setShowPaymentSuccess(false)
                navigate(location.pathname, { replace: true }) // clear query params
            }, 6000)
        }
    }, [location.search, location.pathname, navigate])

    return (
        <div
            className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out bg-cover bg-center"
            style={{
                backgroundImage: evolveIndex !== null && currentTheme.evolution
                    ? BACKGROUNDS[currentTheme.evolution[evolveIndex]]
                    : BACKGROUNDS[bgIndex]
            }}
        >
            <div className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-1000 ${isIdle ? "opacity-40" : "opacity-100"}`} />

            <audio
                ref={audioRef}
                src={themeTracks[currentTrackIndex]}
                onEnded={handleTrackEnd}
                onPause={() => {
                    if (audioRef.current && !audioRef.current.seeking && audioRef.current.currentTime < audioRef.current.duration - 0.5) {
                        setIsPlaying(false)
                    }
                }}
                onPlay={() => setIsPlaying(true)}
                preload="auto"
            />

            <AnimatePresence>
                {showPaymentSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="fixed bottom-12 z-50 px-8 py-6 rounded-3xl bg-orange-500/10 backdrop-blur-2xl border border-orange-500/20 shadow-2xl flex flex-col items-center text-center max-w-sm"
                    >
                        <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                            <span className="text-2xl">☕</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Thank You!</h3>
                        <p className="text-white/80 text-sm leading-relaxed">
                            Your payment was successful. We deeply appreciate your support for Rhythmic!
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`absolute top-6 right-6 z-20 flex flex-col items-end gap-3 transition-all duration-700 ease-in-out ${isIdle ? "opacity-0 translate-y-[-10px] pointer-events-none" : "opacity-100 translate-y-0"}`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.open("/coffee", "_blank")}
                        className="px-4 py-2 rounded-full bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/30 text-orange-100 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        Buy Us Coffee ☕
                    </button>
                    <button
                        onClick={() => navigate("/profile")}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => navigate("/insights")}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        Insights
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        Pomodoro Mode
                    </button>
                    <button
                        onClick={() => setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length)}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        Change Background
                    </button>
                    <button
                        onClick={toggleMusic}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? "Pause Music" : "Play Music"}
                    </button>
                </div>

                <div className="flex flex-wrap justify-end gap-2 max-w-[520px]">
                    {MUSIC_THEMES.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => selectTheme(theme.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-md border ${theme.id === selectedThemeId ? "bg-white/25 text-white border-white/30 shadow-lg" : "bg-white/10 text-white/80 border-white/20 hover:bg-white/15 hover:text-white"}`}
                        >
                            {theme.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center w-full px-4">
                <h1 className="text-5xl font-bold mb-10 text-white drop-shadow-xl tracking-tight">Rhythmic</h1>
                <FlipCard
                    mode={mode}
                    onTimerStart={playSelectedTheme}
                    onTimerStop={pauseMusic}
                    onFinish={recordSession}
                    onSecondsChange={handleSecondsChange}
                    startRequestId={focusStartRequestId}
                />
                <button
                    className="mt-10 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white/90 font-medium transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md flex items-center gap-2"
                    onClick={() => setMode(mode === "focus" ? "stopwatch" : "focus")}
                >
                    Flip to {mode === "focus" ? "Stopwatch" : "Focus"}
                </button>
            </div>

            <PomodoroWelcomeModal
                isOpen={showModal}
                onClose={handlePomodoroNo}
                onConfirm={handlePomodoroYes}
            />
        </div>
    )
}
