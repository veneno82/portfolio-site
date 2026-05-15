// Serverless function — proxies reads/writes to Upstash Redis.
// Env vars (KV_REST_API_URL, KV_REST_API_TOKEN) are injected by Vercel
// automatically when the Upstash store is linked to this project.
export default async function handler(req, res) {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'KV not configured' });

  // GET /api/notes — return saved content + timestamp
  if (req.method === 'GET') {
    const [cRes, tRes] = await Promise.all([
      fetch(`${url}/get/notes_doc`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/notes_ts`,  { headers: { Authorization: `Bearer ${token}` } })
    ]);
    const c = await cRes.json();
    const t = await tRes.json();
    return res.json({ content: c.result || '', ts: Number(t.result) || 0 });
  }

  // POST /api/notes — persist content + timestamp
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const { content = '', ts = Date.now() } = body;
    await Promise.all([
      fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', 'notes_doc', content])
      }),
      fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', 'notes_ts', String(ts)])
      })
    ]);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
