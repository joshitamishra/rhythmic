import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface Props {
    isPlaying: boolean
    onToggleMusic: () => void
    onChangeBackground: () => void
}

export default function Sidebar({ isPlaying, onToggleMusic, onChangeBackground }: Props) {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    return (
        <>
            {/* Overlay when open — click outside to close */}
            {open && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Drawer Panel — slides in from left */}
            <div
                className={`fixed top-0 left-0 h-full w-60 z-40 bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-2xl flex flex-col py-10 px-5 gap-6 transition-all duration-500 ease-in-out ${open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
                    }`}
            >
                {/* Logo */}
                <div className="mb-2">
                    <h2 className="text-white font-bold text-xl tracking-tight drop-shadow">Rhythmic</h2>
                    <p className="text-white/50 text-xs mt-0.5">Your focus companion</p>
                </div>

                <div className="w-full h-px bg-white/15" />

                {/* Nav items */}
                <nav className="flex flex-col gap-2">
                    <button
                        onClick={() => { setOpen(false); navigate("/") }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm font-medium group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Home
                    </button>

                    <button
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white bg-white/15 border border-white/20 text-sm font-medium cursor-default"
                    >
                        <span className="text-base">🍅</span>
                        Pomodoro
                        <span className="ml-auto text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">Active</span>
                    </button>
                </nav>

                <div className="w-full h-px bg-white/15" />

                {/* Controls */}
                <div className="flex flex-col gap-2">
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1 px-1">Controls</p>

                    <button
                        onClick={onToggleMusic}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm font-medium group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isPlaying
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></>
                            }
                        </svg>
                        {isPlaying ? "Pause Music" : "Play Music"}
                    </button>

                    <button
                        onClick={onChangeBackground}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm font-medium group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Change Background
                    </button>
                </div>
            </div>

            {/* ── Toggle Tab ── independently positioned so it's ALWAYS visible on the left edge */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{ left: open ? "240px" : "0px" }}
                className="fixed top-1/2 -translate-y-1/2 z-50 h-16 w-7 flex items-center justify-center rounded-r-xl bg-white/10 hover:bg-white/25 border border-l-0 border-white/25 backdrop-blur-md text-white/80 hover:text-white transition-all duration-500 shadow-lg"
                aria-label="Toggle sidebar"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform duration-500 ${open ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </>
    )
}
