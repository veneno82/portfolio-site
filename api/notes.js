// Serverless function: reads/writes notes in Upstash Redis.
// Env vars (KV_REST_API_URL, KV_REST_API_TOKEN) are injected by Vercel
// automatically when the Upstash store is linked to this project.
import { requireAuth, readBody, kv, kvConfigured, casWrite } from './_auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (!kvConfigured()) return res.status(500).json({ error: 'KV not configured' });

  // GET /api/notes: return saved content + pinned + stickers + timestamp
  if (req.method === 'GET') {
    const [content, ts, pinned, s] = await Promise.all([
      kv(['GET', 'notes_doc']), kv(['GET', 'notes_ts']), kv(['GET', 'notes_pinned']), kv(['GET', 'notes_stickers'])
    ]);
    let stickers = [];
    try { if (s) stickers = JSON.parse(s); } catch (_) {}
    return res.json({ content: content || '', ts: Number(ts) || 0, pinned: pinned || '', stickers });
  }

  // POST /api/notes: save content + pinned + stickers.
  // baseTs is the cloud timestamp the client's copy was built on. If another
  // device saved since then we answer 409 instead of overwriting its work.
  if (req.method === 'POST') {
    const { content = '', pinned, stickers, baseTs } = readBody(req);
    const values = { notes_doc: content };
    if (pinned !== undefined) values.notes_pinned = pinned;
    if (stickers !== undefined) values.notes_stickers = JSON.stringify(stickers);

    const result = await casWrite('notes_ts', Number(baseTs) || 0, values);
    if (!result.ok) return res.status(409).json({ conflict: true, ts: result.ts });
    return res.json({ ok: true, ts: result.ts });
  }

  res.status(405).end();
}
