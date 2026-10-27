// WebSocket client for online 1v1. Buffers snapshots so movement can be smoothed between them.
import { viewFromSnapshot, lerpViews } from './shared/engine.js';

const INTERP_DELAY = 80; // ms behind the newest snapshot, hides network jitter

export function serverUrl(custom) {
  if (custom) return custom;
  if (location.protocol === 'file:') return '';
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
}

export function connect(url, handlers) {
  const ws = new WebSocket(url);
  const snaps = [];
  let pingTimer = null;
  let ping = null;
  let lastInput = '';
  let lastSent = 0;

  const send = (msg) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

  ws.addEventListener('open', () => {
    handlers.open?.();
    pingTimer = setInterval(() => send({ t: 'ping', ts: performance.now() }), 2000);
  });
  ws.addEventListener('close', () => {
    clearInterval(pingTimer);
    handlers.close?.();
  });
  ws.addEventListener('error', () => handlers.error?.());
  ws.addEventListener('message', (e) => {
    let msg;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    if (msg.t === 's') {
      snaps.push({ at: performance.now(), view: viewFromSnapshot(msg.s) });
      if (snaps.length > 30) snaps.shift();
      return;
    }
    if (msg.t === 'pong') {
      ping = Math.round(performance.now() - msg.ts);
      handlers.ping?.(ping);
      return;
    }
    if (msg.t === 'start') snaps.length = 0;
    handlers.message?.(msg);
  });

  return {
    send,
    close() {
      clearInterval(pingTimer);
      ws.close();
    },
    // Sends input when it changes, and at least every 100 ms.
    sendInput(input) {
      const key = `${input.mx.toFixed(2)},${input.my.toFixed(2)},${+input.shoot}${+input.pass}${+input.sprint}`;
      const now = performance.now();
      if (key === lastInput && now - lastSent < 100) return;
      lastInput = key;
      lastSent = now;
      send({ t: 'input', ...input });
    },
    view() {
      if (!snaps.length) return null;
      const target = performance.now() - INTERP_DELAY;
      for (let i = snaps.length - 1; i > 0; i--) {
        const a = snaps[i - 1];
        const b = snaps[i];
        if (a.at <= target) {
          const t = Math.min(1, (target - a.at) / Math.max(1, b.at - a.at));
          return lerpViews(a.view, b.view, t);
        }
      }
      return snaps[0].view;
    },
    get ping() {
      return ping;
    },
  };
}
