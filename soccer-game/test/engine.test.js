import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, step, matchResult, snapshot, viewFromSnapshot, W, H } from '../public/shared/engine.js';
import { nationalTeam } from '../public/shared/teams.js';

const DT = 1 / 60;
const run = (s, inputs = [null, null], maxSec = 600) => {
  for (let i = 0; i < maxSec * 60 && s.phase !== 'ended'; i++) step(s, inputs, DT);
};

test('a CPU vs CPU match finishes with sane numbers', () => {
  const s = createMatch({ home: nationalTeam('FR'), away: nationalTeam('JP'), duration: 120, humans: [false, false], seed: 7 });
  run(s);
  assert.equal(s.phase, 'ended');
  const r = matchResult(s);
  assert.ok(r.score.every((g) => Number.isInteger(g) && g >= 0 && g < 20));
  assert.equal(r.possPct, undefined);
  assert.ok(Math.abs(r.stats.possPct[0] + r.stats.possPct[1] - 100) <= 1);
  for (const p of s.players) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.ok(p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H);
  }
});

test('same seed gives the same match', () => {
  const play = () => {
    const s = createMatch({ home: nationalTeam('AR'), away: nationalTeam('MA'), duration: 60, humans: [false, false], seed: 99 });
    run(s);
    return JSON.stringify(matchResult(s));
  };
  assert.equal(play(), play());
});

test('ball crossing the goal line counts a goal and restarts with the other side', () => {
  const s = createMatch({ home: nationalTeam('BR'), away: nationalTeam('DE'), humans: [false, false], seed: 1 });
  s.phase = 'play';
  s.ball.owner = -1;
  s.ball.x = W - 2;
  s.ball.y = H / 2;
  s.ball.vx = 40;
  s.ball.vy = 0;
  s.ball.lastTouch = 4;
  for (const p of s.players) p.grabCd = 5; // nobody can stop it
  let events = [];
  for (let i = 0; i < 30 && !events.some((e) => e.type === 'goal'); i++) events = step(s, [null, null], DT);
  assert.deepEqual(s.score, [1, 0]);
  assert.equal(s.goals[0].side, 0);
  for (let i = 0; i < 400 && s.phase === 'goal'; i++) step(s, [null, null], DT);
  assert.equal(s.phase, 'kickoff');
  assert.equal(s.players[s.ball.owner].team, 1, 'conceding team kicks off');
});

test('knockout draws go to golden goal then penalties', () => {
  const s = createMatch({ home: nationalTeam('TV'), away: nationalTeam('NR'), duration: 1, humans: [false, false], knockout: true, seed: 3 });
  // Freeze players so nobody scores.
  s.players.forEach((p) => (p.idx = p.idx));
  const original = s.rng;
  let guard = 0;
  while (s.phase !== 'ended' && guard++ < 60 * 200) {
    step(s, [null, null], DT);
    if (s.score[0] !== s.score[1]) break;
  }
  s.rng = original;
  const r = matchResult(s);
  assert.notEqual(r.winner, -1, 'knockout must have a winner');
  if (r.score[0] === r.score[1]) assert.ok(r.pens && r.pens[0] !== r.pens[1]);
});

test('human controls: holding then releasing shoot kicks the ball', () => {
  const s = createMatch({ home: nationalTeam('ES'), away: nationalTeam('IT'), humans: [true, false], seed: 5 });
  for (let i = 0; i < 70; i++) step(s, [null, null], DT); // kickoff freeze
  assert.equal(s.ball.owner, s.teams[0].ctl);
  // Clear the shooting lane so the shot isn't blocked.
  for (const p of s.players.filter((x) => x.team === 1 && x.idx > 0)) p.y = 3;
  const hold = { mx: 1, my: 0, shoot: true, pass: false, sprint: false };
  for (let i = 0; i < 20; i++) step(s, [hold, null], DT);
  assert.ok(s.teams[0].charge > 0);
  const events = step(s, [{ ...hold, shoot: false }, null], DT);
  assert.ok(events.some((e) => e.type === 'kick'));
  assert.equal(s.ball.owner, -1);
  assert.ok(s.ball.vx > 20);
});

test('human controls: pass moves the ball and control to a team-mate', () => {
  const s = createMatch({ home: nationalTeam('ES'), away: nationalTeam('IT'), humans: [true, false], seed: 5 });
  for (let i = 0; i < 70; i++) step(s, [null, null], DT);
  const before = s.teams[0].ctl;
  s.players[before].fx = -1; // face back toward team-mates
  s.players[before].fy = 0;
  step(s, [{ mx: 0, my: 0, shoot: false, pass: true, sprint: false }, null], DT);
  assert.equal(s.ball.owner, -1);
  assert.notEqual(s.teams[0].ctl, before);
  assert.equal(s.ball.target, s.teams[0].ctl);
});

test('snapshots round-trip into a view', () => {
  const s = createMatch({ home: nationalTeam('US'), away: nationalTeam('MX'), humans: [true, true], seed: 2 });
  const v = viewFromSnapshot(JSON.parse(JSON.stringify(snapshot(s))));
  assert.equal(v.players.length, 10);
  assert.equal(v.phase, 'kickoff');
  assert.deepEqual(v.score, [0, 0]);
});
