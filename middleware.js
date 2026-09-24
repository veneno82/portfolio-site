// Vercel Routing Middleware: keeps the notes, archive and their APIs private.
// Anyone without a valid login cookie gets sent to /login (pages) or a 401 (APIs).
// Login lives in api/login.js; the cookie token must match api/_auth.js.
export const config = {
  matcher: [
    '/tool/:path*',
    '/notes.html',
    '/notes-app.js',
    '/archive',
    '/archive.html',
    '/api/notes',
    '/api/archive',
    '/api/todos'
  ]
};

const COOKIE_NAME = 'mb_notes_auth';

async function sessionToken(password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('mb-notes-session-v1'));
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i !== -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function middleware(request) {
  const password = process.env.NOTES_PASSWORD;
  const cookie = readCookie(request, COOKIE_NAME);
  if (password && cookie && sameString(cookie, await sessionToken(password))) {
    // let the request through (same thing next() from @vercel/functions returns)
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  const url = new URL(request.url);
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  let next = url.pathname;
  if (next === '/notes.html' || next === '/notes-app.js') next = '/tool/notes';
  if (next === '/archive.html') next = '/archive';
  return new Response(null, {
    status: 302, headers: { ...headers, Location: '/login?next=' + encodeURIComponent(next) }
  });
}
