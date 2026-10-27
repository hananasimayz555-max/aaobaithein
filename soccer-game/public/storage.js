// Everything is saved on the device, so the game works fully offline.
const PREFIX = 'kickoff-world.v1.';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the game still works for this session.
  }
}

export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export const DEFAULT_PROFILE = {
  name: '',
  teamId: 'BR',
  sound: true,
  vibrate: true,
  difficulty: 'normal',
  duration: 180,
  server: '',
};

export const DEFAULT_RECORD = {
  played: 0,
  w: 0,
  d: 0,
  l: 0,
  gf: 0,
  ga: 0,
  online: { w: 0, d: 0, l: 0 },
  trophies: [],
};
