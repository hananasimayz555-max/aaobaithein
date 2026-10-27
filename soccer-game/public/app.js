import { CONFEDERATIONS } from './shared/countries.js';
import {
  NATIONAL_TEAMS,
  FORMATIONS,
  POSITIONS,
  BADGES,
  CUSTOM_BUDGET,
  STAT_MIN,
  STAT_MAX,
  sanitizeCustomTeam,
  teamRating,
  matchKits,
  nationalTeam,
} from './shared/teams.js';
import { createMatch, step, viewFromMatch, matchResult } from './shared/engine.js';
import {
  TOURNAMENT_TYPES,
  createTournament,
  progress,
  nextUserMatch,
  recordResult,
  simulateMatch,
  standings,
  winnerOf,
  isUserMatch,
  userFinish,
  tournamentSize,
} from './shared/tournament.js';
import { randomSeed } from './shared/rng.js';
import { createRenderer } from './render.js';
import { createControls } from './controls.js';
import { playEvent, setSound, unlockAudio } from './audio.js';
import { load, save, clearAll, DEFAULT_PROFILE, DEFAULT_RECORD } from './storage.js';
import { connect, serverUrl } from './net.js';

const $app = document.getElementById('app');
// Hosts without the game server (e.g. a static preview) set <meta name="kickoff-online" content="off">.
const ONLINE_AVAILABLE = document.querySelector('meta[name="kickoff-online"]')?.content !== 'off';

const state = {
  screen: 'home',
  params: {},
  profile: { ...DEFAULT_PROFILE, ...load('profile', {}) },
  record: { ...DEFAULT_RECORD, ...load('record', {}) },
  customTeams: load('customTeams', []).map(sanitizeCustomTeam).filter(Boolean),
  tournament: load('tournament', null),
  history: load('history', []),
  quick: null,
  edit: null,
  net: { status: 'idle', msg: '', code: '', ping: null, players: null, conn: null },
  online: navigator.onLine,
  installPrompt: null,
};
state.quick = { home: state.profile.teamId, away: 'random', difficulty: state.profile.difficulty, duration: state.profile.duration };
setSound(state.profile.sound);

let pickCallback = null;
let activeMatch = null;

const DURATIONS = [
  [120, '2 min'],
  [180, '3 min'],
  [300, '5 min'],
];
const DIFFS = [
  ['easy', 'Easy'],
  ['normal', 'Normal'],
  ['hard', 'Hard'],
];

// ---------- helpers ----------

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function allTeams() {
  return [...state.customTeams, ...NATIONAL_TEAMS];
}

function teamById(id) {
  return state.customTeams.find((t) => t.id === id) || nationalTeam(id);
}

function persist() {
  save('profile', state.profile);
  save('record', state.record);
  save('customTeams', state.customTeams);
  save('tournament', state.tournament);
  save('history', state.history);
}

function go(screen, params = {}) {
  state.screen = screen;
  state.params = params;
  render();
  window.scrollTo(0, 0);
}

function teamCard(team, { action = '', data = '', extra = '' } = {}) {
  if (!team) return `<div class="team-card empty">Pick a team</div>`;
  return `<button class="team-card" ${action ? `data-action="${action}"` : ''} ${data}>
    <span class="badge">${esc(team.badge)}</span>
    <span class="tc-main"><b>${esc(team.name)}</b><small>${team.custom ? 'Custom team' : esc(CONFEDERATIONS[team.conf])} · OVR ${teamRating(team)}</small></span>
    <span class="kit" style="--p:${team.primary};--s:${team.secondary}"></span>${extra}
  </button>`;
}

function segmented(name, options, value) {
  return `<div class="seg" role="radiogroup">${options
    .map(
      ([v, label]) =>
        `<button role="radio" aria-checked="${String(v) === String(value)}" class="${String(v) === String(value) ? 'on' : ''}" data-action="seg" data-name="${name}" data-value="${v}">${label}</button>`,
    )
    .join('')}</div>`;
}

function header(title, back = 'home') {
  return `<header class="bar"><button class="back" data-action="go" data-to="${back}" aria-label="Back">‹</button><h1>${esc(title)}</h1></header>`;
}

// In-page confirmation dialog (native confirm() is blocked in some embedded views).
function ask(message, okLabel = 'OK') {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'overlay ask';
    el.innerHTML = `<div class="sheet" role="alertdialog" aria-modal="true"><p>${esc(message)}</p>
      <div class="row"><button data-a="no">Cancel</button><button class="danger-solid" data-a="yes">${esc(okLabel)}</button></div></div>`;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      el.remove();
      resolve(b.dataset.a === 'yes');
    });
    document.body.appendChild(el);
    el.querySelector('[data-a="no"]').focus();
  });
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------- screens ----------

const screens = {
  home() {
    const fav = teamById(state.profile.teamId);
    const t = state.tournament;
    return `<main class="home">
      <div class="logo"><span>⚽</span><h1>Kickoff World</h1><p>193 nations · your team · your cup</p></div>
      <div class="status ${state.online ? 'on' : 'off'}">${state.online ? 'Online' : 'Offline: you can still play vs CPU and tournaments'}</div>
      <nav class="menu">
        <button class="primary" data-action="go" data-to="quick">Quick match</button>
        <button data-action="go" data-to="tournament">${t && !t.done ? `Continue: ${esc(t.name)}` : 'Tournaments'}</button>
        <button data-action="go" data-to="online" ${state.online && ONLINE_AVAILABLE ? '' : 'disabled'}>${ONLINE_AVAILABLE ? 'Online 1v1' : 'Online 1v1 (needs the game server)'}</button>
        <button data-action="go" data-to="teams">My teams</button>
        <div class="row">
          <button data-action="go" data-to="stats">Stats &amp; trophies</button>
          <button data-action="go" data-to="settings">Settings</button>
        </div>
        ${state.installPrompt ? '<button class="ghost" data-action="install">Install app on this phone</button>' : ''}
      </nav>
      <p class="fav">Favourite team: ${fav ? `${esc(fav.badge)} ${esc(fav.name)}` : '—'}</p>
    </main>`;
  },

  pick() {
    const { title = 'Choose a team', conf = null } = state.params;
    const chips = conf
      ? ''
      : `<div class="chips">${[['', 'All'], ...Object.entries(CONFEDERATIONS)]
          .map(([k, v]) => `<button class="chip ${k === '' ? 'on' : ''}" data-action="pick-filter" data-conf="${k}">${esc(v)}</button>`)
          .join('')}</div>`;
    return `${header(title, state.params.back || 'home')}
      <main class="picker">
        <div class="pick-tools">
          <input id="pick-search" type="search" placeholder="Search 193 nations…" autocomplete="off" aria-label="Search teams">
          <select id="pick-sort" aria-label="Sort teams"><option value="name">A–Z</option><option value="rating">Strongest</option></select>
        </div>
        ${chips}
        <div id="pick-list" class="team-list"></div>
      </main>`;
  },

  quick() {
    const q = state.quick;
    const home = teamById(q.home);
    const away = q.away === 'random' ? null : teamById(q.away);
    return `${header('Quick match')}
      <main class="form">
        <label>Your team</label>
        ${teamCard(home, { action: 'pick-quick', data: 'data-slot="home"' })}
        <label>Opponent</label>
        ${
          away
            ? teamCard(away, { action: 'pick-quick', data: 'data-slot="away"' })
            : '<button class="team-card empty" data-action="pick-quick" data-slot="away">🎲 Random opponent (tap to choose)</button>'
        }
        ${away ? '<button class="link" data-action="quick-random">Use a random opponent</button>' : ''}
        <label>Difficulty</label>${segmented('difficulty', DIFFS, q.difficulty)}
        <label>Match length</label>${segmented('duration', DURATIONS, q.duration)}
        <button class="primary big" data-action="quick-start">Kick off</button>
        <p class="hint">Controls: left side of the screen = move. SHOOT (hold for power) · PASS (or switch player when defending) · SPRINT. Keyboard: arrows/WASD, Space shoot, J pass, Shift sprint.</p>
      </main>`;
  },

  tournament() {
    const t = state.tournament;
    if (!t) return screens['tournament-new']();
    const user = t.teams[t.userId];
    const next = nextUserMatch(t);
    let action = '';
    if (t.done) {
      const champ = t.teams[t.champion];
      action = `<div class="card champion">
        <div class="trophy">🏆</div>
        <h2>${esc(champ.badge)} ${esc(champ.name)}</h2>
        <p>${t.champion === t.userId ? 'You won the tournament!' : `Your finish: ${esc(userFinish(t))}`}</p>
        <button class="primary" data-action="tour-close">Finish &amp; save to history</button>
      </div>`;
    } else if (t.eliminated) {
      action = `<div class="card"><h2>You're out</h2><p>${esc(user.name)} were eliminated (${esc(userFinish(t))}).</p>
        <button class="primary" data-action="tour-sim-all">Simulate to the end</button></div>`;
    } else if (next) {
      const opp = t.teams[next.home === t.userId ? next.away : next.home];
      action = `<div class="card next">
        <small>${esc(next.stage)}${next.group !== null ? ` · Matchday ${next.day + 1}` : ''}</small>
        <h2>${esc(user.badge)} ${esc(user.short)} <span>vs</span> ${esc(opp.short)} ${esc(opp.badge)}</h2>
        <p>${esc(opp.name)} · OVR ${teamRating(opp)}</p>
        <div class="row"><button class="primary" data-action="tour-play">Play match</button><button data-action="tour-sim">Simulate</button></div>
      </div>`;
    }
    const groups = t.groups
      .map((g, gi) => {
        const rows = standings(t, gi)
          .map(
            (r, i) => `<tr class="${r.id === t.userId ? 'me' : ''} ${i < 2 ? 'q' : ''}">
              <td>${esc(t.teams[r.id].badge)} ${esc(t.teams[r.id].short)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`,
          )
          .join('');
        return `<div class="group"><h3>${esc(g.name)}</h3><table><thead><tr><th></th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      })
      .join('');
    const koStages = [...new Set(t.matches.filter((m) => m.knockout).map((m) => m.stage))];
    const ko = koStages
      .map(
        (stage) => `<div class="round"><h3>${esc(stage)}</h3>${t.matches
          .filter((m) => m.knockout && m.stage === stage)
          .map((m) => fixtureRow(t, m))
          .join('')}</div>`,
      )
      .join('');
    return `${header(t.name)}
      <main class="tour">
        <p class="sub">${esc(user.badge)} ${esc(user.name)} · ${esc(t.stage)} · ${esc(DIFFS.find((d) => d[0] === t.difficulty)?.[1] || '')}</p>
        ${action}
        ${ko ? `<section><h2>Knockouts</h2>${ko}</section>` : ''}
        ${groups ? `<section><h2>Groups</h2><div class="groups">${groups}</div></section>` : ''}
        ${t.groups.length ? `<section><h2>Group results</h2>${t.matches.filter((m) => !m.knockout && m.played).map((m) => fixtureRow(t, m)).join('') || '<p class="hint">No results yet.</p>'}</section>` : ''}
        <button class="danger" data-action="tour-abandon">Abandon tournament</button>
      </main>`;
  },

  'tournament-new'() {
    const p = state.params;
    const type = p.type || 'world';
    const conf = p.conf || 'E';
    const team = teamById(p.teamId || state.profile.teamId);
    const fits = team && (type !== 'continental' || team.custom || team.conf === conf);
    const size = tournamentSize(type, NATIONAL_TEAMS, conf);
    const history = state.history
      .slice(-10)
      .reverse()
      .map((h) => `<li>${h.finish === 'Champion' ? '🏆' : '·'} ${esc(h.name)}: ${esc(h.team)} (${esc(h.finish)}), won by ${esc(h.champion)}</li>`)
      .join('');
    return `${header('New tournament')}
      <main class="form">
        <label>Competition</label>
        ${segmented('tour-type', Object.entries(TOURNAMENT_TYPES).map(([k, v]) => [k, v.label]), type)}
        <p class="hint">${esc(TOURNAMENT_TYPES[type].blurb)}${type === 'continental' ? ` (${size} teams)` : ''}</p>
        ${
          type === 'continental'
            ? `<label for="tour-conf">Region</label><select id="tour-conf" data-action-change="tour-conf">${Object.entries(CONFEDERATIONS)
                .map(([k, v]) => `<option value="${k}" ${k === conf ? 'selected' : ''}>${esc(v)}</option>`)
                .join('')}</select>`
            : ''
        }
        <label>Your team</label>
        ${teamCard(team, { action: 'tour-pick' })}
        ${fits ? '' : `<p class="warn">${esc(team?.name || 'This team')} is not in ${esc(CONFEDERATIONS[conf])}. Pick a team from that region or one of your custom teams.</p>`}
        <label>Difficulty</label>${segmented('tour-diff', DIFFS, p.difficulty || state.profile.difficulty)}
        <label>Match length</label>${segmented('tour-dur', DURATIONS, p.duration || state.profile.duration)}
        <button class="primary big" data-action="tour-create" ${fits ? '' : 'disabled'}>Start tournament</button>
        ${history ? `<section><h2>Past tournaments</h2><ul class="history">${history}</ul></section>` : ''}
      </main>`;
  },

  online() {
    const n = state.net;
    const team = teamById(state.profile.teamId);
    let body;
    if (!state.online) body = `<div class="card"><h2>You're offline</h2><p>Online 1v1 needs an internet connection. Quick matches and tournaments work offline.</p></div>`;
    else if (n.status === 'connecting') body = `<div class="card"><div class="spinner"></div><p>Connecting…</p></div>`;
    else if (n.status === 'queued')
      body = `<div class="card"><div class="spinner"></div><h2>Finding an opponent…</h2><p>We'll match you with the next player who searches.</p><button data-action="net-cancel">Cancel</button></div>`;
    else if (n.status === 'room')
      body = `<div class="card"><h2>Room code</h2><div class="code">${esc(n.code)}</div><p>Send this code to your friend. The match starts when they join.</p>
        <div class="row"><button data-action="net-share">Share code</button><button data-action="net-cancel">Cancel</button></div></div>`;
    else
      body = `
        <label for="net-name">Your name</label>
        <input id="net-name" maxlength="16" value="${esc(state.profile.name)}" placeholder="Player" data-action-input="net-name">
        <label>Your team</label>
        ${teamCard(team, { action: 'net-pick' })}
        <button class="primary big" data-action="net-quick">Quick match (random opponent)</button>
        <button data-action="net-create">Create private room</button>
        <div class="join"><input id="net-code" maxlength="4" placeholder="CODE" autocapitalize="characters" aria-label="Room code"><button data-action="net-join">Join room</button></div>
        ${n.msg ? `<p class="warn">${esc(n.msg)}</p>` : ''}
        <p class="hint">Online matches last 3 minutes. Best on a stable connection (Wi-Fi or 4G).</p>`;
    const meta = n.conn ? `<p class="hint">${n.players ? `${n.players} players online` : ''}${n.ping != null ? ` · ping ${n.ping} ms` : ''}</p>` : '';
    return `${header('Online 1v1')}<main class="form">${body}${meta}</main>`;
  },

  teams() {
    const list = state.customTeams
      .map((t) => teamCard(t, { action: 'team-edit', data: `data-id="${esc(t.id)}"`, extra: '<span class="edit">Edit</span>' }))
      .join('');
    return `${header('My teams')}
      <main class="form">
        ${list || '<p class="hint">No custom teams yet. Build one with your own name, colours, badge, formation and players.</p>'}
        <button class="primary" data-action="team-new">+ Create a team</button>
      </main>`;
  },

  'team-edit'() {
    const e = state.edit;
    const left = CUSTOM_BUDGET - e.att - e.def - e.spd;
    const stat = (key, label) => `<div class="stat">
      <label for="st-${key}">${label} <b id="v-${key}">${e[key]}</b></label>
      <input type="range" id="st-${key}" min="${STAT_MIN}" max="${STAT_MAX}" value="${e[key]}" data-stat="${key}">
    </div>`;
    return `${header(e.isNew ? 'Create team' : 'Edit team', 'teams')}
      <main class="form editor">
        <div class="preview" id="preview">${previewHtml(e)}</div>
        <label for="f-name">Team name</label>
        <input id="f-name" maxlength="20" value="${esc(e.name)}" data-field="name">
        <label for="f-short">Short name (3 letters)</label>
        <input id="f-short" maxlength="3" value="${esc(e.short)}" data-field="short" autocapitalize="characters">
        <label>Badge</label>
        <div class="badges">${BADGES.map((b) => `<button class="${b === e.badge ? 'on' : ''}" data-action="badge" data-badge="${b}">${b}</button>`).join('')}</div>
        <div class="row colors">
          <label>Shirt <input type="color" value="${e.primary}" data-field="primary"></label>
          <label>Trim <input type="color" value="${e.secondary}" data-field="secondary"></label>
        </div>
        <label for="f-form">Formation</label>
        <select id="f-form" data-field="formation">${Object.entries(FORMATIONS)
          .map(([k, v]) => `<option value="${k}" ${k === e.formation ? 'selected' : ''}>${esc(v.label)}</option>`)
          .join('')}</select>
        <label>Skill points <span class="budget" id="budget">${left} left</span></label>
        ${stat('att', 'Attack')}${stat('def', 'Defence')}${stat('spd', 'Speed')}
        <label>Players</label>
        ${POSITIONS.map((pos, i) => `<div class="player-row"><span>${pos}</span><input maxlength="14" value="${esc(e.players[i])}" data-player="${i}" aria-label="${pos} name"></div>`).join('')}
        <button class="primary big" data-action="team-save">Save team</button>
        ${e.isNew ? '' : '<button class="danger" data-action="team-delete">Delete team</button>'}
      </main>`;
  },

  stats() {
    const r = state.record;
    const trophies = r.trophies
      .slice()
      .reverse()
      .map((x) => `<li>🏆 ${esc(x.name)} with ${esc(x.team)} <small>${new Date(x.date).toLocaleDateString()}</small></li>`)
      .join('');
    return `${header('Stats & trophies')}
      <main class="form">
        <div class="stats-grid">
          <div><b>${r.played}</b><small>Played</small></div>
          <div><b>${r.w}</b><small>Won</small></div>
          <div><b>${r.d}</b><small>Drawn</small></div>
          <div><b>${r.l}</b><small>Lost</small></div>
          <div><b>${r.gf}</b><small>Scored</small></div>
          <div><b>${r.ga}</b><small>Conceded</small></div>
        </div>
        <h2>Online</h2>
        <div class="stats-grid three"><div><b>${r.online.w}</b><small>Won</small></div><div><b>${r.online.d}</b><small>Drawn</small></div><div><b>${r.online.l}</b><small>Lost</small></div></div>
        <h2>Trophy cabinet</h2>
        ${trophies ? `<ul class="history">${trophies}</ul>` : '<p class="hint">Win a tournament to fill your cabinet.</p>'}
      </main>`;
  },

  settings() {
    const p = state.profile;
    const fav = teamById(p.teamId);
    return `${header('Settings')}
      <main class="form">
        <label for="s-name">Player name</label>
        <input id="s-name" maxlength="16" value="${esc(p.name)}" data-action-input="net-name">
        <label>Favourite team</label>
        ${teamCard(fav, { action: 'fav-pick' })}
        <label>Default difficulty</label>${segmented('def-diff', DIFFS, p.difficulty)}
        <label>Default match length</label>${segmented('def-dur', DURATIONS, p.duration)}
        <label class="toggle"><input type="checkbox" data-toggle="sound" ${p.sound ? 'checked' : ''}> Sound effects</label>
        <label class="toggle"><input type="checkbox" data-toggle="vibrate" ${p.vibrate ? 'checked' : ''}> Vibration</label>
        <details><summary>Advanced</summary>
          <label for="s-server">Online server address</label>
          <input id="s-server" placeholder="${esc(serverUrl('') || 'wss://your-server/ws')}" value="${esc(p.server)}" data-action-input="server">
          <p class="hint">Leave empty to use the server this app was loaded from.</p>
        </details>
        <button class="danger" data-action="reset">Reset all data</button>
        <p class="hint">Team strengths are game estimates, not official rankings.</p>
      </main>`;
  },
};

function fixtureRow(t, m) {
  const h = t.teams[m.home];
  const a = t.teams[m.away];
  const win = winnerOf(m);
  const score = m.played ? `${m.hs}–${m.as}${m.pens ? ` <small>(${m.pens[0]}–${m.pens[1]} p)</small>` : ''}` : 'vs';
  return `<div class="fixture ${isUserMatch(t, m) ? 'me' : ''}">
    <span class="${win === m.home ? 'w' : ''}">${esc(h.badge)} ${esc(h.short)}</span>
    <b>${score}</b>
    <span class="${win === m.away ? 'w' : ''}">${esc(a.short)} ${esc(a.badge)}</span>
  </div>`;
}

function previewHtml(e) {
  return `<span class="badge big">${esc(e.badge)}</span>
    <span class="shirt" style="--p:${e.primary};--s:${e.secondary}">${esc(e.short || '???')}</span>
    <div><b>${esc(e.name || 'My Team')}</b><small>OVR ${teamRating(e)}</small></div>`;
}

// ---------- rendering & events ----------

function render() {
  if (state.screen === 'match') return;
  $app.innerHTML = screens[state.screen]();
  if (state.screen === 'pick') renderPickList();
}

let pickFilter = { q: '', conf: '', sort: 'name' };

function renderPickList() {
  const { conf = null, customs = true } = state.params;
  const effectiveConf = conf || pickFilter.conf;
  const q = pickFilter.q.trim().toLowerCase();
  let list = allTeams().filter((t) => {
    if (t.custom && !customs) return false;
    if (effectiveConf && !t.custom && t.conf !== effectiveConf) return false;
    if (q && !t.name.toLowerCase().includes(q) && !t.short.toLowerCase().includes(q)) return false;
    return true;
  });
  const nat = list.filter((t) => !t.custom);
  nat.sort(pickFilter.sort === 'rating' ? (a, b) => teamRating(b) - teamRating(a) : (a, b) => a.name.localeCompare(b.name));
  list = [...list.filter((t) => t.custom), ...nat];
  const el = document.getElementById('pick-list');
  el.innerHTML =
    list.map((t) => teamCard(t, { action: 'pick', data: `data-id="${esc(t.id)}"` })).join('') ||
    '<p class="hint">No teams match your search.</p>';
}

function openPicker(params, cb) {
  pickCallback = cb;
  pickFilter = { q: '', conf: '', sort: 'name' };
  go('pick', params);
}

const actions = {
  go: (d) => go(d.to),
  install: async () => {
    const prompt = state.installPrompt;
    state.installPrompt = null;
    await prompt?.prompt();
    render();
  },
  seg: (d) => {
    const v = d.value;
    const num = Number(v);
    switch (d.name) {
      case 'difficulty':
        state.quick.difficulty = v;
        break;
      case 'duration':
        state.quick.duration = num;
        break;
      case 'tour-type':
        state.params.type = v;
        break;
      case 'tour-diff':
        state.params.difficulty = v;
        break;
      case 'tour-dur':
        state.params.duration = num;
        break;
      case 'def-diff':
        state.profile.difficulty = v;
        state.quick.difficulty = v;
        persist();
        break;
      case 'def-dur':
        state.profile.duration = num;
        state.quick.duration = num;
        persist();
        break;
      default:
        break;
    }
    render();
  },
  'pick-filter': (d, el) => {
    pickFilter.conf = d.conf;
    el.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === el));
    renderPickList();
  },
  pick: (d) => {
    const cb = pickCallback;
    pickCallback = null;
    cb?.(d.id);
  },
  'pick-quick': (d) =>
    openPicker({ title: d.slot === 'home' ? 'Your team' : 'Opponent', back: 'quick' }, (id) => {
      state.quick[d.slot] = id;
      if (d.slot === 'home') {
        state.profile.teamId = id;
        persist();
      }
      go('quick');
    }),
  'quick-random': () => {
    state.quick.away = 'random';
    render();
  },
  'quick-start': () => {
    const q = state.quick;
    const home = teamById(q.home);
    let away = q.away === 'random' ? null : teamById(q.away);
    if (!home) return toast('Pick your team first.');
    if (!away || away.id === home.id) {
      const pool = NATIONAL_TEAMS.filter((t) => t.id !== home.id && Math.abs(teamRating(t) - teamRating(home)) < 12);
      away = pool[Math.floor(Math.random() * pool.length)] || NATIONAL_TEAMS[0];
    }
    startLocalMatch({
      home,
      away,
      difficulty: q.difficulty,
      duration: q.duration,
      knockout: false,
      buttons: [
        ['Play again', () => actions['quick-start']()],
        ['Menu', () => go('home')],
      ],
    });
  },
  'tour-pick': () => {
    const p = { ...state.params };
    openPicker(
      { title: 'Your team', back: 'tournament', conf: p.type === 'continental' ? p.conf || 'E' : null },
      (id) => go('tournament-new', { ...p, teamId: id }),
    );
  },
  'tour-create': () => {
    const p = state.params;
    const type = p.type || 'world';
    const team = teamById(p.teamId || state.profile.teamId);
    state.tournament = createTournament({
      type,
      conf: type === 'continental' ? p.conf || 'E' : null,
      userTeam: team,
      pool: NATIONAL_TEAMS,
      seed: randomSeed(),
      difficulty: p.difficulty || state.profile.difficulty,
      duration: p.duration || state.profile.duration,
    });
    progress(state.tournament);
    persist();
    go('tournament');
  },
  'tour-play': () => {
    const t = state.tournament;
    const m = nextUserMatch(t);
    if (!m) return;
    const userHome = m.home === t.userId;
    const opp = t.teams[userHome ? m.away : m.home];
    startLocalMatch({
      home: t.teams[t.userId],
      away: opp,
      difficulty: t.difficulty,
      duration: t.duration,
      knockout: m.knockout,
      onResult: (res) => {
        const [u, o] = res.score;
        const pens = res.pens ? (userHome ? res.pens : [res.pens[1], res.pens[0]]) : null;
        recordResult(t, m.id, userHome ? { hs: u, as: o, pens } : { hs: o, as: u, pens });
        progress(t);
        if (t.done && t.champion === t.userId) {
          state.record.trophies.push({ name: t.name, team: t.teams[t.userId].name, date: Date.now() });
        }
        persist();
      },
      buttons: [['Continue', () => go('tournament')]],
      onQuit: () => go('tournament'),
    });
  },
  'tour-sim': () => {
    const t = state.tournament;
    const m = nextUserMatch(t);
    if (!m) return;
    simulateMatch(t, m);
    progress(t);
    if (t.done && t.champion === t.userId) state.record.trophies.push({ name: t.name, team: t.teams[t.userId].name, date: Date.now() });
    persist();
    render();
  },
  'tour-sim-all': () => {
    progress(state.tournament, { all: true });
    persist();
    render();
  },
  'tour-close': () => {
    const t = state.tournament;
    state.history.push({ name: t.name, team: t.teams[t.userId].name, finish: userFinish(t), champion: t.teams[t.champion].name, date: Date.now() });
    state.tournament = null;
    persist();
    go('tournament');
  },
  'tour-abandon': async () => {
    if (!(await ask('Abandon this tournament? Progress will be lost.', 'Abandon'))) return;
    state.tournament = null;
    persist();
    go('tournament');
  },
  'team-new': () => {
    state.edit = {
      isNew: true,
      id: undefined,
      name: 'My Team',
      short: 'MYT',
      badge: BADGES[1],
      primary: '#1d4ed8',
      secondary: '#ffffff',
      formation: 'diamond',
      att: 75,
      def: 75,
      spd: 75,
      players: POSITIONS.map((p, i) => `${p} ${[1, 4, 8, 6, 10][i]}`),
    };
    go('team-edit');
  },
  'team-edit': (d) => {
    const t = state.customTeams.find((x) => x.id === d.id);
    if (!t) return;
    state.edit = { ...t, players: t.players.slice(), isNew: false };
    go('team-edit');
  },
  badge: (d, el) => {
    state.edit.badge = d.badge;
    el.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el));
    updatePreview();
  },
  'team-save': () => {
    const team = sanitizeCustomTeam(state.edit);
    const i = state.customTeams.findIndex((t) => t.id === team.id);
    if (i >= 0) state.customTeams[i] = team;
    else state.customTeams.push(team);
    persist();
    toast('Team saved');
    go('teams');
  },
  'team-delete': async () => {
    if (!(await ask(`Delete ${state.edit.name}?`, 'Delete'))) return;
    state.customTeams = state.customTeams.filter((t) => t.id !== state.edit.id);
    if (state.profile.teamId === state.edit.id) state.profile.teamId = 'BR';
    persist();
    go('teams');
  },
  'fav-pick': () =>
    openPicker({ title: 'Favourite team', back: 'settings' }, (id) => {
      state.profile.teamId = id;
      state.quick.home = id;
      persist();
      go('settings');
    }),
  reset: async () => {
    if (!(await ask('Delete all teams, tournaments and stats on this device?', 'Delete all'))) return;
    clearAll();
    location.reload();
  },
  'net-pick': () =>
    openPicker({ title: 'Your team', back: 'online' }, (id) => {
      state.profile.teamId = id;
      persist();
      go('online');
    }),
  'net-quick': () => netAction({ t: 'quick' }),
  'net-create': () => netAction({ t: 'create' }),
  'net-join': () => {
    const code = document.getElementById('net-code').value.trim().toUpperCase();
    if (code.length !== 4) return toast('Enter the 4-character room code.');
    netAction({ t: 'join', code });
  },
  'net-cancel': () => {
    state.net.conn?.send({ t: 'cancel' });
    state.net.status = 'ready';
    render();
  },
  'net-share': async () => {
    const text = `Play me on Kickoff World! Room code: ${state.net.code}`;
    try {
      if (navigator.share) await navigator.share({ text, url: location.href });
      else {
        await navigator.clipboard.writeText(text);
        toast('Copied');
      }
    } catch {
      // share cancelled
    }
  },
};

$app.addEventListener('click', (e) => {
  unlockAudio();
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  actions[el.dataset.action]?.(el.dataset, el);
});

$app.addEventListener('input', (e) => {
  const el = e.target;
  if (el.id === 'pick-search') {
    pickFilter.q = el.value;
    renderPickList();
  } else if (el.dataset.actionInput === 'net-name') {
    state.profile.name = el.value.slice(0, 16);
    persist();
  } else if (el.dataset.actionInput === 'server') {
    state.profile.server = el.value.trim();
    persist();
  } else if (state.screen === 'team-edit') {
    const e2 = state.edit;
    if (el.dataset.field) e2[el.dataset.field] = el.dataset.field === 'short' ? el.value.toUpperCase() : el.value;
    if (el.dataset.player) e2.players[Number(el.dataset.player)] = el.value;
    if (el.dataset.stat) {
      const key = el.dataset.stat;
      const others = e2.att + e2.def + e2.spd - e2[key];
      const value = Math.min(Number(el.value), CUSTOM_BUDGET - others);
      el.value = value;
      e2[key] = value;
      document.getElementById(`v-${key}`).textContent = value;
      document.getElementById('budget').textContent = `${CUSTOM_BUDGET - e2.att - e2.def - e2.spd} left`;
    }
    updatePreview();
  }
});

$app.addEventListener('change', (e) => {
  const el = e.target;
  if (el.id === 'pick-sort') {
    pickFilter.sort = el.value;
    renderPickList();
  } else if (el.dataset.actionChange === 'tour-conf') {
    state.params.conf = el.value;
    render();
  } else if (el.dataset.toggle) {
    state.profile[el.dataset.toggle] = el.checked;
    setSound(state.profile.sound);
    persist();
  } else if (el.dataset.field === 'formation') {
    state.edit.formation = el.value;
  }
});

function updatePreview() {
  const el = document.getElementById('preview');
  if (el) el.innerHTML = previewHtml(state.edit);
}

// ---------- online ----------

function netAction(msg) {
  const team = teamById(state.profile.teamId);
  if (!team) return toast('Pick a team first.');
  const hello = { t: 'hello', name: state.profile.name || 'Player', team: team.custom ? team : { id: team.id } };
  const n = state.net;
  if (n.conn && n.status !== 'idle') {
    n.conn.send(hello);
    n.conn.send(msg);
    return;
  }
  const url = serverUrl(state.profile.server);
  if (!url) {
    n.msg = 'No online server set. Add one in Settings › Advanced.';
    return render();
  }
  n.status = 'connecting';
  n.msg = '';
  render();
  n.conn = connect(url, {
    open: () => {
      n.status = 'ready';
      n.conn.send(hello);
      n.conn.send(msg);
    },
    close: () => {
      const wasPlaying = state.screen === 'match' && activeMatch?.online && !activeMatch.ended;
      n.conn = null;
      n.status = 'idle';
      if (wasPlaying) {
        activeMatch.showMessage('Connection lost', 'The match could not continue.', [['Menu', () => go('online')]]);
      } else if (state.screen === 'online') {
        n.msg = n.msg || 'Could not reach the online server. Check your connection and try again.';
        render();
      }
    },
    ping: (ms) => {
      n.ping = ms;
    },
    message: onNetMessage,
  });
}

function onNetMessage(msg) {
  const n = state.net;
  switch (msg.t) {
    case 'welcome':
      n.players = msg.online;
      break;
    case 'queued':
      n.status = 'queued';
      if (state.screen === 'online') render();
      break;
    case 'room':
      n.status = 'room';
      n.code = msg.code;
      if (state.screen === 'online') render();
      break;
    case 'idle':
      n.status = 'ready';
      break;
    case 'error':
      n.msg = msg.msg;
      n.status = 'ready';
      if (state.screen === 'online') render();
      break;
    case 'start':
      n.status = 'playing';
      startOnlineMatch(msg);
      break;
    case 'ev':
      if (activeMatch?.online) msg.e.forEach((e) => activeMatch.onEvent(e));
      break;
    case 'end':
      if (activeMatch?.online) activeMatch.onEnd(msg.result);
      break;
    case 'rematch-request':
      if (activeMatch?.online) activeMatch.note('Your opponent wants a rematch!');
      break;
    case 'opponent-left':
      if (activeMatch?.online) activeMatch.onOpponentLeft(msg.result);
      break;
    default:
      break;
  }
}

// ---------- match screen ----------

function mountMatch({ teams, kits, flip, mySide, online }) {
  state.screen = 'match';
  $app.innerHTML = `<div class="match">
    <canvas id="pitch"></canvas>
    <div class="controls" id="controls"></div>
    <button class="pause" data-m="pause" aria-label="${online ? 'Leave match' : 'Pause'}">${online ? '✕' : 'II'}</button>
    <div class="banner" id="banner"></div>
    <div class="overlay hidden" id="overlay"></div>
    <div class="portrait-hint">Turn your phone sideways for the best view</div>
  </div>`;
  const canvas = document.getElementById('pitch');
  const renderer = createRenderer(canvas);
  const controls = createControls(document.getElementById('controls'));
  const banner = document.getElementById('banner');
  const overlay = document.getElementById('overlay');
  let bannerTimer = null;
  const m = {
    online,
    ended: false,
    paused: false,
    raf: 0,
    controls,
    renderer,
    teams,
    kits,
    flip,
    mySide,
    showBanner(text, ms = 1800) {
      banner.textContent = text;
      banner.classList.add('show');
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => banner.classList.remove('show'), ms);
    },
    showMessage(title, html, buttons) {
      overlay.innerHTML = `<div class="sheet"><h2>${esc(title)}</h2>${html}<div class="row" id="ov-buttons"></div></div>`;
      const row = overlay.querySelector('#ov-buttons');
      // A third tuple item `keep` leaves the match running (Resume, Rematch).
      for (const [label, fn, keep] of buttons) {
        const b = document.createElement('button');
        b.textContent = label;
        b.className = row.children.length ? '' : 'primary';
        b.addEventListener('click', () => {
          if (!keep) teardown();
          fn(b);
        });
        row.appendChild(b);
      }
      overlay.classList.remove('hidden');
    },
    hideMessage() {
      overlay.classList.add('hidden');
    },
    onEvent(e) {
      playEvent(e);
      if (e.type === 'goal') {
        const team = teams[e.side];
        m.showBanner(`GOAL! ${team.short}${e.scorer ? ` · ${e.scorer}${e.own ? ' (OG)' : ''}` : ''}`, 2200);
        if (state.profile.vibrate) navigator.vibrate?.(e.side === mySide ? [80, 60, 160] : 60);
      } else if (e.type === 'extra') m.showBanner('Extra time: next goal wins!', 2600);
      else if (e.type === 'save') m.showBanner('Great save!', 900);
      else if (e.type === 'tackle' && state.profile.vibrate && e.side === mySide) navigator.vibrate?.(25);
    },
  };
  function teardown() {
    cancelAnimationFrame(m.raf);
    controls.destroy();
    document.removeEventListener('visibilitychange', m.onVisibility);
    if (activeMatch === m) activeMatch = null;
  }
  m.teardown = teardown;
  try {
    document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
  } catch {
    // Not supported (e.g. iPhone Safari): portrait hint covers it.
  }
  activeMatch = m;
  return m;
}

function resultHtml(res, teams, mySide) {
  const [h, a] = res.score;
  const scorers = (side) =>
    res.goals
      .filter((g) => g.side === side)
      .map((g) => `<li>⚽ ${esc(g.scorer || teams[side].short)}${g.own ? ' (OG)' : ''} ${g.minute}'</li>`)
      .join('');
  const s = res.stats;
  const outcome = res.winner === -1 ? 'Draw' : res.winner === mySide ? 'You win!' : 'You lose';
  return `<p class="outcome">${outcome}</p>
    <div class="final">
      <div>${esc(teams[0].badge)}<b>${esc(teams[0].short)}</b></div>
      <div class="fs">${h} – ${a}${res.pens ? `<small>pens ${res.pens[0]}–${res.pens[1]}</small>` : ''}</div>
      <div>${esc(teams[1].badge)}<b>${esc(teams[1].short)}</b></div>
    </div>
    <div class="scorers"><ul>${scorers(0)}</ul><ul>${scorers(1)}</ul></div>
    <table class="mstats">
      <tr><td>${s.possPct[0]}%</td><th>Possession</th><td>${s.possPct[1]}%</td></tr>
      <tr><td>${s.shots[0]}</td><th>Shots</th><td>${s.shots[1]}</td></tr>
      <tr><td>${s.onTarget[0]}</td><th>On target</th><td>${s.onTarget[1]}</td></tr>
      <tr><td>${s.tackles[0]}</td><th>Tackles won</th><td>${s.tackles[1]}</td></tr>
    </table>`;
}

function addToRecord(res, mySide, online) {
  const r = state.record;
  const mine = res.score[mySide];
  const theirs = res.score[1 - mySide];
  const key = res.winner === -1 ? 'd' : res.winner === mySide ? 'w' : 'l';
  if (online) r.online[key]++;
  else {
    r.played++;
    r[key]++;
    r.gf += mine;
    r.ga += theirs;
  }
  persist();
}

function startLocalMatch({ home, away, difficulty, duration, knockout, onResult, buttons, onQuit }) {
  const teams = [home, away];
  const kits = matchKits(home, away);
  const s = createMatch({ home, away, duration, difficulty, knockout, humans: [true, false] });
  const m = mountMatch({ teams, kits, flip: false, mySide: 0, online: false });
  let acc = 0;
  let last = performance.now();
  const DT = 1 / 60;
  m.showBanner('Kick off!', 1200);
  playEvent({ type: 'whistle' });

  const pause = () => {
    if (m.ended || m.paused) return;
    m.paused = true;
    m.showMessage('Paused', '', [
      [
        'Resume',
        () => {
          m.paused = false;
          last = performance.now();
          m.hideMessage();
        },
        true,
      ],
      ['Quit match', () => (onQuit ? onQuit() : go('home'))],
    ]);
  };
  document.querySelector('.pause').addEventListener('click', pause);
  m.onVisibility = () => {
    if (document.hidden) pause();
  };
  document.addEventListener('visibilitychange', m.onVisibility);

  const frame = (now) => {
    m.raf = requestAnimationFrame(frame);
    if (m.paused) return;
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    const input = m.controls.read(false);
    while (acc >= DT) {
      const events = step(s, [input, null], DT);
      events.forEach((e) => m.onEvent(e));
      acc -= DT;
    }
    m.renderer.draw(viewFromMatch(s), { kits, teams, flip: false, mySide: 0 });
    if (s.phase === 'ended' && !m.ended) {
      m.ended = true;
      const res = matchResult(s);
      addToRecord(res, 0, false);
      onResult?.(res);
      setTimeout(() => {
        if (activeMatch === m) m.showMessage('Full time', resultHtml(res, teams, 0), buttons);
      }, 900);
    }
  };
  m.raf = requestAnimationFrame(frame);
}

function startOnlineMatch(msg) {
  if (activeMatch) activeMatch.teardown();
  const teams = msg.teams;
  const kits = matchKits(teams[0], teams[1]);
  const mySide = msg.side;
  const flip = mySide === 1;
  const m = mountMatch({ teams, kits, flip, mySide, online: true });
  const conn = state.net.conn;
  const opp = msg.names[1 - mySide];
  m.showBanner(`vs ${opp} · you are ${teams[mySide].short}`, 2200);
  playEvent({ type: 'whistle' });

  document.querySelector('.pause').addEventListener('click', async () => {
    if (m.ended || (await ask('Leave the match? It counts as a loss.', 'Leave'))) {
      if (!m.ended) {
        state.record.online.l++;
        persist();
      }
      conn?.send({ t: 'leave' });
      state.net.status = 'ready';
      m.teardown();
      go('online');
    }
  });
  m.onVisibility = () => {};

  const endButtons = () => [
    [
      'Rematch',
      (btn) => {
        conn?.send({ t: 'rematch' });
        btn.disabled = true;
        btn.textContent = 'Waiting for opponent…';
      },
      true,
    ],
    [
      'Leave',
      () => {
        conn?.send({ t: 'leave' });
        state.net.status = 'ready';
        go('online');
      },
    ],
  ];
  m.onEnd = (res) => {
    if (m.ended) return;
    m.ended = true;
    addToRecord(res, mySide, true);
    setTimeout(() => {
      if (activeMatch === m) m.showMessage('Full time', resultHtml(res, teams, mySide), endButtons());
    }, 900);
  };
  m.note = (text) => m.showBanner(text, 3000);
  m.onOpponentLeft = (res) => {
    const wasLive = !m.ended;
    m.ended = true;
    if (wasLive) {
      state.record.online.w++;
      persist();
    }
    state.net.status = 'ready';
    m.showMessage(
      'Opponent left',
      `<p>${esc(opp)} left the match.${wasLive ? ' You win by forfeit.' : ''}</p>${res ? resultHtml({ ...res, winner: mySide }, teams, mySide) : ''}`,
      [['Menu', () => go('online')]],
    );
  };

  const frame = () => {
    m.raf = requestAnimationFrame(frame);
    if (!m.ended) state.net.conn?.sendInput(m.controls.read(flip));
    const view = state.net.conn?.view();
    if (view) m.renderer.draw(view, { kits, teams, flip, mySide });
  };
  m.raf = requestAnimationFrame(frame);
}

// ---------- app shell ----------

window.addEventListener('online', () => {
  state.online = true;
  if (state.screen === 'home' || state.screen === 'online') render();
});
window.addEventListener('offline', () => {
  state.online = false;
  if (state.screen === 'home' || state.screen === 'online') render();
});
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  state.installPrompt = e;
  if (state.screen === 'home') render();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  try {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  } catch {
    // Not allowed here (e.g. sandboxed preview): the game still runs, just without offline install.
  }
}

render();
