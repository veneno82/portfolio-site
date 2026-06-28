// Serverless function — proxies reads/writes to Upstash Redis for todo items.
// Env vars (KV_REST_API_URL, KV_REST_API_TOKEN) are injected by Vercel
// automatically when the Upstash store is linked to this project.
export default async function handler(req, res) {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'KV not configured' });

  // GET /api/todos — return saved items + timestamp
  if (req.method === 'GET') {
    const [dRes, tRes] = await Promise.all([
      fetch(`${url}/get/todos_data`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/todos_ts`,   { headers: { Authorization: `Bearer ${token}` } })
    ]);
    const d = await dRes.json();
    const t = await tRes.json();
    let items = [];
    try { items = d.result ? JSON.parse(d.result) : []; } catch (_) {}
    return res.json({ items, ts: Number(t.result) || 0 });
  }

  // POST /api/todos — persist items + timestamp
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const { items = [], ts = Date.now() } = body;
    const writes = await Promise.all([
      fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', 'todos_data', JSON.stringify(items)])
      }),
      fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', 'todos_ts', String(ts)])
      })
    ]);
    if (writes.some(r => !r.ok)) {
      return res.status(502).json({ error: 'KV write failed' });
    }
    return res.json({ ok: true });
  }

  res.status(405).end();
}
