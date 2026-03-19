import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import FocusTimer from "../components/FocusTimer"
import { PLAYLIST, BACKGROUNDS } from "../constants"

export default function PomodoroPage() {
    const navigate = useNavigate()
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [bgIndex, setBgIndex] = useState(0)
    const [isIdle, setIsIdle] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const idleTimerRef = useRef<number | null>(null)

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

    const handleTrackEnd = () => {
        const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;

        if (audioRef.current) {
            audioRef.current.src = PLAYLIST[nextIndex];
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
    }, [currentTrackIndex, isPlaying])

    // Idle detection — same as HomePage
    useEffect(() => {
        const handleActivity = () => {
            setIsIdle(false)
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
            idleTimerRef.current = setTimeout(() => setIsIdle(true), 3000)
        }
        window.addEventListener("mousemove", handleActivity)
        window.addEventListener("mousedown", handleActivity)
        window.addEventListener("keydown", handleActivity)
        handleActivity()
        return () => {
            window.removeEventListener("mousemove", handleActivity)
            window.removeEventListener("mousedown", handleActivity)
            window.removeEventListener("keydown", handleActivity)
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        }
    }, [])

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center relative transition-all duration-700"
            style={{ backgroundImage: BACKGROUNDS[bgIndex] }}
        >
            {/* Background Audio */}
            <audio
                ref={audioRef}
                src={PLAYLIST[currentTrackIndex]}
                onEnded={handleTrackEnd}
                onPause={() => {
                    if (audioRef.current && !audioRef.current.seeking && audioRef.current.currentTime < audioRef.current.duration - 0.5) {
                        setIsPlaying(false);
                    }
                }}
                onPlay={() => setIsPlaying(true)}
                preload="auto"
            />

            {/* Top-right controls — same style as HomePage, idle-hiding */}
            <div
                className={`absolute top-6 right-6 z-20 flex items-center gap-4 transition-all duration-700 ease-in-out ${isIdle ? "opacity-0 translate-y-[-10px] pointer-events-none" : "opacity-100 translate-y-0"}`}
            >
                {/* Go to Home */}
                <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                </button>

                {/* Change Background */}
                <button
                    onClick={changeBackground}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Change Background
                </button>

                {/* Music Toggle */}
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

            {/* Main Content */}
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
                            onStart={() => !isPlaying && setIsPlaying(true)}
                            onStop={() => isPlaying && setIsPlaying(false)}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
