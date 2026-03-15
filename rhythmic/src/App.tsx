import { useState, useRef, useEffect } from "react"
import FlipCard from "./components/FlipCard"

const PLAYLIST = [
  "/piano1.mp3",
  "/piano2.mp3",
  "/piano3.mp3",
  "/piano4.mp3"
];

const BACKGROUNDS = [
  "url('/alps_better.png')",
  "url('/beach_sunset_better.png')",
  "url('/milky_way_better.png')",
  "url('/dark_abstract_better.png')",
  "url('/colours.png')",
  "url('/Serene%20afternoon%20in%20the%20Swiss%20Alps.png')"
];

function App() {

  const [mode, setMode] = useState<"focus" | "stopwatch">("focus")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [bgIndex, setBgIndex] = useState(0)
  const [isIdle, setIsIdle] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const idleTimerRef = useRef<number | null>(null)

  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play().catch(e => console.error("Audio play failed:", e))
    }
    setIsPlaying(!isPlaying)
  }



  const handleTrackEnd = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length)
  }

  const changeBackground = () => {
    setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length)
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrackIndex, isPlaying])

  // Track mouse movement to hide UI automatically
  useEffect(() => {
    const handleMouseActivity = () => {
      setIsIdle(false)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true)
      }, 3000) // Hide after 3 seconds of keeping the mouse still
    }

    window.addEventListener("mousemove", handleMouseActivity)
    window.addEventListener("mousedown", handleMouseActivity)
    window.addEventListener("keydown", handleMouseActivity)

    // Start timer on mount
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
        src={PLAYLIST[currentTrackIndex]}
        onEnded={handleTrackEnd}
        autoPlay={isPlaying}
      />

      {/* Controls Container */}
      <div
        className={`absolute top-6 right-6 z-20 flex items-center gap-4 transition-all duration-700 ease-in-out ${isIdle ? "opacity-0 translate-y-[-10px] pointer-events-none" : "opacity-100 translate-y-0"
          }`}
      >
        {/* Background Toggle Button */}
        <button
          onClick={changeBackground}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm font-medium transition-all duration-300 backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
        >
          <svg xmlns="http://www.w30.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <svg xmlns="http://www.w30.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause Music
            </>
          ) : (
            <>
              <svg xmlns="http://www.w30.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Play Music
            </>
          )}
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-4">
        <h1 className="text-5xl font-bold mb-10 text-white drop-shadow-xl tracking-tight">
          Rhythmic
        </h1>

        <FlipCard
          mode={mode}
          onTimerStart={() => !isPlaying && setIsPlaying(true)}
          onTimerStop={() => isPlaying && setIsPlaying(false)}
        />

        <button
          className="mt-10 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white/90 font-medium transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md flex items-center gap-2"
          onClick={() =>
            setMode(mode === "focus" ? "stopwatch" : "focus")
          }
        >
          <svg xmlns="http://www.w30.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Flip to {mode === "focus" ? "Stopwatch" : "Focus"}
        </button>
      </div>


    </div>
  )
}

export default App
