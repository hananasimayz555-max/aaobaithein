// Match engine. Pure logic, no DOM: runs in the browser for offline play and on the server for online 1v1.
import { FORMATIONS, POSITIONS } from './teams.js';
import { mulberry32, randomSeed } from './rng.js';

export const W = 100; // pitch length
export const H = 60; // pitch width
export const GOAL_W = 16;
export const GOAL_D = 4;
export const PR = 1.4; // player radius
export const BR = 0.7; // ball radius
export const BOX_D = 14; // penalty box depth
export const BOX_W = 32;
const GY0 = H / 2 - GOAL_W / 2;
const GY1 = H / 2 + GOAL_W / 2;
const POST_R = 0.4;
const PER_TEAM = 5;

export const DIFFICULTY = {
  easy: { speed: 0.86, react: 0.5, noise: 0.22, tackle: -0.12 },
  normal: { speed: 0.95, react: 0.3, noise: 0.13, tackle: 0 },
  hard: { speed: 1.02, react: 0.14, noise: 0.07, tackle: 0.08 },
};

export const NEUTRAL_INPUT = Object.freeze({ mx: 0, my: 0, shoot: false, pass: false, sprint: false });

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const len = (x, y) => Math.sqrt(x * x + y * y);

export function createMatch({ home, away, duration = 180, difficulty = 'normal', humans = [true, false], knockout = false, seed }) {
  const s = {
    rng: mulberry32(seed ?? randomSeed()),
    teams: [makeTeam(home, 0), makeTeam(away, 1)],
    players: [],
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0, owner: -1, lastTouch: -1, target: -1 },
    clock: 0,
    duration,
    extra: false,
    knockout,
    humans: humans.slice(0, 2),
    diff: DIFFICULTY[difficulty] || DIFFICULTY.normal,
    phase: 'kickoff',
    phaseT: 0,
    score: [0, 0],
    pens: null,
    goals: [],
    stats: { shots: [0, 0], onTarget: [0, 0], poss: [0, 0], tackles: [0, 0] },
    events: [],
  };
  for (let t = 0; t < 2; t++) {
    for (let i = 0; i < PER_TEAM; i++) {
      s.players.push({
        id: t * PER_TEAM + i,
        team: t,
        idx: i,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        fx: t === 0 ? 1 : -1,
        fy: 0,
        stamina: 1,
        grabCd: 0,
        tackleCd: 0,
        protect: 0,
        lunge: 0,
        stun: 0,
        hold: 0,
        aiT: 0,
        aimX: 0,
        aimY: 0,
        sprint: false,
      });
    }
  }
  resetKickoff(s, 0);
  s.events = [{ type: 'whistle' }];
  return s;
}

function makeTeam(def, side) {
  return { def, side, dir: side === 0 ? 1 : -1, ctl: side * PER_TEAM + 4, charge: 0, prev: { ...NEUTRAL_INPUT } };
}

// Converts attack-normalised coordinates to world coordinates for a team.
function toWorld(team, nx, ny) {
  return team.side === 0 ? [nx * W, ny * H] : [(1 - nx) * W, ny * H];
}

function attackNorm(team, x) {
  return team.side === 0 ? x / W : 1 - x / W;
}

function resetKickoff(s, kickingSide) {
  const b = s.ball;
  b.x = W / 2;
  b.y = H / 2;
  b.vx = b.vy = 0;
  b.target = -1;
  for (const p of s.players) {
    const team = s.teams[p.team];
    let nx;
    let ny;
    if (p.idx === 0) [nx, ny] = [0.03, 0.5];
    else [nx, ny] = FORMATIONS[team.def.formation].spots[p.idx - 1];
    nx = Math.min(nx, 0.44);
    [p.x, p.y] = toWorld(team, nx, ny);
    p.vx = p.vy = 0;
    p.fx = team.dir;
    p.fy = 0;
    p.grabCd = p.tackleCd = p.lunge = p.stun = p.hold = 0;
    p.protect = 0;
  }
  const team = s.teams[kickingSide];
  const kicker = s.players[kickingSide * PER_TEAM + 4];
  kicker.x = W / 2 - team.dir * (PR + BR + 0.15);
  kicker.y = H / 2;
  kicker.protect = 1.5;
  b.owner = kicker.id;
  b.lastTouch = kicker.id;
  for (const t of s.teams) {
    t.ctl = t.side * PER_TEAM + 4;
    t.charge = 0;
  }
  s.phase = 'kickoff';
  s.phaseT = 1.0;
}

function maxSpeed(s, p) {
  const team = s.teams[p.team];
  let v = 11 + team.def.spd * 0.06;
  if (p.idx === 0) v *= 0.9;
  if (!s.humans[p.team]) v *= s.diff.speed;
  if (s.ball.owner === p.id) v *= 0.9;
  if (p.sprint && p.stamina > 0.05) v *= 1.3;
  if (p.lunge > 0) v *= 1.6;
  if (p.stun > 0) v *= 0.3;
  return v;
}

export function step(s, inputs, dt) {
  s.events = [];
  if (s.phase === 'ended') return s.events;
  if (s.phase === 'kickoff') {
    s.phaseT -= dt;
    readHumanButtons(s, inputs, false, dt);
    if (s.phaseT <= 0) s.phase = 'play';
    return s.events;
  }
  if (s.phase === 'goal') {
    s.phaseT -= dt;
    moveBall(s, dt, false);
    for (const p of s.players) {
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    if (s.phaseT <= 0) {
      const last = s.goals[s.goals.length - 1];
      resetKickoff(s, 1 - last.side);
      s.events.push({ type: 'whistle' });
    }
    return s.events;
  }

  s.clock += dt;
  const ownerP = s.ball.owner >= 0 ? s.players[s.ball.owner] : null;
  if (ownerP) s.stats.poss[ownerP.team] += dt;

  for (const p of s.players) {
    p.grabCd = Math.max(0, p.grabCd - dt);
    p.tackleCd = Math.max(0, p.tackleCd - dt);
    p.protect = Math.max(0, p.protect - dt);
    p.lunge = Math.max(0, p.lunge - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.sprint = false;
  }

  const desired = new Array(s.players.length);
  readHumanButtons(s, inputs, true, dt);
  for (const p of s.players) {
    const team = s.teams[p.team];
    if (s.humans[p.team] && team.ctl === p.id) {
      const inp = inputs?.[p.team] || NEUTRAL_INPUT;
      let mx = Number(inp.mx) || 0;
      let my = Number(inp.my) || 0;
      const m = len(mx, my);
      if (m > 1) {
        mx /= m;
        my /= m;
      }
      p.sprint = !!inp.sprint;
      const v = maxSpeed(s, p);
      desired[p.id] = [mx * v, my * v];
    } else {
      desired[p.id] = aiPlayer(s, p, dt);
    }
  }
  movePlayers(s, desired, dt);
  moveBall(s, dt, true);
  if (s.phase === 'play') resolvePossession(s);

  if (s.phase === 'play' && s.clock >= s.duration) endOfTime(s);
  return s.events;
}

function readHumanButtons(s, inputs, live, dt) {
  for (let t = 0; t < 2; t++) {
    if (!s.humans[t]) continue;
    const team = s.teams[t];
    const inp = inputs?.[t] || NEUTRAL_INPUT;
    const shootDown = !!inp.shoot;
    const passDown = !!inp.pass;
    const passPressed = passDown && !team.prev.pass;
    const shootPressed = shootDown && !team.prev.shoot;
    const shootReleased = !shootDown && team.prev.shoot;
    team.prev = { mx: 0, my: 0, shoot: shootDown, pass: passDown, sprint: !!inp.sprint };
    if (!live) continue;
    const p = s.players[team.ctl];
    if (s.ball.owner === p.id) {
      if (shootDown) team.charge = Math.min(1, team.charge + dt / 0.9);
      if (shootReleased) {
        humanShot(s, p, team.charge);
        team.charge = 0;
      } else if (passPressed) {
        team.charge = 0;
        pass(s, p, pickPassTarget(s, p, true));
      }
    } else {
      team.charge = 0;
      if (passPressed) switchPlayer(s, team);
      if (shootPressed && p.tackleCd <= 0 && p.lunge <= 0) {
        p.lunge = 0.3;
        p.tackleCd = 0;
      }
    }
  }
}

function switchPlayer(s, team) {
  const b = s.ball;
  let best = -1;
  let bestD = Infinity;
  for (let i = 1; i < PER_TEAM; i++) {
    const p = s.players[team.side * PER_TEAM + i];
    if (p.id === team.ctl) continue;
    const d = len(p.x - b.x, p.y - b.y);
    if (d < bestD) {
      bestD = d;
      best = p.id;
    }
  }
  if (best >= 0) team.ctl = best;
}

function movePlayers(s, desired, dt) {
  const accel = 70;
  for (const p of s.players) {
    let [dx, dy] = desired[p.id];
    let ax = dx - p.vx;
    let ay = dy - p.vy;
    const a = len(ax, ay);
    const maxA = accel * dt;
    if (a > maxA) {
      ax = (ax / a) * maxA;
      ay = (ay / a) * maxA;
    }
    p.vx += ax;
    p.vy += ay;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const sp = len(p.vx, p.vy);
    if (sp > 1.5) {
      // Turn smoothly toward the running direction.
      const k = Math.min(1, dt * 14);
      p.fx += (p.vx / sp - p.fx) * k;
      p.fy += (p.vy / sp - p.fy) * k;
      const f = len(p.fx, p.fy) || 1;
      p.fx /= f;
      p.fy /= f;
    }
    if (p.sprint && sp > 2) p.stamina = Math.max(0, p.stamina - dt * 0.28);
    else p.stamina = Math.min(1, p.stamina + dt * 0.12);
    if (p.idx === 0) {
      // Keepers stay in their box.
      const team = s.teams[p.team];
      const gx = team.side === 0 ? 0 : W;
      const minX = team.side === 0 ? PR : W - BOX_D;
      const maxX = team.side === 0 ? BOX_D : W - PR;
      p.x = clamp(p.x, Math.min(minX, gx + PR), maxX);
      p.y = clamp(p.y, H / 2 - BOX_W / 2, H / 2 + BOX_W / 2);
    }
    p.x = clamp(p.x, PR, W - PR);
    p.y = clamp(p.y, PR, H - PR);
  }
  // Soft separation so players do not overlap.
  for (let i = 0; i < s.players.length; i++) {
    for (let j = i + 1; j < s.players.length; j++) {
      const a = s.players[i];
      const b = s.players[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = len(dx, dy);
      const min = PR * 2;
      if (d > 0 && d < min) {
        const push = (min - d) / 2;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
      }
    }
  }
}

function moveBall(s, dt, live) {
  const b = s.ball;
  if (b.owner >= 0) {
    const p = s.players[b.owner];
    b.x = p.x + p.fx * (PR + BR + 0.15);
    b.y = p.y + p.fy * (PR + BR + 0.15);
    b.vx = p.vx;
    b.vy = p.vy;
    b.y = clamp(b.y, BR, H - BR);
    const inMouth = b.y > GY0 && b.y < GY1;
    if (!inMouth) b.x = clamp(b.x, BR, W - BR);
    if (live) checkGoal(s);
    return;
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  const f = Math.exp(-0.85 * dt);
  b.vx *= f;
  b.vy *= f;
  const inMouth = b.y > GY0 + BR * 0.3 && b.y < GY1 - BR * 0.3;
  const inNet = b.x < 0 || b.x > W;
  if (inNet) {
    // Inside the goal: the net stops the ball.
    if (b.y < GY0 + BR) {
      b.y = GY0 + BR;
      b.vy = Math.abs(b.vy) * 0.3;
    }
    if (b.y > GY1 - BR) {
      b.y = GY1 - BR;
      b.vy = -Math.abs(b.vy) * 0.3;
    }
    if (b.x < -GOAL_D + BR) {
      b.x = -GOAL_D + BR;
      b.vx = Math.abs(b.vx) * 0.2;
    }
    if (b.x > W + GOAL_D - BR) {
      b.x = W + GOAL_D - BR;
      b.vx = -Math.abs(b.vx) * 0.2;
    }
  } else {
    if (b.y < BR) {
      b.y = BR;
      b.vy = Math.abs(b.vy) * 0.7;
    }
    if (b.y > H - BR) {
      b.y = H - BR;
      b.vy = -Math.abs(b.vy) * 0.7;
    }
    if (!inMouth) {
      if (b.x < BR) {
        b.x = BR;
        b.vx = Math.abs(b.vx) * 0.7;
      }
      if (b.x > W - BR) {
        b.x = W - BR;
        b.vx = -Math.abs(b.vx) * 0.7;
      }
    }
  }
  for (const [px, py] of [
    [0, GY0],
    [0, GY1],
    [W, GY0],
    [W, GY1],
  ]) {
    const dx = b.x - px;
    const dy = b.y - py;
    const d = len(dx, dy);
    if (d < BR + POST_R && d > 0) {
      const nx = dx / d;
      const ny = dy / d;
      b.x = px + nx * (BR + POST_R);
      b.y = py + ny * (BR + POST_R);
      const dot = b.vx * nx + b.vy * ny;
      if (dot < 0) {
        b.vx -= 1.8 * dot * nx;
        b.vy -= 1.8 * dot * ny;
        if (live) s.events.push({ type: 'post' });
      }
    }
  }
  if (live) checkGoal(s);
}

function checkGoal(s) {
  const b = s.ball;
  if (s.phase !== 'play') return;
  if (b.y <= GY0 || b.y >= GY1) return;
  let side = -1;
  if (b.x < -BR) side = 1; // home defends the left goal
  else if (b.x > W + BR) side = 0;
  if (side < 0) return;
  const scorer = b.lastTouch >= 0 ? s.players[b.lastTouch] : null;
  const own = !!scorer && scorer.team !== side;
  s.score[side]++;
  const minute = Math.min(90, Math.floor((s.clock / s.duration) * 90) + 1);
  const goal = {
    side,
    minute: s.extra ? 90 + Math.ceil(((s.clock - s.duration + 60) / 60) * 30) : minute,
    scorer: scorer ? playerName(s, scorer) : '',
    own,
  };
  s.goals.push(goal);
  s.events.push({ type: 'goal', ...goal });
  if (b.owner >= 0) {
    b.vx = (side === 0 ? 1 : -1) * 6;
    b.owner = -1;
  }
  if (s.extra) {
    // Golden goal in extra time.
    finish(s);
    return;
  }
  s.phase = 'goal';
  s.phaseT = 2.2;
}

export function playerName(s, p) {
  const team = s.teams[p.team].def;
  return team.custom ? team.players[p.idx] : `${team.short} ${team.players[p.idx]}`;
}

function resolvePossession(s) {
  const b = s.ball;
  if (b.owner >= 0) {
    const o = s.players[b.owner];
    // Tackles: defenders close to the ball carrier try to win it.
    if (o.protect > 0 || (o.idx === 0 && o.hold > 0)) return;
    for (const q of s.players) {
      if (q.team === o.team || q.tackleCd > 0 || q.stun > 0) continue;
      const reach = PR * 2 + (q.lunge > 0 ? 1.4 : 0.5);
      if (len(q.x - o.x, q.y - o.y) > reach) continue;
      q.tackleCd = 0.5;
      const qt = s.teams[q.team].def;
      const ot = s.teams[o.team].def;
      let prob = 0.3 + (qt.def - ot.att) * 0.012 + (q.lunge > 0 ? 0.3 : 0);
      if (!s.humans[q.team]) prob += s.diff.tackle;
      prob = clamp(prob, 0.08, 0.85);
      if (s.rng() < prob) {
        takeBall(s, q);
        q.protect = 0.6;
        o.stun = 0.35;
        o.grabCd = 0.5;
        s.stats.tackles[q.team]++;
        s.events.push({ type: 'tackle', side: q.team });
        return;
      }
      if (q.lunge > 0) {
        q.stun = 0.6;
        q.lunge = 0;
      }
    }
    return;
  }
  const speed = len(b.vx, b.vy);
  let nearest = null;
  let nearestD = Infinity;
  for (const p of s.players) {
    if (p.grabCd > 0) continue;
    const d = len(p.x - b.x, p.y - b.y);
    const reach = PR + BR + (p.idx === 0 ? keeperReach(s, p) : 0.5);
    if (d < reach && d < nearestD) {
      nearest = p;
      nearestD = d;
    }
  }
  if (!nearest) return;
  const p = nearest;
  const tdef = s.teams[p.team].def;
  if (p.idx === 0 && inOwnBox(s, p, b.x, b.y)) {
    keeperSave(s, p, speed);
    return;
  }
  let thr = 20 + tdef.def * 0.1;
  if (b.target === p.id) thr += 10;
  if (speed < thr) {
    takeBall(s, p);
  } else {
    // Too fast to control: the ball deflects off the player.
    const nx = (b.x - p.x) / (nearestD || 1);
    const ny = (b.y - p.y) / (nearestD || 1);
    const dot = b.vx * nx + b.vy * ny;
    if (dot < 0) {
      b.vx = (b.vx - 2 * dot * nx) * 0.45;
      b.vy = (b.vy - 2 * dot * ny) * 0.45;
    }
    b.lastTouch = p.id;
    b.target = -1;
    p.grabCd = 0.2;
    s.events.push({ type: 'block' });
  }
}

function keeperReach(s, p) {
  return 0.9 + s.teams[p.team].def.def * 0.012;
}

function inOwnBox(s, p, x, y) {
  const team = s.teams[p.team];
  const ax = attackNorm(team, x) * W;
  return ax < BOX_D + 1 && Math.abs(y - H / 2) < BOX_W / 2 + 1;
}

function keeperSave(s, gk, speed) {
  const b = s.ball;
  const def = s.teams[gk.team].def.def;
  const shotFromOpponent = b.lastTouch >= 0 && s.players[b.lastTouch].team !== gk.team;
  if (speed < 14 || !shotFromOpponent) {
    takeBall(s, gk);
    gk.hold = 0.9;
    return;
  }
  let prob = 0.9 - (speed - 22) * 0.024 + (def - 70) * 0.01;
  if (!s.humans[gk.team]) prob += s.diff.tackle * 0.5;
  prob = clamp(prob, 0.12, 0.95);
  if (s.rng() < prob) {
    s.events.push({ type: 'save', side: gk.team });
    if (speed > 34 && s.rng() < 0.55) {
      // Parry away from goal.
      const team = s.teams[gk.team];
      const ang = (s.rng() - 0.5) * 1.6;
      const v = speed * 0.4;
      b.vx = Math.cos(ang) * v * team.dir;
      b.vy = Math.sin(ang) * v + (b.y < H / 2 ? -6 : 6);
      b.lastTouch = gk.id;
      b.target = -1;
      gk.grabCd = 0.5;
    } else {
      takeBall(s, gk);
      gk.hold = 0.9;
    }
  } else {
    gk.grabCd = 0.7; // beaten
  }
}

function takeBall(s, p) {
  const b = s.ball;
  const prevTeam = b.lastTouch >= 0 ? s.players[b.lastTouch].team : -1;
  b.owner = p.id;
  b.lastTouch = p.id;
  b.target = -1;
  b.vx = b.vy = 0;
  const team = s.teams[p.team];
  if (s.humans[p.team] && p.idx > 0) team.ctl = p.id;
  if (prevTeam !== p.team) s.events.push({ type: 'touch', side: p.team });
}

function release(s, p, vx, vy, grab = 0.3) {
  const b = s.ball;
  b.owner = -1;
  b.vx = vx;
  b.vy = vy;
  b.lastTouch = p.id;
  p.grabCd = grab;
  p.hold = 0;
  p.protect = 0;
}

function humanShot(s, p, charge) {
  const team = s.teams[p.team];
  const b = s.ball;
  const gx = team.dir > 0 ? W : 0;
  let dx = p.fx;
  let dy = p.fy;
  // Aim assist: if facing roughly at goal, aim at the point of the goal mouth you are facing.
  const toGoalX = gx - b.x;
  if (Math.sign(dx) === Math.sign(toGoalX) && Math.abs(dx) > 0.35) {
    const t = toGoalX / dx;
    const hitY = b.y + dy * t;
    if (hitY > GY0 - 8 && hitY < GY1 + 8) {
      const ty = clamp(hitY, GY0 + 1.2, GY1 - 1.2);
      const ax = gx - b.x;
      const ay = ty - b.y;
      const d = len(ax, ay);
      dx = ax / d;
      dy = ay / d;
    }
  }
  shoot(s, p, dx, dy, 0.45 + 0.55 * charge, charge > 0.95 ? 0.06 : 0);
}

function shoot(s, p, dx, dy, power, extraNoise) {
  const tdef = s.teams[p.team].def;
  const team = s.teams[p.team];
  let noise = 0.03 + 0.1 * (1 - tdef.att / 100) + extraNoise;
  if (!s.humans[p.team]) noise += s.diff.noise * 0.5;
  const ang = Math.atan2(dy, dx) + (s.rng() - 0.5) * 2 * noise;
  const v = power * (36 + tdef.att * 0.16);
  release(s, p, Math.cos(ang) * v, Math.sin(ang) * v, 0.35);
  s.ball.target = -1;
  // Count it as a shot if it is heading for the goal area.
  const gx = team.dir > 0 ? W : 0;
  const c = Math.cos(ang);
  if (Math.sign(c) === team.dir) {
    const t = (gx - s.ball.x) / c;
    const hitY = s.ball.y + Math.sin(ang) * t;
    if (Math.abs(gx - s.ball.x) < 45 && hitY > GY0 - 6 && hitY < GY1 + 6) {
      s.stats.shots[p.team]++;
      if (hitY > GY0 && hitY < GY1) s.stats.onTarget[p.team]++;
    }
  }
  s.events.push({ type: 'kick', power });
}

function pickPassTarget(s, p, useFacing) {
  let best = null;
  let bestScore = -Infinity;
  const team = s.teams[p.team];
  for (let i = 1; i < PER_TEAM; i++) {
    const m = s.players[p.team * PER_TEAM + i];
    if (m.id === p.id) continue;
    const dx = m.x - p.x;
    const dy = m.y - p.y;
    const d = len(dx, dy);
    if (d < 3) continue;
    let score;
    if (useFacing) {
      const cos = (dx * p.fx + dy * p.fy) / d;
      if (cos < 0.25) continue;
      score = cos * 2.2 - d / 60;
    } else {
      const open = nearestOpponentDist(s, m.team, m.x, m.y);
      const progress = (attackNorm(team, m.x) - attackNorm(team, p.x)) * W;
      if (!laneClear(s, p, m)) continue;
      score = Math.min(open, 10) * 0.25 + progress * 0.06 - d / 40;
    }
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

function laneClear(s, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const L2 = dx * dx + dy * dy;
  for (const q of s.players) {
    if (q.team === from.team) continue;
    const t = clamp(((q.x - from.x) * dx + (q.y - from.y) * dy) / L2, 0, 1);
    if (len(from.x + dx * t - q.x, from.y + dy * t - q.y) < 2.3) return false;
  }
  return true;
}

function nearestOpponentDist(s, team, x, y) {
  let best = Infinity;
  for (const q of s.players) {
    if (q.team === team) continue;
    best = Math.min(best, len(q.x - x, q.y - y));
  }
  return best;
}

function pass(s, p, mate) {
  let vx;
  let vy;
  if (mate) {
    const tx = mate.x + mate.vx * 0.35;
    const ty = mate.y + mate.vy * 0.35;
    const dx = tx - s.ball.x;
    const dy = ty - s.ball.y;
    const d = len(dx, dy) || 1;
    const v = clamp(10 + d * 0.9, 16, 34);
    vx = (dx / d) * v;
    vy = (dy / d) * v;
  } else {
    vx = p.fx * 22;
    vy = p.fy * 22;
  }
  release(s, p, vx, vy, 0.3);
  if (mate) {
    s.ball.target = mate.id;
    const team = s.teams[p.team];
    if (s.humans[p.team]) team.ctl = mate.id;
  }
  s.events.push({ type: 'kick', power: 0.4 });
}

// ---------- AI ----------

function aiPlayer(s, p, dt) {
  const team = s.teams[p.team];
  const b = s.ball;
  const cpu = !s.humans[p.team];
  const diff = cpu ? s.diff : DIFFICULTY.normal;
  const v = maxSpeed(s, p);
  if (p.idx === 0) return keeperAI(s, p, dt, v);

  const owner = b.owner >= 0 ? s.players[b.owner] : null;
  if (owner === p) return carrierAI(s, p, dt, diff);

  // Receiver of a pass runs to meet the ball.
  if (b.target === p.id && !owner) return seek(p, b.x + b.vx * 0.25, b.y + b.vy * 0.25, v, 0);

  const teamHasBall = owner && owner.team === p.team;
  if (!teamHasBall) {
    const chaserId = chaser(s, p.team);
    let chase = chaserId === p.id;
    if (!cpu) {
      // Human side: AI team-mates only chase loose balls the human is far from.
      const human = s.players[team.ctl];
      chase =
        chase &&
        !owner &&
        len(human.x - b.x, human.y - b.y) > len(p.x - b.x, p.y - b.y) + 6;
    }
    if (chase) {
      if (p.stamina > 0.3 && len(p.x - b.x, p.y - b.y) > 6) p.sprint = true;
      return seek(p, b.x + b.vx * 0.3, b.y + b.vy * 0.3, maxSpeed(s, p), 0);
    }
    if (cpu && second(s, p.team, chaserId) === p.id) {
      // Cover: stand between the ball and our goal.
      const [gx, gy] = toWorld(team, 0, 0.5);
      return seek(p, b.x + (gx - b.x) * 0.4, b.y + (gy - b.y) * 0.4, v * 0.9, 1);
    }
  }
  const [tx, ty] = formationSpot(s, p, teamHasBall);
  return seek(p, tx, ty, v * 0.85, 1);
}

function chaser(s, side) {
  const b = s.ball;
  let best = -1;
  let bestD = Infinity;
  for (let i = 1; i < PER_TEAM; i++) {
    const p = s.players[side * PER_TEAM + i];
    const d = len(p.x - b.x - b.vx * 0.3, p.y - b.y - b.vy * 0.3);
    if (d < bestD) {
      bestD = d;
      best = p.id;
    }
  }
  return best;
}

function second(s, side, exclude) {
  const b = s.ball;
  let best = -1;
  let bestD = Infinity;
  for (let i = 1; i < PER_TEAM; i++) {
    const p = s.players[side * PER_TEAM + i];
    if (p.id === exclude) continue;
    const d = len(p.x - b.x, p.y - b.y);
    if (d < bestD) {
      bestD = d;
      best = p.id;
    }
  }
  return best;
}

function formationSpot(s, p, teamHasBall) {
  const team = s.teams[p.team];
  const [fx, fy] = FORMATIONS[team.def.formation].spots[p.idx - 1];
  const ballN = attackNorm(team, s.ball.x);
  const nx = clamp(fx + (ballN - 0.5) * 0.55 + (teamHasBall ? 0.1 : -0.06), 0.08, 0.9);
  const ny = clamp(fy + (s.ball.y / H - 0.5) * 0.3, 0.06, 0.94);
  return toWorld(team, nx, ny);
}

function seek(p, tx, ty, v, slowRadius) {
  const dx = tx - p.x;
  const dy = ty - p.y;
  const d = len(dx, dy);
  if (d < 0.3) return [0, 0];
  const k = slowRadius > 0 ? Math.min(1, d / (slowRadius * 4)) : 1;
  return [(dx / d) * v * k, (dy / d) * v * k];
}

function carrierAI(s, p, dt, diff) {
  const team = s.teams[p.team];
  const gx = team.dir > 0 ? W : 0;
  const v = maxSpeed(s, p);
  p.aiT -= dt;
  if (p.aiT <= 0) {
    p.aiT = diff.react * (0.6 + s.rng() * 0.8);
    const distGoal = len(gx - p.x, H / 2 - p.y);
    const tdef = team.def;
    const pressure = nearestOpponentDist(s, p.team, p.x, p.y);
    const shootRange = 20 + tdef.att * 0.12;
    const angleOk = Math.abs(H / 2 - p.y) < Math.abs(gx - p.x) * 1.4;
    if (distGoal < shootRange && angleOk) {
      const gk = s.players[(1 - p.team) * PER_TEAM];
      const far = gk.y < H / 2 ? GY1 - 1.8 : GY0 + 1.8;
      const ty = far + (s.rng() - 0.5) * 3;
      const dx = gx - s.ball.x;
      const dy = ty - s.ball.y;
      const d = len(dx, dy);
      shoot(s, p, dx / d, dy / d, 0.75 + s.rng() * 0.25, diff.noise);
      return [p.vx, p.vy];
    }
    if ((pressure < 5 && s.rng() < 0.65) || s.rng() < 0.06) {
      const mate = pickPassTarget(s, p, false);
      if (mate) {
        pass(s, p, mate);
        return [p.vx, p.vy];
      }
    }
    // Dribble toward goal, sidestepping the nearest defender in the way.
    let tx = gx;
    let ty = H / 2 + (p.y - H / 2) * 0.5;
    for (const q of s.players) {
      if (q.team === p.team) continue;
      const ahead = (q.x - p.x) * team.dir;
      if (ahead > 0 && ahead < 9 && Math.abs(q.y - p.y) < 4) {
        ty = p.y + (q.y > p.y ? -10 : 10);
        tx = p.x + team.dir * 8;
        break;
      }
    }
    p.aimX = tx;
    p.aimY = clamp(ty, 4, H - 4);
  }
  return seek(p, p.aimX, p.aimY, v, 0);
}

function keeperAI(s, p, dt, v) {
  const team = s.teams[p.team];
  const b = s.ball;
  if (b.owner === p.id) {
    p.hold -= dt;
    p.protect = 0.2;
    if (p.hold <= 0) {
      const mate = pickPassTarget(s, p, false) || s.players[p.team * PER_TEAM + 1 + Math.floor(s.rng() * 4)];
      pass(s, p, mate);
    }
    return [0, 0];
  }
  const [gx] = toWorld(team, 0, 0.5);
  let tx = gx + team.dir * 2.2;
  let ty = H / 2 + (b.y - H / 2) * 0.45;
  ty = clamp(ty, GY0 + 1, GY1 - 1);
  const ballDist = len(b.x - gx, b.y - H / 2);
  const looseNearby = b.owner < 0 && ballDist < 16 && len(b.vx, b.vy) < 18;
  const carrierNear = b.owner >= 0 && s.players[b.owner].team !== p.team && ballDist < 12;
  if (looseNearby || carrierNear) {
    tx = b.x;
    ty = b.y;
  }
  return seek(p, tx, ty, v, looseNearby || carrierNear ? 0 : 0.5);
}

// ---------- end of match ----------

function endOfTime(s) {
  if (s.knockout && s.score[0] === s.score[1]) {
    if (!s.extra) {
      s.extra = true;
      s.duration += 60;
      s.events.push({ type: 'extra' });
      return;
    }
    s.pens = penaltyShootout(s.teams[0].def, s.teams[1].def, s.rng);
  }
  finish(s);
}

function finish(s) {
  s.phase = 'ended';
  s.ball.owner = -1;
  s.events.push({ type: 'end', score: s.score.slice(), pens: s.pens });
}

export function penaltyShootout(home, away, rng) {
  const score = [0, 0];
  const teams = [home, away];
  const kick = (t) => {
    const p = clamp(0.76 + (teams[t].att - teams[1 - t].def) * 0.004, 0.55, 0.92);
    if (rng() < p) score[t]++;
  };
  for (let r = 0; r < 5; r++) {
    for (let t = 0; t < 2; t++) {
      kick(t);
      // Stop early once one side cannot catch up.
      const leftHome = 4 - r;
      const leftAway = t === 1 ? 4 - r : 5 - r;
      if (score[0] > score[1] + leftAway || score[1] > score[0] + leftHome) return score;
    }
  }
  while (score[0] === score[1]) {
    kick(0);
    kick(1);
  }
  return score;
}

export function matchResult(s) {
  const [h, a] = s.score;
  let winner = h > a ? 0 : a > h ? 1 : -1;
  if (winner < 0 && s.pens) winner = s.pens[0] > s.pens[1] ? 0 : 1;
  const total = s.stats.poss[0] + s.stats.poss[1] || 1;
  return {
    score: s.score.slice(),
    pens: s.pens,
    winner,
    goals: s.goals.slice(),
    stats: { ...s.stats, possPct: [Math.round((s.stats.poss[0] / total) * 100), Math.round((s.stats.poss[1] / total) * 100)] },
  };
}

// ---------- snapshots (network + rendering) ----------

const PHASES = ['kickoff', 'play', 'goal', 'ended'];
const r2 = (v) => Math.round(v * 100) / 100;

export function snapshot(s) {
  const p = [];
  for (const pl of s.players) p.push(r2(pl.x), r2(pl.y), r2(Math.atan2(pl.fy, pl.fx)));
  return {
    c: r2(s.clock),
    d: s.duration,
    ph: PHASES.indexOf(s.phase),
    sc: s.score.slice(),
    b: [r2(s.ball.x), r2(s.ball.y)],
    o: s.ball.owner,
    p,
    k: [s.teams[0].ctl, s.teams[1].ctl],
    ch: [r2(s.teams[0].charge), r2(s.teams[1].charge)],
    st: [r2(s.players[s.teams[0].ctl].stamina), r2(s.players[s.teams[1].ctl].stamina)],
    ex: s.extra ? 1 : 0,
  };
}

// The renderer works from a "view": the same shape whether it came from a local match or a snapshot.
export function viewFromSnapshot(sn) {
  const players = [];
  for (let i = 0; i < sn.p.length / 3; i++) {
    players.push({ x: sn.p[i * 3], y: sn.p[i * 3 + 1], a: sn.p[i * 3 + 2], team: i < PER_TEAM ? 0 : 1, idx: i % PER_TEAM });
  }
  return {
    clock: sn.c,
    duration: sn.d,
    phase: PHASES[sn.ph],
    score: sn.sc,
    ball: { x: sn.b[0], y: sn.b[1] },
    owner: sn.o,
    players,
    ctl: sn.k,
    charge: sn.ch,
    stamina: sn.st,
    extra: !!sn.ex,
  };
}

export function viewFromMatch(s) {
  return viewFromSnapshot(snapshot(s));
}

export function lerpViews(a, b, t) {
  const lerp = (x, y) => x + (y - x) * t;
  const lerpAngle = (x, y) => {
    let d = y - x;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return x + d * t;
  };
  return {
    ...b,
    ball: { x: lerp(a.ball.x, b.ball.x), y: lerp(a.ball.y, b.ball.y) },
    players: b.players.map((p, i) => ({
      ...p,
      x: lerp(a.players[i].x, p.x),
      y: lerp(a.players[i].y, p.y),
      a: lerpAngle(a.players[i].a, p.a),
    })),
  };
}

export { POSITIONS };
