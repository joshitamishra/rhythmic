import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import FocusTimer from "../components/FocusTimer"
import { MUSIC_THEMES, BACKGROUNDS, getMusicThemeById } from "../constants"
import { apiFetch } from "../api/client"

export default function PomodoroPage() {
    const navigate = useNavigate()

    // State
    const [themeId, setThemeId] = useState(() => localStorage.getItem("preferred_theme_id") || "piano")
    const [bgIndex, setBgIndex] = useState(() => Number(localStorage.getItem("preferred_bg_index")) || 0)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isIdle, setIsIdle] = useState(false)
    const [focusStartRequestId, setFocusStartRequestId] = useState(0)
    const [showAchievement, setShowAchievement] = useState<{ title: string, msg: string } | null>(null)
    const [evolveIndex, setEvolveIndex] = useState<number | null>(null)

    const audioRef = useRef<HTMLAudioElement>(null)
    const idleTimerRef = useRef<number | null>(null)

    const selectedThemeId = themeId || "piano"
    const currentTheme = getMusicThemeById(selectedThemeId)
    const themeTracks = currentTheme.tracks

    // Settings persistence
    useEffect(() => {
        localStorage.setItem("preferred_theme_id", selectedThemeId)
        localStorage.setItem("preferred_bg_index", bgIndex.toString())
    }, [selectedThemeId, bgIndex])

    // Idle detection
    useEffect(() => {
        const handleActivity = () => {
            setIsIdle(false)
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
            idleTimerRef.current = window.setTimeout(() => setIsIdle(true), 6000)
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

    const pauseMusic = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
        }
    }

    const recordSession = (minutes: number, type: string) => {
        apiFetch("/api/sessions", {
            method: "POST",
            body: JSON.stringify({ minutes, type })
        }).catch((err: any) => console.error("Failed to record session:", err));
    }

    const playSelectedTheme = async () => {
        const audio = audioRef.current
        if (!audio) return

        // Ensure the selected theme is loaded at the current index.
        const track = themeTracks[currentTrackIndex] ?? themeTracks[0]
        const trackUrl = new URL(track, window.location.origin).href
        if (audio.src !== trackUrl) {
            audio.src = trackUrl
            audio.load()
        }

        // Recover from "ended" / near-end state so play always restarts.
        if (
            audio.ended ||
            (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration - 0.25)
        ) {
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

    const toggleMusic = () => {
        if (isPlaying) pauseMusic()
        else void playSelectedTheme()
    }

    const selectTheme = (id: string) => {
        setThemeId(id)
        setCurrentTrackIndex(0)
        setEvolveIndex(null) // Reset when switching manually
        // Request a start if already running
        setFocusStartRequestId(prev => prev + 1)
    }

    const handleSecondsChange = (elapsed: number, total: number) => {
        const theme = getMusicThemeById(selectedThemeId)
        if (!theme.evolution) {
            if (evolveIndex !== null) setEvolveIndex(null)
            return
        }

        const percent = (elapsed / total) * 100
        let stage = 0
        if (percent > 75) stage = 3
        else if (percent > 50) stage = 2
        else if (percent > 25) stage = 1

        if (stage !== evolveIndex) {
            setEvolveIndex(stage)
        }
    }

    const changeBackground = () => {
        setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length)
    }

    const handleFocusComplete = (cycle: number) => {
        if (cycle === 4) {
            setShowAchievement({
                title: "Cycle Master! 🏆",
                msg: "You've successfully completed a full Pomodoro cycle. Your focus is extraordinary!"
            })
        } else {
            setShowAchievement({
                title: "Focus Complete! ✨",
                msg: `Session ${cycle} done. Take a well-deserved break!`
            })
        }
        setTimeout(() => setShowAchievement(null), 6000)
    }

    return (
        <div
            className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out bg-cover bg-center"
            style={{
                backgroundImage: evolveIndex !== null && currentTheme.evolution
                    ? BACKGROUNDS[currentTheme.evolution[evolveIndex]]
                    : BACKGROUNDS[bgIndex]
            }}
        >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

            <audio
                ref={audioRef}
                src={themeTracks[currentTrackIndex]}
                onEnded={handleTrackEnd}
                onPause={() => {
                    if (audioRef.current && !audioRef.current.seeking && audioRef.current.currentTime < audioRef.current.duration - 0.5) {
                        setIsPlaying(false);
                    }
                }}
                onPlay={() => setIsPlaying(true)}
                preload="auto"
            />

            {/* Achievement Toast */}
            <AnimatePresence>
                {showAchievement && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="fixed bottom-12 z-50 px-8 py-6 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col items-center text-center max-w-sm"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                            <span className="text-2xl">✨</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{showAchievement.title}</h3>
                        <p className="text-white/70 text-sm leading-relaxed">{showAchievement.msg}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top-right controls */}
            <div
                className={`absolute top-6 right-6 z-20 flex flex-col items-end gap-3 transition-all duration-700 ease-in-out ${isIdle ? "opacity-0 translate-y-[-10px] pointer-events-none" : "opacity-100 translate-y-0"}`}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.open("/coffee", "_blank")}
                        className="px-4 py-2 rounded-full bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/30 text-orange-100 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        Buy Us Coffee ☕
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        Home
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
                        onClick={changeBackground}
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
                    {MUSIC_THEMES.map(theme => {
                        const active = theme.id === selectedThemeId
                        return (
                            <button
                                key={theme.id}
                                onClick={() => selectTheme(theme.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-md border ${active
                                    ? "bg-white/25 text-white border-white/30 shadow-lg"
                                    : "bg-white/10 text-white/80 border-white/20 hover:bg-white/15 hover:text-white"
                                    }`}
                            >
                                {theme.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center w-full px-4">
                <div className="flex flex-col items-center mb-10">
                    <h1 className="text-5xl font-bold text-white drop-shadow-xl tracking-tight">Rhythmic</h1>
                    <div className="flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                        <span className="text-base">🍅</span>
                        <span className="text-white/80 text-sm font-medium tracking-wide">Pomodoro Mode</span>
                    </div>
                </div>

                <div className="w-80 text-white flex items-center justify-center">
                    <div className="w-full flex items-center justify-center p-6">
                        <FocusTimer
                            isPomodoro={true}
                            onStart={playSelectedTheme}
                            onStop={pauseMusic}
                            onFocusComplete={handleFocusComplete}
                            onFinish={recordSession}
                            onSecondsChange={handleSecondsChange}
                            startRequestId={focusStartRequestId}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
