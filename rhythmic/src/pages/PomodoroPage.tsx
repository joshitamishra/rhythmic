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
    // Ref so playSelectedTheme always reads the latest theme, avoids stale closures
    const themeIdRef = useRef(themeId)

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
        if (themeTracks.length > 1) {
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

        const latestTracks = getMusicThemeById(themeIdRef.current).tracks
        const track = latestTracks[currentTrackIndex] ?? latestTracks[0]
        const trackUrl = new URL(track, window.location.origin).href

        if (audio.src !== trackUrl) {
            audio.src = trackUrl
            audio.load()
            await new Promise<void>((resolve) => {
                const done = () => resolve()
                audio.addEventListener('canplay', done, { once: true })
                audio.addEventListener('error', done, { once: true })
                setTimeout(done, 1000) 
            })
        } else if (isPlaying && !audio.paused && !audio.ended) {
            // Already playing the correct track, avoid double play
            return
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

    const selectTheme = async (id: string) => {
        // Update ref synchronously FIRST so playSelectedTheme reads the correct theme
        themeIdRef.current = id
        setThemeId(id)
        setCurrentTrackIndex(0)
        setEvolveIndex(null)

        await playSelectedTheme()
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
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

            <audio
                ref={audioRef}
                src={themeTracks[currentTrackIndex]}
                onEnded={handleTrackEnd}
                loop={themeTracks.length === 1}
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

            {/* Single Top Panel - Unified & Centered */}
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[90%] sm:max-w-fit transition-all duration-700 ${isIdle ? "opacity-0 -translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"}`}>
                <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-[24px] bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all">
                    <button
                        onClick={changeBackground}
                        className="p-2 sm:p-3 rounded-2xl hover:bg-white/10 text-white/80 hover:text-white transition-all active:scale-90"
                        title="Change Background"
                    >
                        🖼️
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
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
                    <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
                    <button
                        onClick={() => window.open("/coffee", "_blank")}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl hover:bg-orange-500/20 text-orange-200/90 hover:text-orange-200 transition-all font-bold text-xs sm:text-sm"
                    >
                        <span>☕</span>
                        <span className="hidden sm:inline">Buy Us Coffee</span>
                    </button>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center w-full px-4 pt-12">
                <div className={`flex flex-col items-center transition-all duration-1000 ${isIdle ? "scale-110 translate-y-20" : "scale-100 translate-y-0"}`}>
                    <h1 className="text-6xl sm:text-8xl font-black mb-4 text-white drop-shadow-2xl tracking-tighter uppercase">Rhythm</h1>

                    <div className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                        <span className="text-base">🍅</span>
                        <span className="text-white/80 text-sm font-medium tracking-wide">Pomodoro Mode</span>
                    </div>

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

            {/* Bottom Toggle Hub - hide on idle */}
            <div className={`flex flex-wrap items-center justify-center gap-4 mt-12 mb-8 transition-all duration-700 ${isIdle ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100"}`}>
                <button
                    onClick={() => navigate("/?mode=timer")}
                    className="px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-bold transition-all duration-300 hover:scale-105 shadow-xl backdrop-blur-md flex items-center gap-2 text-sm"
                >
                    ⏱️ Timer
                </button>
                <button
                    onClick={() => navigate("/?mode=stopwatch")}
                    className="px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-bold transition-all duration-300 hover:scale-105 shadow-xl backdrop-blur-md flex items-center gap-2 text-sm"
                >
                    ⏱️ Stopwatch
                </button>
            </div>
        </div>
    )
}
