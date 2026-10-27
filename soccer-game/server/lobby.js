// Matchmaking and authoritative online matches. Transport-agnostic: each client is given a `send` function.
import { createMatch, step, snapshot, matchResult } from '../public/shared/engine.js';
import { resolveTeam } from '../public/shared/teams.js';

export const ONLINE_DURATION = 180;
export const TICK = 1 / 60;
const SNAPSHOT_EVERY = 2; // 30 snapshots per second
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function cleanName(value) {
  const s = String(value ?? '')
    .replace(/[^\p{L}\p{N} _.-]/gu, '')
    .trim()
    .slice(0, 16);
  return s || 'Player';
}

function cleanInput(m) {
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(-1, Math.min(1, n)) : 0;
  };
  return { mx: num(m.mx), my: num(m.my), shoot: !!m.shoot, pass: !!m.pass, sprint: !!m.sprint };
}

export class Lobby {
  constructor({ duration = ONLINE_DURATION } = {}) {
    this.duration = duration;
    this.clients = new Set();
    this.queue = [];
    this.rooms = new Map();
    this.matches = new Set();
    this.nextId = 1;
  }

  connect(send) {
    const c = { id: this.nextId++, send, name: 'Player', team: null, match: null, side: -1, room: null, rematch: false };
    this.clients.add(c);
    return c;
  }

  handle(c, m) {
    if (!m || typeof m !== 'object') return;
    switch (m.t) {
      case 'hello': {
        c.name = cleanName(m.name);
        const team = resolveTeam(m.team);
        if (!team) return c.send({ t: 'error', msg: 'Pick a team first.' });
        c.team = team;
        c.send({ t: 'welcome', id: c.id, online: this.clients.size });
        break;
      }
      case 'quick': {
        if (!this.ready(c)) return;
        this.stopWaiting(c);
        const other = this.queue.shift();
        if (other) this.start(other, c);
        else {
          this.queue.push(c);
          c.send({ t: 'queued' });
        }
        break;
      }
      case 'create': {
        if (!this.ready(c)) return;
        this.stopWaiting(c);
        let code;
        do {
          code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
        } while (this.rooms.has(code));
        this.rooms.set(code, c);
        c.room = code;
        c.send({ t: 'room', code });
        break;
      }
      case 'join': {
        if (!this.ready(c)) return;
        const code = String(m.code ?? '').toUpperCase().trim();
        const host = this.rooms.get(code);
        if (!host || host === c) return c.send({ t: 'error', msg: 'No room with that code. Check it and try again.' });
        this.stopWaiting(c);
        this.stopWaiting(host);
        this.start(host, c);
        break;
      }
      case 'cancel':
        this.stopWaiting(c);
        c.send({ t: 'idle' });
        break;
      case 'input':
        if (c.match && !c.match.ended) c.match.inputs[c.side] = cleanInput(m);
        break;
      case 'rematch': {
        const match = c.match;
        if (!match || !match.ended || match.abandoned) return;
        c.rematch = true;
        const other = match.players[1 - c.side];
        if (other.match !== match || !this.clients.has(other)) return c.send({ t: 'opponent-left', result: null });
        if (other.rematch) {
          // Swap ends for the rematch.
          this.start(match.players[1], match.players[0]);
        } else other.send({ t: 'rematch-request' });
        break;
      }
      case 'leave':
        this.leaveMatch(c);
        c.send({ t: 'idle' });
        break;
      case 'ping':
        c.send({ t: 'pong', ts: m.ts });
        break;
      default:
        break;
    }
  }

  ready(c) {
    if (c.match && !c.match.ended) {
      c.send({ t: 'error', msg: 'You are already in a match.' });
      return false;
    }
    if (!c.team) {
      c.send({ t: 'error', msg: 'Pick a team first.' });
      return false;
    }
    return true;
  }

  stopWaiting(c) {
    this.queue = this.queue.filter((q) => q !== c);
    if (c.room) {
      this.rooms.delete(c.room);
      c.room = null;
    }
  }

  start(home, away) {
    for (const c of [home, away]) {
      if (c.match) this.matches.delete(c.match);
      c.rematch = false;
    }
    const match = {
      players: [home, away],
      state: createMatch({ home: home.team, away: away.team, duration: this.duration, humans: [true, true] }),
      inputs: [null, null],
      tick: 0,
      ended: false,
      abandoned: false,
    };
    this.matches.add(match);
    [home, away].forEach((c, side) => {
      c.match = match;
      c.side = side;
      c.send({
        t: 'start',
        side,
        names: [home.name, away.name],
        teams: [home.team, away.team],
        duration: this.duration,
      });
    });
    const sn = snapshot(match.state);
    home.send({ t: 's', s: sn });
    away.send({ t: 's', s: sn });
  }

  tick(dt = TICK) {
    for (const match of this.matches) {
      if (match.ended) continue;
      const events = step(match.state, match.inputs, dt);
      match.tick++;
      const send = (msg) => match.players.forEach((c) => c.send(msg));
      if (events.length) send({ t: 'ev', e: events });
      if (match.tick % SNAPSHOT_EVERY === 0 || match.state.phase === 'ended') send({ t: 's', s: snapshot(match.state) });
      if (match.state.phase === 'ended') {
        match.ended = true;
        send({ t: 'end', result: matchResult(match.state) });
      }
    }
  }

  leaveMatch(c) {
    const match = c.match;
    if (!match) return;
    c.match = null;
    const other = match.players[1 - c.side];
    if (!match.ended) {
      match.ended = true;
      match.abandoned = true;
      other.send({ t: 'opponent-left', result: matchResult(match.state) });
    } else if (other.match === match) {
      other.send({ t: 'opponent-left', result: null });
    }
    this.matches.delete(match);
  }

  disconnect(c) {
    this.stopWaiting(c);
    this.leaveMatch(c);
    this.clients.delete(c);
  }
}
