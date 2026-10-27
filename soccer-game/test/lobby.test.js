import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Lobby, TICK } from '../server/lobby.js';

function client(lobby) {
  const inbox = [];
  const c = lobby.connect((m) => inbox.push(m));
  return { c, inbox, last: (t) => [...inbox].reverse().find((m) => m.t === t) };
}

test('quick match pairs two players and starts an authoritative match', () => {
  const lobby = new Lobby({ duration: 2 });
  const a = client(lobby);
  const b = client(lobby);
  lobby.handle(a.c, { t: 'hello', name: 'Ann', team: { id: 'BR' } });
  lobby.handle(b.c, { t: 'hello', name: 'Bo<b>', team: { custom: true, id: 'c_abcd', name: 'Bo FC', att: 90, def: 90, spd: 90 } });
  lobby.handle(a.c, { t: 'quick' });
  assert.ok(a.last('queued'));
  lobby.handle(b.c, { t: 'quick' });
  const sa = a.last('start');
  const sb = b.last('start');
  assert.equal(sa.side, 0);
  assert.equal(sb.side, 1);
  assert.deepEqual(sa.names, ['Ann', 'Bob']);
  assert.ok(sb.teams[1].att + sb.teams[1].def + sb.teams[1].spd <= 225, 'custom stats clamped server-side');
  for (let i = 0; i < 60 * 5; i++) {
    lobby.handle(a.c, { t: 'input', mx: 5, my: 0, shoot: i % 30 < 15 });
    lobby.tick(TICK);
  }
  assert.ok(a.inbox.some((m) => m.t === 's'));
  const end = a.last('end');
  assert.ok(end, 'match ended');
  assert.deepEqual(end.result.score, b.last('end').result.score);
});

test('private rooms: create, join by code, wrong code rejected', () => {
  const lobby = new Lobby();
  const a = client(lobby);
  const b = client(lobby);
  const c = client(lobby);
  for (const x of [a, b, c]) lobby.handle(x.c, { t: 'hello', name: 'P', team: { id: 'FR' } });
  lobby.handle(a.c, { t: 'create' });
  const { code } = a.last('room');
  assert.match(code, /^[A-Z2-9]{4}$/);
  lobby.handle(c.c, { t: 'join', code: 'ZZZZ' });
  assert.ok(c.last('error'));
  lobby.handle(b.c, { t: 'join', code: code.toLowerCase() });
  assert.ok(a.last('start') && b.last('start'));
  assert.equal(lobby.rooms.size, 0);
});

test('disconnecting mid-match tells the opponent', () => {
  const lobby = new Lobby();
  const a = client(lobby);
  const b = client(lobby);
  for (const x of [a, b]) {
    lobby.handle(x.c, { t: 'hello', team: { id: 'JP' } });
    lobby.handle(x.c, { t: 'quick' });
  }
  lobby.disconnect(a.c);
  assert.ok(b.last('opponent-left'));
  assert.equal(lobby.matches.size, 0);
});

test('rematch needs both players and swaps ends', () => {
  const lobby = new Lobby({ duration: 0.5 });
  const a = client(lobby);
  const b = client(lobby);
  lobby.handle(a.c, { t: 'hello', name: 'A', team: { id: 'JP' } });
  lobby.handle(b.c, { t: 'hello', name: 'B', team: { id: 'KR' } });
  lobby.handle(a.c, { t: 'quick' });
  lobby.handle(b.c, { t: 'quick' });
  for (let i = 0; i < 60 * 3; i++) lobby.tick(TICK);
  assert.ok(a.last('end'));
  lobby.handle(a.c, { t: 'rematch' });
  assert.ok(b.last('rematch-request'));
  a.inbox.length = 0;
  lobby.handle(b.c, { t: 'rematch' });
  assert.equal(a.last('start').side, 1);
  assert.deepEqual(a.last('start').names, ['B', 'A']);
});

test('cannot queue without a team', () => {
  const lobby = new Lobby();
  const a = client(lobby);
  lobby.handle(a.c, { t: 'quick' });
  assert.ok(a.last('error'));
  assert.equal(lobby.queue.length, 0);
});
