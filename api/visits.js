// Serverless function: the clickable visitor counter on the home page.
// GET  /api/visits  -> { count, you }   (you: this visitor's number, or null)
// POST /api/visits  -> counts this visitor once and returns the same shape.
// "Once" is a cookie on this browser. A network can also only add a handful of
// counts a day, so clearing cookies or going incognito can't run it up, while a
// shared network (campus wifi) still lets plenty of different people in.
import { kv, kvConfigured } from './_auth.js';
import { createHmac } from 'crypto';

const COUNT_KEY = 'visits_count';
const COOKIE = 'mb_visit';
const PER_NETWORK_PER_DAY = 10;
const DAY = 60 * 60 * 24;

// INCR the network's tally for today and, only if it's still under the cap,
// the counter. Returns { count, counted }.
const COUNT_SCRIPT = `
local n = redis.call('INCR', KEYS[2])
if n == 1 then redis.call('EXPIRE', KEYS[2], ARGV[2]) end
if n > tonumber(ARGV[1]) then
  return {tonumber(redis.call('GET', KEYS[1]) or '0'), 0}
end
return {redis.call('INCR', KEYS[1]), 1}`;

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i !== -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

function visitorNumber(req) {
  const n = Number(readCookie(req, COOKIE));
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Only a keyed hash of the network's address and today's date is kept, and it
// expires after a day. The key is a server secret, so the hash can't be turned
// back into an address by trying every IP.
function networkKey(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
  const day = new Date().toISOString().slice(0, 10);
  const secret = process.env.VISITS_SECRET || process.env.NOTES_PASSWORD || 'mb-visits-v1';
  return 'visits_net:' + createHmac('sha256', secret).update(`${ip}|${day}`).digest('hex').slice(0, 32);
}

// Clicks have to come from this site; a form on another site can't count its visitors here.
function fromOtherSite(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host !== req.headers.host; } catch (_) { return true; }
}

async function currentCount() {
  return Number(await kv(['GET', COUNT_KEY])) || 0;
}

async function count(req) {
  const net = networkKey(req);
  try {
    const [n, counted] = await kv(['EVAL', COUNT_SCRIPT, '2', COUNT_KEY, net, String(PER_NETWORK_PER_DAY), String(DAY)]);
    return { count: Number(n) || 0, counted: Number(counted) === 1 };
  } catch (_) {
    const used = Number(await kv(['INCR', net])) || 0;
    if (used === 1) await kv(['EXPIRE', net, String(DAY)]).catch(() => {});
    if (used > PER_NETWORK_PER_DAY) return { count: await currentCount(), counted: false };
    return { count: Number(await kv(['INCR', COUNT_KEY])) || 0, counted: true };
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!kvConfigured()) return res.status(500).json({ error: 'KV not configured' });

  try {
    if (req.method === 'GET') {
      return res.json({ count: await currentCount(), you: visitorNumber(req) });
    }

    if (req.method === 'POST') {
      if (fromOtherSite(req)) return res.status(403).json({ error: 'forbidden' });

      const you = visitorNumber(req);
      if (you) return res.json({ count: await currentCount(), you, fresh: false });

      const result = await count(req);
      if (!result.counted) return res.status(429).json({ count: result.count, you: null, fresh: false, error: 'this network has already counted a lot of visitors today' });

      const twoYears = DAY * 365 * 2;
      // the cookie only goes back to this endpoint, not with every page on the site
      res.setHeader('Set-Cookie', `${COOKIE}=${result.count}; Path=/api/visits; HttpOnly; Secure; SameSite=Lax; Max-Age=${twoYears}`);
      return res.json({ count: result.count, you: result.count, fresh: true });
    }
  } catch (_) {
    return res.status(502).json({ error: 'counter unavailable' });
  }

  res.status(405).end();
}
