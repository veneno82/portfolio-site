// Serverless function: reads/writes the notes archive in Upstash Redis.
// Env vars (KV_REST_API_URL, KV_REST_API_TOKEN) are injected by Vercel
// automatically when the Upstash store is linked to this project.
import { requireAuth, readBody, kv, kvConfigured, casWrite } from './_auth.js';

const PREPEND_SCRIPT = `
redis.call('SET', KEYS[1], ARGV[1] .. (redis.call('GET', KEYS[1]) or ''))
redis.call('SET', KEYS[2], ARGV[2])
return 1`;

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (!kvConfigured()) return res.status(500).json({ error: 'KV not configured' });

  // GET /api/archive: return saved archive content + timestamp
  if (req.method === 'GET') {
    const [content, ts] = await Promise.all([kv(['GET', 'archive_doc']), kv(['GET', 'archive_ts'])]);
    return res.json({ content: content || '', ts: Number(ts) || 0 });
  }

  if (req.method === 'POST') {
    const { prepend, content = '', baseTs } = readBody(req);

    // { prepend }: put a new entry on top of whatever the cloud has right now
    // (used when archiving from the notes page)
    if (typeof prepend === 'string') {
      const ts = Date.now();
      try {
        await kv(['EVAL', PREPEND_SCRIPT, '2', 'archive_doc', 'archive_ts', prepend, String(ts)]);
      } catch (_) {
        const cur = (await kv(['GET', 'archive_doc'])) || '';
        await kv(['SET', 'archive_doc', prepend + cur]);
        await kv(['SET', 'archive_ts', String(ts)]);
      }
      return res.json({ ok: true, ts });
    }

    // { content, baseTs }: replace the archive (edits on the archive page),
    // refused with 409 if it changed since the client loaded it
    const result = await casWrite('archive_ts', Number(baseTs) || 0, { archive_doc: content });
    if (!result.ok) return res.status(409).json({ conflict: true, ts: result.ts });
    return res.json({ ok: true, ts: result.ts });
  }

  res.status(405).end();
}
