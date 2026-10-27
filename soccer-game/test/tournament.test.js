import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NATIONAL_TEAMS, nationalTeam, sanitizeCustomTeam } from '../public/shared/teams.js';
import {
  createTournament,
  progress,
  nextUserMatch,
  recordResult,
  standings,
  userFinish,
  winnerOf,
} from '../public/shared/tournament.js';

test('World Cup: 32 teams, 8 groups, 48 group games, plays out to a champion', () => {
  const t = createTournament({ type: 'world', userTeam: nationalTeam('PK'), pool: NATIONAL_TEAMS, seed: 11 });
  assert.equal(Object.keys(t.teams).length, 32);
  assert.equal(t.groups.length, 8);
  assert.equal(t.matches.length, 48);
  progress(t);
  const m = nextUserMatch(t);
  assert.ok(m, 'user has a match waiting');
  assert.equal(m.day, 0);
  // Other games of the same matchday were simulated; nothing later was.
  assert.ok(t.matches.filter((x) => x.day === 0 && x !== m).every((x) => x.played));
  assert.ok(t.matches.filter((x) => x.day > 0).every((x) => !x.played));
  progress(t, { all: true });
  assert.ok(t.done);
  assert.ok(t.teams[t.champion]);
  // 48 group + 8 + 4 + 2 + 1 knockout games
  assert.equal(t.matches.length, 63);
  assert.ok(t.matches.filter((x) => x.knockout).every((x) => winnerOf(x)));
});

test('user results are recorded and the user advances when they win everything', () => {
  const custom = sanitizeCustomTeam({ id: 'c_test1', name: 'Test FC', short: 'TFC', att: 75, def: 75, spd: 75 });
  const t = createTournament({ type: 'knockout', userTeam: custom, pool: NATIONAL_TEAMS, seed: 5 });
  assert.equal(Object.keys(t.teams).length, 16);
  progress(t);
  let m;
  while ((m = nextUserMatch(t))) {
    const userHome = m.home === t.userId;
    recordResult(t, m.id, userHome ? { hs: 3, as: 0 } : { hs: 0, as: 3 });
    progress(t);
  }
  assert.ok(t.done);
  assert.equal(t.champion, 'c_test1');
  assert.equal(userFinish(t), 'Champion');
});

test('losing a knockout match eliminates the user and pauses for them', () => {
  const t = createTournament({ type: 'knockout', userTeam: nationalTeam('BR'), pool: NATIONAL_TEAMS, seed: 9 });
  progress(t);
  const m = nextUserMatch(t);
  const userHome = m.home === t.userId;
  recordResult(t, m.id, userHome ? { hs: 0, as: 1 } : { hs: 1, as: 0 });
  progress(t);
  assert.ok(t.eliminated);
  assert.ok(!t.done);
  assert.equal(nextUserMatch(t), null);
  progress(t, { all: true });
  assert.ok(t.done);
  assert.equal(userFinish(t), 'Round of 16');
});

test('continental cups only use teams from that region (South America has 8)', () => {
  const t = createTournament({ type: 'continental', conf: 'S', userTeam: nationalTeam('AR'), pool: NATIONAL_TEAMS, seed: 4 });
  const teams = Object.values(t.teams);
  assert.equal(teams.length, 8);
  assert.ok(teams.every((x) => x.conf === 'S'));
  assert.equal(t.groups.length, 2);
  progress(t, { all: true });
  assert.ok(t.done);
});

test('standings sort by points, then goal difference', () => {
  const t = createTournament({ type: 'world', userTeam: nationalTeam('FR'), pool: NATIONAL_TEAMS, seed: 2 });
  const g = t.matches.filter((m) => m.group === 0);
  for (const m of g) recordResult(t, m.id, { hs: 1, as: 0 });
  const table = standings(t, 0);
  for (let i = 1; i < table.length; i++) {
    const a = table[i - 1];
    const b = table[i];
    assert.ok(a.pts > b.pts || (a.pts === b.pts && a.gd >= b.gd));
  }
  assert.equal(table.reduce((n, r) => n + r.p, 0), 12);
});

test('tournament state survives JSON (saved on the phone)', () => {
  const t = createTournament({ type: 'world', userTeam: nationalTeam('NG'), pool: NATIONAL_TEAMS, seed: 8 });
  progress(t);
  const copy = JSON.parse(JSON.stringify(t));
  progress(copy, { all: true });
  assert.ok(copy.done);
});
