import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import FlipCard from "../components/FlipCard"
import PomodoroWelcomeModal from "../components/PomodoroWelcomeModal"
import { BACKGROUNDS, getMusicThemeById, MUSIC_THEMES } from "../constants"



export default function HomePage() {
    const navigate = useNavigate()

    const [mode, setMode] = useState<"focus" | "stopwatch">("focus")
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [focusStartRequestId, setFocusStartRequestId] = useState(0)
    const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
        try {
            return localStorage.getItem("rhythmic_music_theme") ?? MUSIC_THEMES[0]?.id ?? "piano"
        } catch {
            return MUSIC_THEMES[0]?.id ?? "piano"
        }
    })
    const [bgIndex, setBgIndex] = useState(() => {
        const id = (() => {
            try {
                return localStorage.getItem("rhythmic_music_theme") ?? MUSIC_THEMES[0]?.id ?? "piano"
            } catch {
                return MUSIC_THEMES[0]?.id ?? "piano"
            }
        })()
        return getMusicThemeById(id).backgroundIndex ?? 0
    })
    const [isIdle, setIsIdle] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const idleTimerRef = useRef<number | null>(null)
    const selectedTheme = getMusicThemeById(selectedThemeId)
    const themeTracks = selectedTheme.tracks

    useEffect(() => {
        try {
            localStorage.setItem("rhythmic_music_theme", selectedThemeId)
        } catch {
            // ignore
        }
    }, [selectedThemeId])

    // When theme changes, keep the audio element in sync.
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        audio.src = themeTracks[0]
        audio.currentTime = 0
        audio.load()
    }, [selectedThemeId])

    // Show Pomodoro modal once per session
    useEffect(() => {
        const seen = sessionStorage.getItem("pomodoro_prompt_seen")
        if (!seen) {
            const t = setTimeout(() => setShowModal(true), 1000)
            return () => clearTimeout(t)
        }
    }, [])

    const handlePomodoroYes = () => {
        sessionStorage.setItem("pomodoro_prompt_seen", "true")
        setShowModal(false)
        navigate("/pomodoro")
    }

    const handlePomodoroNo = () => {
        sessionStorage.setItem("pomodoro_prompt_seen", "true")
        setShowModal(false)
    }

    const toggleMusic = async () => {
        const audio = audioRef.current
        if (!audio) return

        const shouldPlay = audio.paused || audio.ended
        if (!shouldPlay) {
            audio.pause()
            setIsPlaying(false)
            return
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

    const playSelectedTheme = async () => {
        const audio = audioRef.current
        if (!audio) return

        // Ensure the selected theme is loaded at the current index.
        const track = themeTracks[currentTrackIndex] ?? themeTracks[0]
        if (audio.src !== new URL(track, window.location.href).href) {
            audio.src = track
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

    const pauseMusic = () => {
        const audio = audioRef.current
        audio?.pause()
        setIsPlaying(false)
    }

    const selectTheme = async (themeId: string) => {
        setSelectedThemeId(themeId)
        setCurrentTrackIndex(0)

        const nextTheme = getMusicThemeById(themeId)
        // Theme selection re-links the background to the theme default.
        setBgIndex(nextTheme.backgroundIndex ?? 0)
        const nextTrack = nextTheme.tracks[0]
        const audio = audioRef.current
        if (audio) {
            audio.src = nextTrack
            audio.currentTime = 0
            audio.load()
        }
        await playSelectedTheme()

        // Theme selection should start the focus timer and play music automatically.
        if (mode === "focus") {
            setFocusStartRequestId((n) => n + 1)
        }
    }

    const handleTrackEnd = () => {
        const nextIndex = (currentTrackIndex + 1) % themeTracks.length;

        if (audioRef.current) {
            // Manually set src to ensure it changes in the same tick as the event
            // This is critical for mobile browsers to keep 'user gesture' trust
            audioRef.current.src = themeTracks[nextIndex];
            setCurrentTrackIndex(nextIndex);

            if (isPlaying) {
                audioRef.current.play().catch(e => {
                    console.error("Audio transition failed:", e);
                    setIsPlaying(false);
                });
            }
        }
    }

    const changeBackground = () => {
        setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length)
    }

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.4;
            if (isPlaying) {
                // Only call play if actually paused to avoid redundant interruptions
                if (audioRef.current.paused) {
                    audioRef.current.play().catch(e => {
                        console.error("Audio play failed:", e)
                        setIsPlaying(false) // Sync if blocked
                    });
                }
            } else {
                if (!audioRef.current.paused) {
                    audioRef.current.pause();
                }
            }
        }
    }, [currentTrackIndex, isPlaying, selectedThemeId])

    // Track mouse movement to hide UI automatically
    useEffect(() => {
        const handleMouseActivity = () => {
            setIsIdle(false)
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
            idleTimerRef.current = setTimeout(() => {
                setIsIdle(true)
            }, 3000)
        }

        window.addEventListener("mousemove", handleMouseActivity)
        window.addEventListener("mousedown", handleMouseActivity)
        window.addEventListener("keydown", handleMouseActivity)
        handleMouseActivity()

        return () => {
            window.removeEventListener("mousemove", handleMouseActivity)
            window.removeEventListener("mousedown", handleMouseActivity)
            window.removeEventListener("keydown", handleMouseActivity)
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        }
    }, [])

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center transition-all duration-700 relative"
            style={{ backgroundImage: BACKGROUNDS[bgIndex] }}
        >
            {/* Background Audio */}
            <audio
                ref={audioRef}
                src={themeTracks[currentTrackIndex]}
                onEnded={handleTrackEnd}
                onPause={() => {
                    // Only sync if the audio actually stopped (not just transitioning)
                    if (audioRef.current && !audioRef.current.seeking && audioRef.current.currentTime < audioRef.current.duration - 0.5) {
                        setIsPlaying(false);
                    }
                }}
                onPlay={() => setIsPlaying(true)}
                preload="auto"
            />

            {/* Welcome Modal */}
            {showModal && (
                <PomodoroWelcomeModal onYes={handlePomodoroYes} onNo={handlePomodoroNo} />
            )}

            {/* Controls Container */}
            <div
                className={`absolute top-6 right-6 z-20 flex flex-col items-end gap-3 transition-all duration-700 ease-in-out ${isIdle ? "opacity-0 translate-y-[-10px] pointer-events-none" : "opacity-100 translate-y-0"}`}
            >
                <div className="flex items-center gap-4">
                    {/* Pomodoro Nav Button */}
                    <button
                        onClick={() => navigate("/pomodoro")}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        <span className="text-base leading-none">🍅</span>
                        Pomodoro
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

                    {/* Background Toggle Button */}
                    <button
                        onClick={changeBackground}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Change Background
                    </button>

                    {/* Music Toggle Button */}
                    <button
                        onClick={toggleMusic}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pause Music
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Play Music
                            </>
                        )}
                    </button>
                </div>

                {/* Theme Picker */}
                <div className="flex flex-wrap justify-end gap-2 max-w-[520px]">
                    {MUSIC_THEMES.map(theme => {
                        const active = theme.id === selectedThemeId
                        return (
                            <button
                                key={theme.id}
                                onClick={() => void selectTheme(theme.id)}
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
                <h1 className="text-5xl font-bold mb-10 text-white drop-shadow-xl tracking-tight">
                    Rhythmic
                </h1>

                <FlipCard
                    mode={mode}
                    onTimerStart={playSelectedTheme}
                    onTimerStop={pauseMusic}
                    startRequestId={focusStartRequestId}
                />

                <button
                    className="mt-10 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white/90 font-medium transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md flex items-center gap-2"
                    onClick={() => setMode(mode === "focus" ? "stopwatch" : "focus")}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Flip to {mode === "focus" ? "Stopwatch" : "Focus"}
                </button>
            </div>
        </div>
    )
}
