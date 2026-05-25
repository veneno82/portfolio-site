// Serverless function — proxies reads/writes to Upstash Redis.
// Env vars (KV_REST_API_URL, KV_REST_API_TOKEN) are injected by Vercel
// automatically when the Upstash store is linked to this project.
export default async function handler(req, res) {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'KV not configured' });

  // GET /api/notes — return saved content + timestamp + todos
  if (req.method === 'GET') {
    const [cRes, tRes, todosRes, todosTsRes] = await Promise.all([
      fetch(`${url}/get/notes_doc`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/notes_ts`,  { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/notes_todos`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${url}/get/notes_todos_ts`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    const c = await cRes.json();
    const t = await tRes.json();
    const todos = await todosRes.json();
    const todosTs = await todosTsRes.json();
    return res.json({
      content: c.result || '',
      ts: Number(t.result) || 0,
      todos: todos.result || '',
      todosTs: Number(todosTs.result) || 0
    });
  }

  // POST /api/notes — persist content + timestamp + optionally todos
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const { content, ts = Date.now(), todos, todosTs } = body;

    const ops = [];

    // Save notes content if provided
    if (content !== undefined) {
      ops.push(
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
      );
    }

    // Save todos if provided
    if (todos !== undefined) {
      ops.push(
        fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['SET', 'notes_todos', todos])
        }),
        fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['SET', 'notes_todos_ts', String(todosTs || ts)])
        })
      );
    }

    if (ops.length) await Promise.all(ops);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
