import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch } from "../api/client"
import { BACKGROUNDS, getMusicThemeById, MUSIC_THEMES } from "../constants"

type Insights = {
  focusMinutes: number
  sessionsCompleted: number
  streakDays: number
}

function getBg() {
  try {
    const id = localStorage.getItem("rhythmic_music_theme") ?? MUSIC_THEMES[0]?.id ?? "piano"
    const theme = getMusicThemeById(id)
    return BACKGROUNDS[theme.backgroundIndex ?? 0]
  } catch {
    return BACKGROUNDS[0]
  }
}

export default function InsightsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [unauth, setUnauth] = useState(false)
  const bg = getBg()

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiFetch<{ insights: Insights }>("/api/insights")
        setInsights(res.insights)
        setUnauth(false)
      } catch (e: unknown) {
        const status = typeof e === "object" && e && "status" in e ? (e as { status?: number }).status : undefined
        if (status === 401) setUnauth(true)
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const stats = [
    {
      label: "Focus Minutes",
      value: insights?.focusMinutes ?? 0,
      unit: "min",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-violet-500/30 to-purple-600/20",
      border: "border-violet-400/30",
    },
    {
      label: "Sessions",
      value: insights?.sessionsCompleted ?? 0,
      unit: "",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: "from-sky-400/30 to-blue-500/20",
      border: "border-sky-400/30",
    },
    {
      label: "Day Streak",
      value: insights?.streakDays ?? 0,
      unit: "days",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
      color: "from-orange-400/30 to-rose-500/20",
      border: "border-orange-400/30",
    },
  ]

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: bg }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          <p className="text-white/70 text-sm">Loading insights…</p>
        </div>
      </div>
    )
  }

  if (unauth) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center text-white px-6"
        style={{ backgroundImage: bg }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
          </div>
          <p className="text-white/60 text-sm mb-6">Sign in to track your focus sessions and view your productivity insights.</p>
          <a
            href="/auth/google"
            className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </a>
          <button
            onClick={() => navigate("/")}
            className="mt-4 w-full px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white/70 text-sm font-medium transition-all duration-200"
          >
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center text-white px-6 py-12"
      style={{ backgroundImage: bg }}
    >
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col gap-6">
        {/* Header + back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Rhythmic</span>
        </div>

        {/* Main card */}
        <div className="rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Your Insights</h1>
              <p className="text-white/50 text-sm">Productivity at a glance</p>
            </div>
          </div>

          <div className="w-full h-px bg-white/10 my-6" />

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl bg-gradient-to-br ${stat.color} border ${stat.border} p-5 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02]`}
              >
                <div className="text-white/70">{stat.icon}</div>
                <div>
                  <div className="text-3xl font-bold tracking-tight">
                    {stat.value.toLocaleString()}
                    {stat.unit && <span className="text-lg font-medium text-white/60 ml-1">{stat.unit}</span>}
                  </div>
                  <div className="text-white/50 text-xs uppercase tracking-widest mt-1">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-white/30 text-xs mt-6 text-center">More detailed charts and trends coming soon.</p>
        </div>
      </div>
    </div>
  )
}
