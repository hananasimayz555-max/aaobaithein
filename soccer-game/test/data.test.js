import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, CONFEDERATIONS } from '../public/shared/countries.js';
import { NATIONAL_TEAMS, sanitizeCustomTeam, resolveTeam, matchKits, colorDistance, CUSTOM_BUDGET } from '../public/shared/teams.js';

test('all 193 UN member states, each once', () => {
  assert.equal(COUNTRIES.length, 193);
  assert.equal(new Set(COUNTRIES.map((c) => c.iso)).size, 193);
  assert.equal(new Set(COUNTRIES.map((c) => c.code)).size, 193);
  assert.equal(new Set(COUNTRIES.map((c) => c.name)).size, 193);
});

test('country data is well formed', () => {
  for (const c of COUNTRIES) {
    assert.match(c.iso, /^[A-Z]{2}$/, c.name);
    assert.match(c.code, /^[A-Z]{3}$/, c.name);
    assert.ok(CONFEDERATIONS[c.conf], c.name);
    assert.ok(c.rating >= 20 && c.rating <= 95, c.name);
    assert.match(c.primary, /^#[0-9a-f]{6}$/, c.name);
    assert.match(c.secondary, /^#[0-9a-f]{6}$/, c.name);
  }
  assert.equal(NATIONAL_TEAMS.length, 193);
});

test('custom teams are clamped to the skill budget', () => {
  const t = sanitizeCustomTeam({ name: 'Rockets', short: 'roc', att: 90, def: 90, spd: 90, primary: '#FF0000', badge: '🔥' });
  assert.ok(t.att + t.def + t.spd <= CUSTOM_BUDGET);
  assert.equal(t.short, 'ROC');
  assert.equal(t.primary, '#ff0000');
  assert.equal(t.players.length, 5);
});

test('custom team input is sanitised', () => {
  const t = sanitizeCustomTeam({ name: '<script>x</script>', primary: 'red', formation: 'nope', badge: 'X', players: ['<b>'] });
  assert.ok(!t.name.includes('<'));
  assert.equal(t.primary, '#1d4ed8');
  assert.equal(t.formation, 'diamond');
  assert.ok(!t.players[0].includes('<'));
  assert.equal(sanitizeCustomTeam(null), null);
});

test('national teams resolve by id only (clients cannot boost stats)', () => {
  const t = resolveTeam({ id: 'BR', att: 99, def: 99 });
  assert.equal(t.name, 'Brazil');
  assert.ok(t.att < 99);
  assert.equal(resolveTeam({ id: 'ZZ' }), null);
});

test('kits never clash', () => {
  for (const a of NATIONAL_TEAMS.slice(0, 40)) {
    for (const b of NATIONAL_TEAMS.slice(0, 40)) {
      if (a === b) continue;
      const [h, w] = matchKits(a, b);
      assert.ok(colorDistance(h.primary, w.primary) >= 120, `${a.name} v ${b.name}`);
    }
  }
});
