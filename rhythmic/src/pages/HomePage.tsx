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

        // Force playback on theme change
        setTimeout(() => {
            void playSelectedTheme()
        }, 100)

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
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const paramMode = params.get("mode")
        if (paramMode === "stopwatch") setMode("stopwatch")
        if (paramMode === "timer") setMode("focus")
    }, [location.search])

    useEffect(() => {
        const checkMobile = () => { /* Not needed for current layout */ }
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    return (
        <div
            className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden transition-all duration-1000 ease-in-out bg-cover bg-center"
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

            {/* Single Top Panel - Unified & Centered */}
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[90%] sm:max-w-fit transition-all duration-700 ${isIdle ? "opacity-0 -translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"}`}>
                <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-[24px] bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all">
                    <button
                        onClick={() => setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length)}
                        className="p-2 sm:p-3 rounded-2xl hover:bg-white/10 text-white/80 hover:text-white transition-all active:scale-90"
                        title="Change Background"
                    >
                        🖼️
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
                    <button
                        onClick={() => window.open("/coffee", "_blank")}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl hover:bg-orange-500/20 text-orange-200/90 hover:text-orange-200 transition-all font-bold text-xs sm:text-sm"
                    >
                        <span>☕</span>
                        <span className="hidden sm:inline">Buy Us Coffee</span>
                    </button>
                    <button
                        onClick={() => navigate("/profile")}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl hover:bg-white/10 text-white/80 hover:text-white transition-all font-bold text-xs sm:text-sm"
                    >
                        <span>👤</span>
                        <span className="hidden sm:inline">Profile</span>
                    </button>
                    <button
                        onClick={() => navigate("/insights")}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl hover:bg-white/10 text-white/80 hover:text-white transition-all font-bold text-xs sm:text-sm"
                    >
                        <span>📊</span>
                        <span className="hidden sm:inline">Insights</span>
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
                    <button
                        onClick={toggleMusic}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl hover:bg-white/10 text-white/80 hover:text-white transition-all font-bold text-xs sm:text-sm"
                    >
                        <span>{isPlaying ? "⏸️" : "▶️"}</span>
                        <span className="hidden sm:inline">{isPlaying ? "Pause Music" : "Play Music"}</span>
                    </button>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center w-full px-4 pt-12">
                <div className={`flex flex-col items-center transition-all duration-1000 ${isIdle ? "scale-110 translate-y-20" : "scale-100 translate-y-0"}`}>
                    <h1 className="text-6xl sm:text-8xl font-black mb-6 text-white drop-shadow-2xl tracking-tighter">Rhythmic</h1>

                    {/* Centered Theme Pill - prevents overlap - hide on idle */}
                    <div className={`flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-3xl bg-black/20 backdrop-blur-3xl border border-white/10 mb-8 shadow-2xl transition-all duration-700 ${isIdle ? "opacity-0 pointer-events-none -translate-y-2 text-transparent" : "opacity-100"}`}>
                        {MUSIC_THEMES.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => selectTheme(theme.id)}
                                className={`px-5 py-2 rounded-[20px] text-sm font-bold transition-all duration-300 ${theme.id === selectedThemeId ? "bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.3)] scale-105" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                            >
                                {theme.name}
                            </button>
                        ))}
                    </div>

                </div>

                <FlipCard
                    mode={mode}
                    onTimerStart={playSelectedTheme}
                    onTimerStop={pauseMusic}
                    onFinish={recordSession}
                    onSecondsChange={handleSecondsChange}
                    startRequestId={focusStartRequestId}
                />

                {/* Bottom Toggle Hub - hide on idle */}
                <div className={`flex flex-wrap items-center justify-center gap-4 mt-12 mb-8 transition-all duration-700 ${isIdle ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100"}`}>
                    <button
                        className="px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-bold transition-all duration-300 hover:scale-105 shadow-xl backdrop-blur-md flex items-center gap-2 text-sm"
                        onClick={() => setMode(mode === "focus" ? "stopwatch" : "focus")}
                    >
                        🔄 {mode === "focus" ? "Stopwatch" : "Timer"}
                    </button>
                    <button
                        className="px-6 py-2.5 rounded-2xl bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/30 text-orange-200 font-bold transition-all duration-300 hover:scale-105 shadow-xl backdrop-blur-md flex items-center gap-2 text-sm"
                        onClick={() => navigate("/pomodoro")}
                    >
                        🍅 Pomodoro
                    </button>
                </div>
            </div>

            <PomodoroWelcomeModal
                isOpen={showModal}
                onClose={handlePomodoroNo}
                onConfirm={handlePomodoroYes}
            />
        </div>
    )
}
