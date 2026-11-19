// "let's collaborate" button in the contact section.
// Hover it and your cursor turns into a little hand tied to the button by a
// bundle of wires. Move around and the wires follow you; wander too far (or
// leave the page) and they let go and get reeled back into the button.
// On touch screens you press the button and drag instead.
(function () {
  'use strict';

  const btn = document.getElementById('collabBtn');
  if (!btn || !window.requestAnimationFrame || !window.Path2D) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'collab-wires';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  document.body.appendChild(canvas);

  // ── tuning ────────────────────────────────────────────────────────────────
  const WIRES = 16;         // strands in the bundle
  const SEG = 16;           // segments per strand
  const ITER = 8;           // constraint passes per physics step
  const STEP = 1 / 120;     // physics step, seconds
  const GRAVITY = 1400;     // px/s²
  const DAMP = 0.986;       // share of velocity kept each step
  const INSET = 9;          // wires start this far under the button's edge, px
  const LIP = 2;            // the button's bottom lip; wires tuck under it too
  const HAND_SIZE = 1;      // hand height relative to the button's height
  const FAN = 0.6;          // how wide the bundle spreads where it leaves the button, × its height

  // The hand: a fat-outlined pointing-hand cursor, drawn in a 34×44 box with
  // the fingertip (the real cursor hotspot) at (11, 1).
  const HAND_H = 44, HOT_X = 11, HOT_Y = 1;
  const HAND = new Path2D(
    'M8 26.6 L8 4 A3 3 0 0 1 14 4 L14 17 A2.8 2.8 0 0 1 19.6 17 L19.6 18.4 ' +
    'A2.8 2.8 0 0 1 25.2 18.4 L25.2 20.5 A2.5 2.5 0 0 1 30.2 20.5 L30.2 31 ' +
    'C30.2 34.2 29 36 27.5 37.2 L27.5 43 L10.5 43 L10.5 37.2 ' +
    'C8.6 36.4 6.8 34.6 5.4 32.2 L2.4 27.05 A2.5 2.5 0 0 1 6.8 24.55 Z');
  const HAND_LINES = new Path2D(
    'M14 17 L14 20.6 L19.6 20.6 M19.6 18.4 L19.6 22 L25.2 22 M25.2 20.5 L25.2 24 L30.2 24 ' +
    'M17 29.2 L17 33.8 M20.8 29.2 L20.8 33.8 M24.6 29.2 L24.6 33.8 ' +
    'M10.5 37.2 L27.5 37.2 M8 26.6 L9.4 29.2');
  // where the wires are tied on: the knuckles and the base of the finger
  const TIES = [[12.6, 12], [16.8, 17.4], [22.4, 19], [27.6, 21.4], [18, 24.5], [23.5, 26]];

  // ── state ─────────────────────────────────────────────────────────────────
  let W = 0, H = 0, DPR = 1;
  let state = 'idle';       // idle | held | letgo
  let raf = 0, last = 0, acc = 0;
  let sMid = 0;             // where the bundle leaves the button (arc length round its outline)
  let touchId = null, dragged = false, downX = 0, downY = 0;
  const ptr = { x: -1e4, y: -1e4, vx: 0, t: 0 };
  const hand = { x: 0, y: 0, rot: 0, vrot: 0, k: 0, vk: 0 };
  const pt = { x: 0, y: 0, nx: 0, ny: 0 };
  const tip = { x: 0, y: 0 };

  const wires = [];
  for (let i = 0; i < WIRES; i++) {
    const tie = TIES[i % TIES.length];
    wires.push({
      fan: (i + 0.5) / WIRES - 0.5 + (Math.random() - 0.5) * 0.1,
      // a couple of them hang loose
      slack: i % 7 === 3 ? 1.18 + Math.random() * 0.12 : 1.005 + Math.random() * 0.07,
      width: 0.8 + Math.random() * 0.9,
      tone: Math.random(),
      tx: tie[0] + (Math.random() - 0.5) * 2.4,
      ty: tie[1] + (Math.random() - 0.5) * 2.4,
      x: new Float32Array(SEG + 1), y: new Float32Array(SEG + 1),
      px: new Float32Array(SEG + 1), py: new Float32Array(SEG + 1)
    });
  }
  // paler (further back) strands first, black ones on top
  wires.sort((a, b) => b.tone - a.tone);

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  function spring(o, key, vkey, target, k, damping, dt) {
    o[vkey] += (target - o[key]) * k * dt;
    o[vkey] *= Math.exp(-damping * dt);
    o[key] += o[vkey] * dt;
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = root.clientWidth;
    H = root.clientHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
  }

  // ── the pill's outline ────────────────────────────────────────────────────
  function pill() {
    const r = btn.getBoundingClientRect();
    const rad = r.height / 2;
    const flat = Math.max(0, r.width - r.height);
    return {
      top: r.top, h: r.height, w: r.width, rad, flat,
      cy: r.top + rad, ax: r.left + rad, bx: r.left + rad + flat,
      per: 2 * flat + 2 * Math.PI * rad
    };
  }

  // Arc length (clockwise from the left end of the flat top) of the point on
  // the outline nearest (x, y).
  function nearestS(c, x, y) {
    const L = c.flat, r = c.rad;
    if (x >= c.ax && x <= c.bx) return y < c.cy ? x - c.ax : L + Math.PI * r + (c.bx - x);
    if (x > c.bx) return L + (Math.atan2(y - c.cy, x - c.bx) + Math.PI / 2) * r;
    let th = Math.atan2(y - c.cy, x - c.ax);
    if (th < 0) th += Math.PI * 2;
    return 2 * L + Math.PI * r + (th - Math.PI / 2) * r;
  }

  // Point and outward normal on the outline at arc length s (into `pt`).
  function pointAt(c, s) {
    const L = c.flat, r = c.rad, arc = Math.PI * r;
    s = ((s % c.per) + c.per) % c.per;
    if (s < L) { pt.x = c.ax + s; pt.y = c.top; pt.nx = 0; pt.ny = -1; return; }
    s -= L;
    if (s < arc) {
      const th = -Math.PI / 2 + s / r;
      pt.nx = Math.cos(th); pt.ny = Math.sin(th);
      pt.x = c.bx + r * pt.nx; pt.y = c.cy + r * pt.ny; return;
    }
    s -= arc;
    if (s < L) { pt.x = c.bx - s; pt.y = c.top + c.h; pt.nx = 0; pt.ny = 1; return; }
    s -= L;
    const th = Math.PI / 2 + s / r;
    pt.nx = Math.cos(th); pt.ny = Math.sin(th);
    pt.x = c.ax + r * pt.nx; pt.y = c.cy + r * pt.ny;
  }

  function pillPath(c, shrink, dy) {
    const r = Math.max(0, c.rad - shrink), cy = c.cy + dy;
    ctx.moveTo(c.ax, cy - r);
    ctx.lineTo(c.bx, cy - r);
    ctx.arc(c.bx, cy, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(c.ax, cy + r);
    ctx.arc(c.ax, cy, r, Math.PI / 2, Math.PI * 1.5);
    ctx.closePath();
  }

  function distToPill(c, x, y) {
    const qx = clamp(x, c.ax, c.bx);
    return Math.max(0, Math.hypot(x - qx, y - c.cy) - c.rad);
  }

  const reach = c => Math.max(230, c.w * 1.15);

  // ── wires ─────────────────────────────────────────────────────────────────
  function pinEnds(c, w) {
    pointAt(c, sMid + w.fan * c.h * FAN);
    w.x[0] = pt.x - pt.nx * INSET;
    w.y[0] = pt.y - pt.ny * INSET;
    const cos = Math.cos(hand.rot), sin = Math.sin(hand.rot);
    const dx = (w.tx - HOT_X) * hand.k, dy = (w.ty - HOT_Y) * hand.k;
    w.x[SEG] = hand.x + dx * cos - dy * sin;
    w.y[SEG] = hand.y + dx * sin + dy * cos;
  }

  function seed(c) {
    for (const w of wires) {
      pinEnds(c, w);
      for (let j = 1; j < SEG; j++) {
        const t = j / SEG;
        w.x[j] = w.x[0] + (w.x[SEG] - w.x[0]) * t;
        w.y[j] = w.y[0] + (w.y[SEG] - w.y[0]) * t;
      }
      w.px.set(w.x);
      w.py.set(w.y);
    }
  }

  // keep points a and b `rest` apart (ends 0 and SEG are pinned)
  function link(w, a, b, rest, stiff, pushOnly) {
    const dx = w.x[b] - w.x[a], dy = w.y[b] - w.y[a];
    const d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
    if (pushOnly && d >= rest) return;
    const ia = a === 0 ? 0 : 1, ib = b === SEG ? 0 : 1;
    if (!(ia + ib)) return;
    const f = ((d - rest) / d) * stiff / (ia + ib);
    w.x[a] += dx * f * ia; w.y[a] += dy * f * ia;
    w.x[b] -= dx * f * ib; w.y[b] -= dy * f * ib;
  }

  function physics(c) {
    const g = GRAVITY * STEP * STEP;
    for (const w of wires) {
      for (let j = 1; j < SEG; j++) {
        const x = w.x[j], y = w.y[j];
        w.x[j] = x + (x - w.px[j]) * DAMP;
        w.y[j] = y + (y - w.py[j]) * DAMP + g;
        w.px[j] = x;
        w.py[j] = y;
      }
      pinEnds(c, w);
      // the wire pays out of the button as the hand moves away, with some slack
      const span = Math.hypot(w.x[SEG] - w.x[0], w.y[SEG] - w.y[0]);
      const rest = Math.max(12, span * w.slack) / SEG;
      for (let it = 0; it < ITER; it++) {
        for (let j = 0; j < SEG; j++) link(w, j, j + 1, rest, 1, false);
        // a little stiffness so they bend like cable instead of kinking
        for (let j = 0; j < SEG - 1; j++) link(w, j, j + 2, rest * 1.94, 0.25, true);
      }
    }
  }

  // ── drawing ───────────────────────────────────────────────────────────────
  function wirePath(w, ox, oy) {
    ctx.moveTo(w.x[0] + ox, w.y[0] + oy);
    for (let j = 1; j < SEG; j++) {
      ctx.quadraticCurveTo(w.x[j] + ox, w.y[j] + oy,
        (w.x[j] + w.x[j + 1]) / 2 + ox, (w.y[j] + w.y[j + 1]) / 2 + oy);
    }
    ctx.lineTo(w.x[SEG] + ox, w.y[SEG] + oy);
  }

  function wireColor(t, dark) {
    if (dark) return t > 0.88 ? 'rgba(150,150,160,0.9)' : t > 0.6 ? 'rgba(205,205,214,0.95)' : 'rgba(242,242,246,0.97)';
    return t > 0.88 ? 'rgba(95,95,104,0.85)' : t > 0.6 ? 'rgba(42,42,48,0.95)' : 'rgba(10,10,12,0.97)';
  }

  function placeHand(dx, dy) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.translate(hand.x + dx, hand.y + dy);
    ctx.rotate(hand.rot);
    ctx.scale(hand.k, hand.k);
    ctx.translate(-HOT_X, -HOT_Y);
  }

  function drawHand(dark) {
    if (hand.k < 0.02) return;
    const ink = '#0b0b0c';
    const depth = hand.k * 1.6;
    // back face (gives the cut-out some thickness) and its shadow on the page
    placeHand(depth, depth * 1.2);
    ctx.shadowColor = dark ? 'rgba(0,0,0,0.6)' : 'rgba(20,20,35,0.22)';
    ctx.shadowBlur = 8 * DPR;
    ctx.shadowOffsetX = 4 * DPR;
    ctx.shadowOffsetY = 8 * DPR;
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.3;
    ctx.fill(HAND);
    ctx.stroke(HAND);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    // front face
    placeHand(0, 0);
    ctx.fillStyle = '#fff';
    ctx.fill(HAND);
    ctx.stroke(HAND);
    ctx.lineWidth = 2;
    ctx.stroke(HAND_LINES);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function draw(c) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dark = root.getAttribute('data-theme') === 'dark';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // the shadow the wires throw on the page
    ctx.strokeStyle = dark ? 'rgba(0,0,0,0.45)' : 'rgba(25,25,40,0.12)';
    for (const w of wires) {
      ctx.lineWidth = w.width + 1.4;
      ctx.beginPath();
      wirePath(w, 5, 9);
      ctx.stroke();
    }
    for (const w of wires) {
      ctx.lineWidth = w.width;
      ctx.strokeStyle = wireColor(w.tone, dark);
      ctx.beginPath();
      wirePath(w, 0, 0);
      ctx.stroke();
    }
    // tuck it all under the button (and its lip)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    pillPath(c, 0.75, 0);
    pillPath(c, 0.75, LIP);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    drawHand(dark);
  }

  // ── loop ──────────────────────────────────────────────────────────────────
  function frame(now) {
    raf = 0;
    let dt = (now - last) / 1000;
    last = now;
    if (!(dt > 0)) dt = 1 / 60;
    if (dt > 0.05) dt = 0.05;

    const c = pill();
    const full = (c.h * HAND_SIZE) / HAND_H;

    if (state === 'held') {
      hand.x = ptr.x;
      hand.y = ptr.y;
      spring(hand, 'k', 'vk', full, 520, 22, dt); // pops in with a little overshoot
      if (distToPill(c, ptr.x, ptr.y) > reach(c)) letGo();
    } else if (state === 'letgo') {
      // reeled back into the button
      pointAt(c, sMid);
      const f = 1 - Math.exp(-14 * dt);
      hand.x += (pt.x - hand.x) * f;
      hand.y += (pt.y - hand.y) * f;
      hand.k *= Math.exp(-9 * dt);
      hand.vk = 0;
    }
    if (hand.k < 0) hand.k = 0;

    // the bundle leaves the button from the side facing the hand
    let dS = nearestS(c, hand.x, hand.y) - sMid;
    dS -= Math.round(dS / c.per) * c.per;
    sMid += dS * (1 - Math.exp(-16 * dt));

    // the hand leans toward the button and swings a little as you move
    ptr.vx *= Math.exp(-6 * dt);
    pointAt(c, sMid);
    const lean = Math.atan2(pt.x - hand.x, Math.abs(pt.y - hand.y) + 70) * 0.35;
    const swing = clamp(ptr.vx * 0.00028, -0.35, 0.35);
    spring(hand, 'rot', 'vrot', clamp(lean + swing, -0.55, 0.55), 160, 13, dt);

    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 8) { physics(c); acc -= STEP; n++; }
    if (n === 8) acc = 0;

    draw(c);

    if (state === 'letgo' && hand.k < full * 0.05) { stop(); return; }
    raf = requestAnimationFrame(frame);
  }

  function grab() {
    if (state === 'idle') {
      resize();
      const c = pill();
      sMid = nearestS(c, ptr.x, ptr.y);
      hand.x = ptr.x; hand.y = ptr.y;
      hand.k = hand.vk = hand.rot = hand.vrot = 0;
      ptr.vx = 0;
      seed(c);
      canvas.classList.add('on');
    }
    state = 'held';
    root.classList.add('collab-grab');
    if (!raf) {
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function letGo() {
    if (state !== 'held') return;
    state = 'letgo';
    root.classList.remove('collab-grab');
  }

  function stop() {
    state = 'idle';
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    root.classList.remove('collab-grab');
    canvas.classList.remove('on');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ── input ─────────────────────────────────────────────────────────────────
  window.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' && e.pointerId !== touchId) return;
    const now = performance.now();
    const ms = Math.max(4, now - ptr.t);
    ptr.vx += ((e.clientX - ptr.x) / ms * 1000 - ptr.vx) * 0.3;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.t = now;
  }, { passive: true });

  // mouse: hovering the button hands you the hand
  btn.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse') return;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.t = performance.now();
    grab();
  });

  // touch / pen: press the button and drag
  btn.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    touchId = e.pointerId;
    dragged = false;
    downX = ptr.x = e.clientX;
    downY = ptr.y = e.clientY;
    ptr.t = performance.now();
    try { btn.setPointerCapture(e.pointerId); } catch (_) { }
    grab();
  });
  btn.addEventListener('pointermove', e => {
    if (e.pointerId === touchId && Math.hypot(e.clientX - downX, e.clientY - downY) > 10) dragged = true;
  });
  const lift = e => {
    if (e.pointerId !== touchId) return;
    touchId = null;
    letGo();
  };
  btn.addEventListener('pointerup', lift);
  btn.addEventListener('pointercancel', lift);
  // a drag isn't a tap, so don't open the mail app at the end of one
  btn.addEventListener('click', e => {
    if (dragged) { e.preventDefault(); dragged = false; }
  });

  // leaving the window, switching apps or tabs lets go too
  document.addEventListener('mouseout', e => {
    if (!e.relatedTarget && touchId === null) letGo();
  });
  window.addEventListener('blur', letGo);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('resize', () => { if (state !== 'idle') resize(); });
})();
