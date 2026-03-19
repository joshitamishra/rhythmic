import express from "express";
import cors from "cors";
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

app.get("/api/insights", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthenticated" });
  res.json({ insights: { focusMinutes: 0, sessionsCompleted: 0, streakDays: 0 } });
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});

