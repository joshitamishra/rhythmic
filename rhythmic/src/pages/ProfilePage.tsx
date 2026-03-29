import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch } from "../api/client"
import { MUSIC_THEMES, BACKGROUNDS, getMusicThemeById } from "../constants"

type User = {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
  bio: string | null
  goals: string | null
  preferred_theme_id: string | null
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

export default function ProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [bio, setBio] = useState("")
  const [goals, setGoals] = useState("")
  const [preferredThemeId, setPreferredThemeId] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const themeOptions = useMemo(() => MUSIC_THEMES.map(t => ({ id: t.id, name: t.name })), [])
  const bg = getBg()

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ user: User }>("/api/me")
      setUser(res.user)
      setBio(res.user.bio ?? "")
      setGoals(res.user.goals ?? "")
      setPreferredThemeId(res.user.preferred_theme_id ?? "")
    } catch (e: unknown) {
      const status = typeof e === "object" && e && "status" in e ? (e as { status?: number }).status : undefined
      if (status === 401) {
        setUser(null)
      } else {
        setError("Failed to load profile.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await apiFetch<{ user: User }>("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          bio,
          goals,
          preferred_theme_id: preferredThemeId || null,
        }),
      })
      setUser(res.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError("Failed to save profile.")
    } finally {
      setSaving(false)
    }
  }

  const logout = async () => {
    try {
      await apiFetch<{ ok: true }>("/auth/logout", { method: "POST" })
    } finally {
      await load()
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: bg }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          <p className="text-white/70 text-sm">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (!user) {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          </div>
          <p className="text-white/60 text-sm mb-6">Sign in to save your profile settings, goals, and preferred music theme.</p>
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
          {error && <p className="mt-4 text-sm text-red-300 text-center">{error}</p>}
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
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => window.open("/coffee", "_blank")}
              className="px-4 py-2 rounded-full bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/30 text-orange-200 hover:text-orange-100 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md flex items-center gap-2"
            >
              ☕ Coffee
            </button>
            <button
              onClick={() => navigate("/insights")}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md flex items-center gap-2"
            >
              📊 Insights
            </button>
            <button
              onClick={() => void logout()}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-red-400/20 border border-white/20 hover:border-red-400/30 text-white/70 hover:text-red-200 text-xs sm:text-sm font-medium transition-all duration-200 backdrop-blur-md"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl p-8 shadow-2xl">
          {/* Avatar + name */}
          <div className="flex items-center gap-5 mb-6">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="h-16 w-16 rounded-2xl border border-white/20 object-cover shadow-lg"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{user.name ?? "Your profile"}</h1>
              <p className="text-white/50 text-sm mt-0.5">{user.email ?? ""}</p>
            </div>
          </div>

          <div className="w-full h-px bg-white/10 mb-6" />

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-2xl bg-black/20 border border-white/15 text-white/90 px-4 py-3 outline-none focus:border-white/35 transition-colors resize-none placeholder:text-white/25 text-sm"
                placeholder="A short bio…"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Goals</label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                className="w-full rounded-2xl bg-black/20 border border-white/15 text-white/90 px-4 py-3 outline-none focus:border-white/35 transition-colors resize-none placeholder:text-white/25 text-sm"
                placeholder="What are you focusing on right now?"
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Preferred theme</label>
              <select
                value={preferredThemeId}
                onChange={(e) => setPreferredThemeId(e.target.value)}
                className="w-full rounded-2xl bg-black/20 border border-white/15 text-white/90 px-4 py-3 outline-none focus:border-white/35 transition-colors text-sm"
              >
                <option value="">No preference</option>
                {themeOptions.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1 flex items-end">
              <button
                onClick={() => void save()}
                disabled={saving}
                className="w-full px-4 py-3 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    Saving…
                  </>
                ) : saved ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </>
                ) : "Save Changes"}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-5 text-sm text-red-300 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-xs uppercase tracking-widest text-white/50 mb-4 block">Quick Insights</h3>
            <button
              onClick={() => navigate("/insights")}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-white/20 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-lg border border-white/10 group-hover:scale-110 transition-transform">
                  🏆
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">View Focus Achievements</div>
                  <div className="text-white/50 text-xs">Track your progress and streaks</div>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/30 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
