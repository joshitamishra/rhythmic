import crypto from "crypto";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import { query } from "./db.js";

export const SESSION_COOKIE_NAME = "sid";

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        // Use APP_ORIGIN so the callback URL goes through Vite's proxy (port 5173)
        // and matches the redirect URI registered in Google Cloud Console.
        callbackURL: `${env.APP_ORIGIN}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const provider = "google";
          const providerUserId = profile.id;
          const email = profile.emails?.[0]?.value ?? null;
          const name = profile.displayName ?? null;
          const avatarUrl = profile.photos?.[0]?.value ?? null;

          const upserted = await query(
            `
            INSERT INTO users (provider, provider_user_id, email, name, avatar_url)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (provider, provider_user_id)
            DO UPDATE SET
              email = EXCLUDED.email,
              name = EXCLUDED.name,
              avatar_url = EXCLUDED.avatar_url,
              updated_at = NOW()
            RETURNING *
            `,
            [provider, providerUserId, email, name, avatarUrl]
          );

          return done(null, upserted.rows[0]);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

export function createSessionId() {
  return crypto.randomUUID();
}

export async function createSessionForUser(userId, ttlHours = 24 * 14) {
  const sessionId = createSessionId();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [sessionId, userId, expiresAt]
  );

  return { sessionId, expiresAt };
}

export async function deleteSession(sessionId) {
  await query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
}

export async function getUserBySessionId(sessionId) {
  const res = await query(
    `
    SELECT u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = $1 AND s.expires_at > NOW()
    `,
    [sessionId]
  );
  return res.rows[0] ?? null;
}

