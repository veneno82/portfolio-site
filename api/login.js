// Serverless function: password login for the private pages (notes, archive).
// Set NOTES_PASSWORD in the Vercel project's environment variables.
import { COOKIE_NAME, sessionToken, readBody, kv, kvConfigured } from './_auth.js';
import { timingSafeEqual, createHash } from 'crypto';

const MAX_FAILS = 10;          // per IP
const LOCKOUT_SECONDS = 15 * 60;

function sameString(a, b) {
  // hash first so the comparison doesn't leak the password length
  const x = createHash('sha256').update(a).digest();
  const y = createHash('sha256').update(b).digest();
  return timingSafeEqual(x, y);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const password = process.env.NOTES_PASSWORD;
  if (!password) return res.status(500).json({ error: 'NOTES_PASSWORD is not set' });

  // DELETE /api/login: log this device out
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return res.json({ ok: true });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
  const failKey = `login_fail:${ip}`;
  if (kvConfigured()) {
    const fails = Number(await kv(['GET', failKey]).catch(() => 0)) || 0;
    if (fails >= MAX_FAILS) return res.status(429).json({ error: 'too many attempts, try again later' });
  }

  const { password: attempt = '' } = readBody(req);
  if (typeof attempt !== 'string' || !sameString(attempt, password)) {
    if (kvConfigured()) {
      await kv(['INCR', failKey]).then(() => kv(['EXPIRE', failKey, String(LOCKOUT_SECONDS)])).catch(() => {});
    }
    return res.status(401).json({ error: 'wrong password' });
  }

  if (kvConfigured()) await kv(['DEL', failKey]).catch(() => {});
  const oneYear = 60 * 60 * 24 * 365;
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${sessionToken(password)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${oneYear}`);
  return res.json({ ok: true });
}
