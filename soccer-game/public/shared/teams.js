import { COUNTRIES } from './countries.js';
import { hashString } from './rng.js';

// 5-a-side: index 0 is the goalkeeper, 1-4 are outfield players.
// Positions are attack-normalised: x 0 = own goal line, 1 = opponent goal line; y 0..1 across the pitch.
export const FORMATIONS = {
  diamond: { label: 'Diamond (1-2-1)', spots: [[0.22, 0.5], [0.4, 0.22], [0.4, 0.78], [0.58, 0.5]] },
  box: { label: 'Box (2-2)', spots: [[0.24, 0.3], [0.24, 0.7], [0.5, 0.3], [0.5, 0.7]] },
  attack: { label: 'Attack (1-1-2)', spots: [[0.24, 0.5], [0.4, 0.5], [0.58, 0.28], [0.58, 0.72]] },
};

export const POSITIONS = ['GK', 'DEF', 'MID', 'MID', 'FWD'];
export const SHIRT_NUMBERS = [1, 4, 8, 6, 10];

export const STAT_MIN = 40;
export const STAT_MAX = 90;
export const CUSTOM_BUDGET = 225; // att + def + spd, an average of 75
export const BADGES = ['⚽', '🦁', '🦅', '🐺', '🐉', '🔥', '⭐', '👑', '⚡', '🌙', '🛡️', '🐯', '🦈', '🐍', '🌪️', '🏆'];

const HEX = /^#[0-9a-f]{6}$/i;

export function flagEmoji(iso) {
  return String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function countryTeam(c) {
  // Give each nation a small, stable personality around its strength.
  const h = hashString(c.iso);
  const jitter = (shift) => ((h >>> shift) % 9) - 4;
  const formations = Object.keys(FORMATIONS);
  return {
    id: c.iso,
    custom: false,
    name: c.name,
    short: c.code,
    badge: flagEmoji(c.iso),
    conf: c.conf,
    primary: c.primary,
    secondary: c.secondary,
    formation: formations[h % formations.length],
    att: clamp(c.rating + jitter(3), 20, 95),
    def: clamp(c.rating + jitter(9), 20, 95),
    spd: clamp(c.rating + jitter(15), 20, 95),
    players: SHIRT_NUMBERS.map((n) => `#${n}`),
  };
}

export const NATIONAL_TEAMS = COUNTRIES.map(countryTeam);
const NATIONAL_BY_ID = new Map(NATIONAL_TEAMS.map((t) => [t.id, t]));

export function nationalTeam(id) {
  return NATIONAL_BY_ID.get(id) || null;
}

export function teamRating(team) {
  return Math.round((team.att + team.def + team.spd) / 3);
}

function cleanText(value, max, fallback) {
  const s = String(value ?? '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .trim()
    .slice(0, max);
  return s || fallback;
}

// Validates a custom team from local storage or from the network. Never trust the input.
export function sanitizeCustomTeam(input) {
  if (!input || typeof input !== 'object') return null;
  let att = clamp(Math.round(Number(input.att) || STAT_MIN), STAT_MIN, STAT_MAX);
  let def = clamp(Math.round(Number(input.def) || STAT_MIN), STAT_MIN, STAT_MAX);
  let spd = clamp(Math.round(Number(input.spd) || STAT_MIN), STAT_MIN, STAT_MAX);
  // Over budget: take points off the highest stat until it fits.
  while (att + def + spd > CUSTOM_BUDGET) {
    if (att >= def && att >= spd) att--;
    else if (def >= spd) def--;
    else spd--;
  }
  const name = cleanText(input.name, 20, 'My Team');
  const shortRaw = String(input.short ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  const short = shortRaw.length === 3 ? shortRaw : name.toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(3, 'X').slice(0, 3);
  const players = POSITIONS.map((pos, i) => cleanText(input.players?.[i], 14, `${pos} ${SHIRT_NUMBERS[i]}`));
  const id = /^c_[a-z0-9]{4,16}$/.test(String(input.id)) ? input.id : `c_${hashString(name + Date.now()).toString(36)}`;
  return {
    id,
    custom: true,
    name,
    short,
    badge: BADGES.includes(input.badge) ? input.badge : BADGES[0],
    conf: null,
    primary: HEX.test(input.primary) ? input.primary.toLowerCase() : '#1d4ed8',
    secondary: HEX.test(input.secondary) ? input.secondary.toLowerCase() : '#ffffff',
    formation: FORMATIONS[input.formation] ? input.formation : 'diamond',
    att,
    def,
    spd,
    players,
  };
}

// Resolve a team reference sent by a client: national teams by id, custom teams validated.
export function resolveTeam(ref) {
  if (!ref || typeof ref !== 'object') return null;
  if (!ref.custom) return nationalTeam(String(ref.id));
  return sanitizeCustomTeam(ref);
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function colorDistance(a, b) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

const ALTERNATE_KITS = [
  ['#ffffff', '#111827'],
  ['#111827', '#ffffff'],
  ['#7c3aed', '#ffffff'],
  ['#0ea5e9', '#0f172a'],
];
const KEEPER_KITS = ['#a3e635', '#f472b6', '#22d3ee', '#f59e0b', '#64748b'];

// Picks kits so the two teams and both keepers can be told apart.
export function matchKits(home, away) {
  const h = { primary: home.primary, secondary: home.secondary };
  let a = { primary: away.primary, secondary: away.secondary };
  if (colorDistance(h.primary, a.primary) < 120) {
    const swapped = { primary: away.secondary, secondary: away.primary };
    if (colorDistance(h.primary, swapped.primary) >= 120) a = swapped;
    else {
      const alt = ALTERNATE_KITS.find(([p]) => colorDistance(h.primary, p) >= 160) || ALTERNATE_KITS[0];
      a = { primary: alt[0], secondary: alt[1] };
    }
  }
  const keeper = (avoid) =>
    KEEPER_KITS.slice().sort(
      (x, y) => Math.min(...avoid.map((c) => colorDistance(y, c))) - Math.min(...avoid.map((c) => colorDistance(x, c))),
    )[0];
  const gkHome = keeper([h.primary, a.primary]);
  const gkAway = keeper([h.primary, a.primary, gkHome]);
  return [
    { ...h, keeper: gkHome },
    { ...a, keeper: gkAway },
  ];
}
