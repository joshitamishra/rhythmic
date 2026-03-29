import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { apiFetch } from "../api/client"
import { getMusicThemeById, BACKGROUNDS } from "../constants"

type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  locked?: boolean;
}

type InsightsData = {
  metrics: {
    totalFocusMinutes: number;
    sessionsCompleted: number;
    streakDays: number;
    cyclesCompleted: number;
  };
  recentActivity: { day: string; minutes: number }[];
  message: string;
  achievements: Achievement[];
}

export default function InsightsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauth, setUnauth] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [themeId] = useState(() => localStorage.getItem("preferred_theme_id") || "piano")
  const currentTheme = getMusicThemeById(themeId)
  const bgImage = currentTheme.backgroundIndex !== undefined
    ? BACKGROUNDS[currentTheme.backgroundIndex] || ""
    : ""

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiFetch<InsightsData>("/api/insights")
        setData(res)
        setUnauth(false)
      } catch (e: any) {
        if (e.status === 401) {
          setUnauth(true)
        } else {
          setError("Unable to connect to focus server.")
        }
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-full h-14 w-14 border-t-4 border-blue-400 border-r-transparent border-l-transparent border-b-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
        />
      </div>
    )
  }

  if (unauth) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-6 relative" style={{ backgroundImage: bgImage }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-md p-12 rounded-[3.5rem] bg-zinc-900/90 border border-white/10 shadow-3xl text-center ring-1 ring-white/5"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-500/20 ring-1 ring-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">AUTHENTICATION</h1>
          <p className="text-white/80 mb-12 text-lg font-medium leading-relaxed">Please sign in to view your personalized focus insights and earned achievements.</p>
          <a href="/auth/google" className="block w-full px-8 py-5 rounded-2xl bg-white text-black font-black hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-2xl mb-6 tracking-wide">
            CONTINUE WITH GOOGLE
          </a>
          <button onClick={() => navigate("/")} className="w-full px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 text-sm font-bold transition-all">
            ← CANCEL
          </button>
        </motion.div>
      </div>
    )
  }

  const maxMins = Math.max(...(data?.recentActivity.map(d => d.minutes) || [1]));

  return (
    <div className="min-h-screen bg-cover bg-center overflow-auto selection:bg-blue-400 selection:text-white" style={{ backgroundImage: bgImage }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] fixed" />

      <div className="relative max-w-7xl mx-auto py-10 lg:py-20 px-6 lg:px-16 min-h-screen flex flex-col">

        {/* Navigation & Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-10 mb-10 lg:mb-16">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <motion.button
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate("/")}
              className="group flex items-center gap-3 sm:gap-4 w-fit px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 text-white font-black text-sm sm:text-base transition-all backdrop-blur-3xl shadow-2xl ring-1 ring-white/5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              BACK
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => window.open("/coffee", "_blank")}
              className="group flex items-center gap-2 sm:gap-3 w-fit px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 font-black text-xs sm:text-sm transition-all backdrop-blur-3xl shadow-2xl ring-1 ring-orange-500/20"
            >
              ☕ COFFEE
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:text-right"
          >
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">
              INSIGHTS <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-400">REPORT</span>
            </h1>
            <div className="flex flex-col lg:items-end gap-3 mt-6">
              <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              <p className="text-white font-black uppercase tracking-[0.5em] text-[12px] opacity-80">Cycle Progress & Focus Totals</p>
            </div>
          </motion.div>
        </header>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-[2rem] bg-red-600/30 border border-red-500/50 text-white font-black text-center mb-10 backdrop-blur-2xl ring-2 ring-red-500/20 uppercase tracking-widest text-xs"
          >
            ⚠️ {error}
          </motion.div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20">

          {/* Recent Activity Card */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 p-10 lg:p-12 rounded-[3.5rem] bg-zinc-950/80 backdrop-blur-3xl border border-white/5 shadow-3xl relative overflow-hidden ring-1 ring-white/5"
          >
            <div className="flex items-center justify-between mb-12 relative z-10">
              <h3 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-4">
                <div className="w-1 h-8 bg-blue-500 rounded-full" />
                Recent Activity
              </h3>
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black tracking-widest">
                PAST 7 DAYS
              </div>
            </div>

            <div className="flex items-end justify-between h-64 gap-3 lg:gap-6 px-4 relative z-10">
              {data?.recentActivity.map((day, idx) => {
                const height = day.minutes > 0 ? (day.minutes / maxMins) * 100 : 5;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-6 group">
                    <div className="relative w-full flex justify-center items-end h-full">
                      {/* Placeholder background bar */}
                      <div className="absolute inset-0 w-full max-w-[48px] mx-auto bg-white/5 rounded-2xl" />

                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.4 + idx * 0.08, duration: 1, ease: "circOut" }}
                        className={`relative w-full max-w-[48px] rounded-2xl transition-all duration-300 ${day.minutes > 0 ? "bg-gradient-to-t from-blue-600 via-blue-400 to-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:scale-105" : "bg-white/10 opacity-30"}`}
                      >
                        {day.minutes > 0 && <div className="absolute top-0 left-0 right-0 h-10 bg-white/20 rounded-t-2xl filter blur-sm" />}
                      </motion.div>

                      {day.minutes > 0 && (
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-xl shadow-2xl pointer-events-none z-20">
                          {day.minutes} <span className="opacity-40">MINS</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-tighter transition-all ${day.minutes > 0 ? "text-white scale-110" : "text-white/20"}`}>
                      {day.day}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.section>

          {/* Metrics Sidebar */}
          <div className="lg:col-span-4 grid grid-cols-1 gap-8">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-10 rounded-[3rem] bg-indigo-600 shadow-[0_20px_50px_rgba(79,70,229,0.3)] border border-white/20 relative overflow-hidden group hover:-translate-y-2 transition-transform"
            >
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform">
                <span className="text-7xl font-black">⚡</span>
              </div>
              <div className="text-indigo-100/60 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Total Focus</div>
              <div className="text-5xl lg:text-6xl font-black text-white tracking-tighter">
                {Math.floor((data?.metrics.totalFocusMinutes || 0) / 60)}<span className="text-2xl opacity-40 mx-1">H</span> {(data?.metrics.totalFocusMinutes || 0) % 60}<span className="text-2xl opacity-40">M</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-10 rounded-[3rem] bg-zinc-900 border border-white/5 shadow-2xl group hover:-translate-y-2 transition-transform"
            >
              <div className="text-white/30 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Work Streak</div>
              <div className="text-5xl lg:text-6xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors">
                {data?.metrics.streakDays} <span className="text-2xl opacity-20">DAYS</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-8 rounded-[2.5rem] bg-zinc-950/80 border border-white/5 shadow-2xl text-center flex flex-col items-center gap-2"
              >
                <div className="text-[10px] font-black text-white/30 tracking-[0.2em] mb-1">SESSIONS</div>
                <div className="text-4xl font-black text-white">{data?.metrics.sessionsCompleted}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-8 rounded-[2.5rem] bg-purple-600 border border-white/10 shadow-2xl text-center flex flex-col items-center gap-2"
              >
                <div className="text-[10px] font-black text-white/60 tracking-[0.2em] mb-1">CYCLES</div>
                <div className="text-4xl font-black text-white">{data?.metrics.cyclesCompleted}</div>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Motivational Quote */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-20 p-12 lg:p-16 rounded-[4rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-3xl text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/5 opacity-50 backdrop-blur-3xl" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <span className="text-6xl">🔥</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight uppercase tracking-tight max-w-3xl italic">
              "{data?.message}"
            </h2>
            <div className="h-1.5 w-24 bg-white/20 rounded-full mt-4" />
          </div>
        </motion.section>

        {/* Achievements Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Achievements</h3>
              <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Rewards for consistency</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 pl-6 rounded-full w-fit">
              <span className="text-xs font-black text-white tracking-widest">{data?.achievements.filter(a => !a.locked).length} / {data?.achievements.length} <span className="text-blue-400">EARNED</span></span>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black font-black text-sm">
                {(data?.achievements.filter(a => !a.locked).length || 0) * 50}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data?.achievements.map((achievement, idx) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`p-10 rounded-[3.5rem] border transition-all duration-700 relative group min-h-[160px] flex items-center shadow-2xl ${achievement.locked
                  ? "bg-black/40 border-white/5 grayscale"
                  : "bg-zinc-950/90 border-blue-500/20 shadow-blue-500/10 ring-1 ring-blue-500/20"
                  }`}
              >
                {!achievement.locked && (
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-[100px]" />
                )}

                <div className="flex items-center gap-10 relative z-10 w-full">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-5xl shadow-2xl transition-all duration-500 flex-shrink-0 ${achievement.locked ? "bg-white/5 border border-white/5" : "bg-gradient-to-br from-white to-zinc-200 text-black shadow-white/5 group-hover:scale-110 group-hover:rotate-6 ring-4 ring-white/10"}`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className={`text-2xl font-black transition-colors mb-2 ${achievement.locked ? "text-white/20" : "text-white"}`}>
                      {achievement.name.toUpperCase()}
                    </h4>
                    <p className={`text-base font-medium leading-relaxed max-w-md ${achievement.locked ? "text-white/10" : "text-white/80"}`}>
                      {achievement.description}
                    </p>
                    {!achievement.locked && (
                      <div className="mt-6 inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                        <div className="w-8 h-px bg-blue-500" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">UNLOCKED RECENTLY</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="mt-auto py-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-white/20 text-[11px] font-black uppercase tracking-[0.5em]">RHYTHM • FOCUS ANALYTICS</p>
          <div className="flex gap-4">
            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10" />)}
          </div>
        </footer>
      </div>
    </div>
  )
}
