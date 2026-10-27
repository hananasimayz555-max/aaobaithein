import { CONFEDERATIONS } from './countries.js';
import { teamRating } from './teams.js';
import { penaltyShootout } from './engine.js';
import { mulberry32, hashString, shuffle } from './rng.js';

export const TOURNAMENT_TYPES = {
  world: { label: 'World Cup', groups: true, blurb: '32 teams, 8 groups, then knockouts' },
  continental: { label: 'Continental Cup', groups: true, blurb: 'Teams from one region, groups then knockouts' },
  knockout: { label: 'Knockout Cup', groups: false, blurb: '16 teams, straight knockout' },
};

const ROUND_NAMES = { 32: 'Round of 32', 16: 'Round of 16', 8: 'Quarter-final', 4: 'Semi-final', 2: 'Final' };
const GROUP_NAMES = 'ABCDEFGH';

export function tournamentSize(type, pool, conf) {
  if (type === 'world') return 32;
  if (type === 'knockout') return 16;
  const available = pool.filter((t) => t.conf === conf).length;
  return available >= 16 ? 16 : 8;
}

// Weighted draw without replacement: stronger teams are more likely to "qualify".
function weightedSample(list, n, rng) {
  const pool = list.slice();
  const out = [];
  while (out.length < n && pool.length) {
    const weights = pool.map((t) => Math.exp(teamRating(t) / 7));
    let r = rng() * weights.reduce((a, b) => a + b, 0);
    let i = 0;
    while (r > weights[i]) r -= weights[i++];
    out.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
  }
  return out;
}

export function createTournament({ type, conf = null, userTeam, pool, seed, difficulty = 'normal', duration = 180 }) {
  const rng = mulberry32(seed);
  const size = tournamentSize(type, pool, conf);
  const candidates = pool.filter((t) => t.id !== userTeam.id && (type !== 'continental' || t.conf === conf));
  const field = [userTeam, ...weightedSample(candidates, size - 1, rng)];
  const name = type === 'continental' ? `${CONFEDERATIONS[conf]} Cup` : TOURNAMENT_TYPES[type].label;
  const state = {
    id: `t_${seed.toString(36)}`,
    type,
    conf,
    name,
    seed,
    difficulty,
    duration,
    userId: userTeam.id,
    teams: Object.fromEntries(field.map((t) => [t.id, t])),
    groups: [],
    matches: [],
    stage: '',
    done: false,
    eliminated: false,
    champion: null,
    createdAt: Date.now(),
  };
  // Seed by strength into pots, so the best teams are spread across groups/bracket.
  const ranked = field.slice().sort((a, b) => teamRating(b) - teamRating(a));
  if (TOURNAMENT_TYPES[type].groups) {
    const nGroups = size / 4;
    const groups = Array.from({ length: nGroups }, () => []);
    for (let pot = 0; pot < 4; pot++) {
      const potTeams = shuffle(ranked.slice(pot * nGroups, (pot + 1) * nGroups), rng);
      potTeams.forEach((t, g) => groups[g].push(t.id));
    }
    state.groups = groups.map((ids, g) => ({ name: `Group ${GROUP_NAMES[g]}`, ids }));
    const order = [
      [0, 1, 2, 3],
      [0, 2, 3, 1],
      [3, 0, 1, 2],
    ];
    state.groups.forEach((group, g) => {
      order.forEach(([a, b, c, d], day) => {
        addMatch(state, day, group.name, g, group.ids[a], group.ids[b]);
        addMatch(state, day, group.name, g, group.ids[c], group.ids[d]);
      });
    });
    state.stage = 'Group stage';
  } else {
    // Seeded bracket: top seeds can only meet late.
    const half = size / 2;
    const top = ranked.slice(0, half);
    const bottom = shuffle(ranked.slice(half), rng);
    const pairs = top.map((t, i) => [t.id, bottom[i].id]);
    const order = bracketOrder(half);
    addRound(state, 0, order.map((i) => pairs[i]).flat());
  }
  return state;
}

function bracketOrder(n) {
  // Standard seeding order, e.g. n=4 -> [0, 3, 1, 2]
  let order = [0];
  while (order.length < n) {
    const m = order.length * 2;
    order = order.flatMap((i) => [i, m - 1 - i]);
  }
  return order;
}

function addMatch(state, day, stage, group, home, away) {
  state.matches.push({
    id: `m${state.matches.length}`,
    day,
    stage,
    group,
    home,
    away,
    hs: null,
    as: null,
    pens: null,
    played: false,
    knockout: group === null,
  });
}

function addRound(state, day, ids) {
  const stage = ROUND_NAMES[ids.length];
  state.stage = stage;
  for (let i = 0; i < ids.length; i += 2) addMatch(state, day, stage, null, ids[i], ids[i + 1]);
}

export function isUserMatch(state, m) {
  return m.home === state.userId || m.away === state.userId;
}

export function winnerOf(m) {
  if (!m.played) return null;
  if (m.hs !== m.as) return m.hs > m.as ? m.home : m.away;
  if (m.pens) return m.pens[0] > m.pens[1] ? m.home : m.away;
  return null;
}

export function standings(state, g) {
  const rows = new Map(
    state.groups[g].ids.map((id) => [id, { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }]),
  );
  for (const m of state.matches) {
    if (m.group !== g || !m.played) continue;
    const h = rows.get(m.home);
    const a = rows.get(m.away);
    h.p++;
    a.p++;
    h.gf += m.hs;
    h.ga += m.as;
    a.gf += m.as;
    a.ga += m.hs;
    if (m.hs > m.as) {
      h.w++;
      a.l++;
      h.pts += 3;
    } else if (m.hs < m.as) {
      a.w++;
      h.l++;
      a.pts += 3;
    } else {
      h.d++;
      a.d++;
      h.pts++;
      a.pts++;
    }
  }
  const list = [...rows.values()];
  list.forEach((r) => (r.gd = r.gf - r.ga));
  return list.sort(
    (x, y) =>
      y.pts - x.pts ||
      y.gd - x.gd ||
      y.gf - x.gf ||
      state.teams[x.id].name.localeCompare(state.teams[y.id].name),
  );
}

export function nextUserMatch(state) {
  return state.matches.find((m) => !m.played && isUserMatch(state, m)) || null;
}

export function recordResult(state, matchId, { hs, as, pens = null }) {
  const m = state.matches.find((x) => x.id === matchId);
  if (!m || m.played) return;
  m.hs = hs;
  m.as = as;
  m.pens = m.knockout && hs === as ? pens : null;
  m.played = true;
}

// Quick result for matches the player doesn't play: Poisson goals weighted by strength.
export function simulateScore(home, away, rng, knockout) {
  const diff = teamRating(home) - teamRating(away);
  const poisson = (lambda) => {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rng();
    } while (p > L);
    return k - 1;
  };
  const hs = poisson(1.3 * Math.pow(10, diff / 60));
  const as = poisson(1.3 * Math.pow(10, -diff / 60));
  const pens = knockout && hs === as ? penaltyShootout(home, away, rng) : null;
  return { hs, as, pens };
}

export function simulateMatch(state, m) {
  const rng = mulberry32(hashString(`${state.seed}:${m.id}`));
  recordResult(state, m.id, simulateScore(state.teams[m.home], state.teams[m.away], rng, m.knockout));
}

// Moves the tournament forward until the user's next match (or the end).
// With all=true it also simulates the user's own matches (used after elimination or "simulate to end").
export function progress(state, { all = false } = {}) {
  for (let guard = 0; guard < 200 && !state.done; guard++) {
    const pending = state.matches.filter((m) => !m.played);
    if (!pending.length) {
      const stageChanged = advanceStage(state);
      if (!all && state.eliminated && stageChanged) return state;
      continue;
    }
    const day = Math.min(...pending.map((m) => m.day));
    const today = pending.filter((m) => m.day === day);
    let waiting = false;
    for (const m of today) {
      if (isUserMatch(state, m) && !all) waiting = true;
      else simulateMatch(state, m);
    }
    if (waiting) return state;
  }
  return state;
}

// Returns true if a new knockout round was created.
function advanceStage(state) {
  const last = state.matches[state.matches.length - 1];
  const nextDay = last.day + 1;
  let ids;
  if (!last.knockout) {
    // Group stage finished: winners face runners-up of the paired group, halves kept apart.
    const tables = state.groups.map((_, g) => standings(state, g));
    const firstHalf = [];
    const secondHalf = [];
    for (let g = 0; g < tables.length; g += 2) {
      firstHalf.push(tables[g][0].id, tables[g + 1][1].id);
      secondHalf.push(tables[g + 1][0].id, tables[g][1].id);
    }
    ids = [...firstHalf, ...secondHalf];
  } else {
    const round = state.matches.filter((m) => m.day === last.day);
    ids = round.map(winnerOf);
    if (ids.length === 1) {
      state.done = true;
      state.champion = ids[0];
      state.stage = 'Finished';
      return false;
    }
  }
  if (!ids.includes(state.userId)) state.eliminated = true;
  addRound(state, nextDay, ids);
  return true;
}

// How far the user's team got, for the trophy cabinet.
export function userFinish(state) {
  if (state.champion === state.userId) return 'Champion';
  const final = state.matches.find((m) => m.stage === 'Final');
  if (final?.played && isUserMatch(state, final)) return 'Runner-up';
  const userMatches = state.matches.filter((m) => isUserMatch(state, m));
  const lastKo = [...userMatches].reverse().find((m) => m.knockout);
  if (lastKo) return lastKo.stage;
  return 'Group stage';
}
