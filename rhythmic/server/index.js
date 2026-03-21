import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import passport from "passport";
import { env } from "./env.js";
import {
  SESSION_COOKIE_NAME,
  configurePassport,
  createSessionForUser,
  deleteSession,
  getUserBySessionId,
} from "./auth.js";
import { z } from "zod";
import { query } from "./db.js";

configurePassport();

const app = express();

app.use(
  cors({
    origin: env.APP_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(env.SESSION_SECRET));
app.use(passport.initialize());

// Attach req.user if session exists.
app.use(async (req, _res, next) => {
  const sid = req.signedCookies?.[SESSION_COOKIE_NAME];
  if (!sid) return next();

  try {
    const user = await getUserBySessionId(sid);
    if (user) req.user = user;
  } catch {
    // ignore
  }
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: env.APP_ORIGIN }),
  async (req, res) => {
    const user = req.user;
    if (!user?.id) return res.redirect(env.APP_ORIGIN);

    const { sessionId, expiresAt } = await createSessionForUser(user.id);

    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    });

    res.redirect(`${env.APP_ORIGIN}/profile`);
  }
);

app.post("/auth/logout", async (req, res) => {
  const sid = req.signedCookies?.[SESSION_COOKIE_NAME];
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

app.get("/api/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthenticated" });
  res.json({ user: req.user });
});

const PatchMeSchema = z.object({
  bio: z.string().max(500).nullable().optional(),
  goals: z.string().max(500).nullable().optional(),
  preferred_theme_id: z.string().max(64).nullable().optional(),
});

app.patch("/api/me", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthenticated" });

  const parsed = PatchMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
  }

  const { bio, goals, preferred_theme_id } = parsed.data;
  const hasBio = Object.prototype.hasOwnProperty.call(req.body ?? {}, "bio");
  const hasGoals = Object.prototype.hasOwnProperty.call(req.body ?? {}, "goals");
  const hasPreferredThemeId = Object.prototype.hasOwnProperty.call(req.body ?? {}, "preferred_theme_id");

  const updated = await query(
    `
    UPDATE users
    SET
      bio = CASE WHEN $2 THEN $3 ELSE bio END,
      goals = CASE WHEN $4 THEN $5 ELSE goals END,
      preferred_theme_id = CASE WHEN $6 THEN $7 ELSE preferred_theme_id END,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [req.user.id, hasBio, bio ?? null, hasGoals, goals ?? null, hasPreferredThemeId, preferred_theme_id ?? null]
  );

  res.json({ user: updated.rows[0] });
});

// Record a finished focus session
app.post("/api/sessions", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthenticated" });
  const { minutes, type } = req.body;

  await query(
    `INSERT INTO focus_sessions (user_id, minutes, type) VALUES ($1, $2, $3)`,
    [req.user.id, minutes, type || 'focus']
  );

  res.json({ success: true });
});

app.get("/api/insights", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthenticated" });

  try {
    // 1. Calculate main metrics
    const metricsRes = await query(`
      SELECT 
        COALESCE(SUM(minutes), 0) as total_minutes,
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE minutes >= 25) as long_sessions
      FROM focus_sessions 
      WHERE user_id = $1 AND type = 'focus'
    `, [req.user.id]);

    const { total_minutes, total_sessions, long_sessions } = metricsRes.rows[0];

    // 2. Calculate daily streak (days in a row with at least 1 session)
    const streakRes = await query(`
      WITH daily_sessions AS (
        SELECT DISTINCT date_trunc('day', completed_at AT TIME ZONE 'UTC') as session_day
        FROM focus_sessions
        WHERE user_id = $1 AND type = 'focus'
      ),
      streak_groups AS (
        SELECT 
          session_day,
          session_day - (interval '1 day' * row_number() OVER (ORDER BY session_day)) as group_id
        FROM daily_sessions
      )
      SELECT COUNT(*) as streak
      FROM streak_groups
      GROUP BY group_id
      ORDER BY max(session_day) DESC
      LIMIT 1
    `, [req.user.id]);

    const streakDays = streakRes.rows[0] ? parseInt(streakRes.rows[0].streak) : 0;

    // 3. Last 7 days activity
    const activityRes = await query(`
      SELECT 
        to_char(day, 'Dy') as day_name,
        COALESCE(SUM(minutes), 0) as focus_minutes
      FROM generate_series(
        now() - interval '6 days', 
        now(), 
        interval '1 day'
      ) as day
      LEFT JOIN focus_sessions ON 
        date_trunc('day', focus_sessions.completed_at AT TIME ZONE 'UTC') = date_trunc('day', day)
        AND user_id = $1 
        AND type = 'focus'
      GROUP BY day
      ORDER BY day
    `, [req.user.id]);

    const sessionsCount = parseInt(total_sessions || 0);
    const minsCount = parseInt(total_minutes || 0);

    res.json({
      metrics: {
        totalFocusMinutes: minsCount,
        sessionsCompleted: sessionsCount,
        streakDays: streakDays,
        cyclesCompleted: Math.floor(sessionsCount / 4),
      },
      recentActivity: activityRes.rows.map(r => ({ day: r.day_name, minutes: parseInt(r.focus_minutes || 0) })),
      message: sessionsCount > 0
        ? "Your focus is becoming more consistent! Keep going."
        : "Start your first session to begin your focus journey!",
      achievements: [
        { id: "cycle_master", name: "Cycle Master", description: "Completed a full 4-cycle Pomodoro session.", icon: "🏆", earnedAt: sessionsCount >= 4 ? "Recent" : null, locked: sessionsCount < 4 },
        { id: "deep_work", name: "Deep Work", description: "Focused for over 2 hours in total.", icon: "🔱", earnedAt: minsCount >= 120 ? "Recent" : null, locked: minsCount < 120 },
      ]
    });
  } catch (err) {
    console.error("Insights calculation error:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

// Serve built frontend in production
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "../dist");
app.use(express.static(distDir));
// Catch-all: return index.html for client-side routing
app.use((req, res) => {
  // If the path contains a dot (e.g. .mp3, .png, .js), it's a missing file, not a route
  if (req.path.includes(".")) {
    return res.status(404).json({ error: "file_not_found" });
  }
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(env.PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://0.0.0.0:${env.PORT}`);
});

