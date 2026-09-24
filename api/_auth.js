// Shared helpers for the private API routes (notes, archive, todos).
// Files starting with "_" inside /api are not deployed as routes by Vercel.
import { createHmac, timingSafeEqual } from 'crypto';

export const COOKIE_NAME = 'mb_notes_auth';

// The session cookie holds an HMAC of a fixed label keyed by NOTES_PASSWORD.
// Changing the password in Vercel logs every device out.
// middleware.js computes the same token with Web Crypto.
export function sessionToken(password) {
  return createHmac('sha256', password).update('mb-notes-session-v1').digest('hex');
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

export function isAuthed(req) {
  const password = process.env.NOTES_PASSWORD;
  if (!password) return false;
  const got = Buffer.from(readCookie(req, COOKIE_NAME));
  const want = Buffer.from(sessionToken(password));
  return got.length === want.length && timingSafeEqual(got, want);
}

// Returns true if the request may continue; otherwise it has already responded.
export function requireAuth(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (isAuthed(req)) return true;
  res.status(401).json({ error: 'unauthorized' });
  return false;
}

export function readBody(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  return body || {};
}

// Runs one Redis command through the Upstash REST API.
export async function kv(command) {
  const r = await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error || `KV ${r.status}`);
  return data.result;
}

export function kvConfigured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Compare-and-set save. Writes `values` (key -> string) and sets tsKey to newTs,
// but only if tsKey still equals baseTs. Returns { ok, ts }.
// The Lua script makes the check and the write atomic; if scripting is
// unavailable it falls back to a plain read-then-write.
const CAS_SCRIPT = `
local cur = tonumber(redis.call('GET', KEYS[1]) or '0') or 0
if cur ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
for i = 2, #KEYS do redis.call('SET', KEYS[i], ARGV[i + 1]) end
return 1`;

export async function casWrite(tsKey, baseTs, values) {
  const newTs = Math.max(Date.now(), baseTs + 1);
  const keys = Object.keys(values);
  let ok;
  try {
    ok = await kv(['EVAL', CAS_SCRIPT, String(keys.length + 1), tsKey, ...keys,
      String(baseTs), String(newTs), ...keys.map(k => values[k])]);
  } catch (_) {
    const cur = Number(await kv(['GET', tsKey])) || 0;
    if (cur !== baseTs) return { ok: false, ts: cur };
    await Promise.all(keys.map(k => kv(['SET', k, values[k]])));
    await kv(['SET', tsKey, String(newTs)]);
    ok = 1;
  }
  if (Number(ok) !== 1) return { ok: false, ts: Number(await kv(['GET', tsKey])) || 0 };
  return { ok: true, ts: newTs };
}
