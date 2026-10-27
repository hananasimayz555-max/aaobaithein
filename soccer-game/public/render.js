// Draws a match "view" onto a canvas. `flip` mirrors the pitch so the local player always attacks right.
import { W, H, GOAL_W, GOAL_D, PR, BR, BOX_D, BOX_W } from './shared/engine.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let cssW = 0;
  let cssH = 0;
  let camX = W / 2;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(view, { kits, teams, flip = false, mySide = 0, showBoth = false }) {
    if (canvas.clientWidth !== cssW || canvas.clientHeight !== cssH) resize();
    const fx = (x) => (flip ? W - x : x);
    const hudH = 44;
    const fitScale = Math.min(cssW / (W + 10), (cssH - hudH) / (H + 8));
    // On narrow (portrait) screens zoom in and follow the ball instead of shrinking everything.
    const scale = Math.max(fitScale, Math.min((cssH - hudH) / (H + 8), 9));
    const visW = cssW / scale;
    const targetCam = visW >= W + 10 ? W / 2 : Math.max(visW / 2 - 5, Math.min(W + 5 - visW / 2, fx(view.ball.x)));
    camX += (targetCam - camX) * 0.15;
    if (Math.abs(targetCam - camX) > 30) camX = targetCam;
    const ox = cssW / 2 - camX * scale;
    const oy = hudH + (cssH - hudH - H * scale) / 2;
    const X = (x) => ox + fx(x) * scale;
    const Y = (y) => oy + y * scale;

    ctx.fillStyle = '#0b3d1f';
    ctx.fillRect(0, 0, cssW, cssH);

    // Pitch stripes
    const stripes = 12;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? '#2f8f3a' : '#2a8434';
      ctx.fillRect(ox + (i * W * scale) / stripes, oy, (W * scale) / stripes + 1, H * scale);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1.5, scale * 0.25);
    ctx.strokeRect(ox, oy, W * scale, H * scale);
    ctx.beginPath();
    ctx.moveTo(ox + (W / 2) * scale, oy);
    ctx.lineTo(ox + (W / 2) * scale, oy + H * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ox + (W / 2) * scale, oy + (H / 2) * scale, 8 * scale, 0, Math.PI * 2);
    ctx.stroke();
    for (const side of [0, 1]) {
      const bx = side === 0 ? ox : ox + (W - BOX_D) * scale;
      ctx.strokeRect(bx, oy + (H / 2 - BOX_W / 2) * scale, BOX_D * scale, BOX_W * scale);
      const sx = side === 0 ? ox : ox + (W - 5) * scale;
      ctx.strokeRect(sx, oy + (H / 2 - 10) * scale, 5 * scale, 20 * scale);
      // Goal and net
      const gx = side === 0 ? ox - GOAL_D * scale : ox + W * scale;
      const gy = oy + (H / 2 - GOAL_W / 2) * scale;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(gx, gy, GOAL_D * scale, GOAL_W * scale);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i < GOAL_W; i += 1.5) {
        ctx.beginPath();
        ctx.moveTo(gx, gy + i * scale);
        ctx.lineTo(gx + GOAL_D * scale, gy + i * scale);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, scale * 0.4);
      ctx.strokeRect(gx, gy, GOAL_D * scale, GOAL_W * scale);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(1.5, scale * 0.25);
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ox + (W / 2) * scale, oy + (H / 2) * scale, scale * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Players
    const r = PR * scale;
    for (let i = 0; i < view.players.length; i++) {
      const p = view.players[i];
      const kit = kits[p.team];
      const px = X(p.x);
      const py = Y(p.y);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(px + r * 0.25, py + r * 0.35, r, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      const isCtl = view.ctl[p.team] === i && (p.team === mySide || showBoth);
      if (isCtl) {
        ctx.strokeStyle = p.team === mySide ? '#facc15' : '#f97316';
        ctx.lineWidth = Math.max(2, scale * 0.35);
        ctx.beginPath();
        ctx.arc(px, py, r + scale * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = p.idx === 0 ? kit.keeper : kit.primary;
      ctx.strokeStyle = kit.secondary;
      ctx.lineWidth = Math.max(1.5, scale * 0.3);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Facing marker
      const a = flip ? Math.PI - p.a : p.a;
      ctx.fillStyle = kit.secondary;
      ctx.beginPath();
      ctx.arc(px + Math.cos(a) * r * 0.62, py + Math.sin(a) * r * 0.62, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      if (isCtl) {
        // Arrow above the controlled player, plus shot power and stamina.
        ctx.fillStyle = p.team === mySide ? '#facc15' : '#f97316';
        ctx.beginPath();
        ctx.moveTo(px, py - r - scale * 1.2);
        ctx.lineTo(px - scale * 0.8, py - r - scale * 2.4);
        ctx.lineTo(px + scale * 0.8, py - r - scale * 2.4);
        ctx.closePath();
        ctx.fill();
        const bw = scale * 4;
        const charge = view.charge[p.team];
        if (charge > 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(px - bw / 2, py + r + scale * 0.9, bw, scale * 0.7);
          ctx.fillStyle = charge > 0.95 ? '#ef4444' : '#facc15';
          ctx.fillRect(px - bw / 2, py + r + scale * 0.9, bw * charge, scale * 0.7);
        }
        const stamina = view.stamina[p.team];
        if (stamina < 0.99) {
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(px - bw / 2, py + r + scale * 1.8, bw, scale * 0.4);
          ctx.fillStyle = stamina > 0.3 ? '#22c55e' : '#ef4444';
          ctx.fillRect(px - bw / 2, py + r + scale * 1.8, bw * stamina, scale * 0.4);
        }
      }
    }

    // Ball
    const bx = X(view.ball.x);
    const by = Y(view.ball.y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(bx + scale * 0.3, by + scale * 0.35, BR * scale, BR * scale * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, Math.max(3, BR * scale), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(bx, by, Math.max(1, BR * scale * 0.4), 0, Math.PI * 2);
    ctx.fill();

    drawHud(view, kits, teams, flip);
  }

  function drawHud(view, kits, teams, flip) {
    const left = flip ? 1 : 0;
    const right = 1 - left;
    ctx.fillStyle = 'rgba(5, 12, 24, 0.85)';
    ctx.fillRect(0, 0, cssW, 44);
    const cx = cssW / 2;
    ctx.textBaseline = 'middle';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${view.score[left]}  -  ${view.score[right]}`, cx, 22);
    ctx.font = '700 15px system-ui, sans-serif';
    const swatch = (x, kit) => {
      ctx.fillStyle = kit.primary;
      ctx.fillRect(x, 13, 18, 18);
      ctx.strokeStyle = kit.secondary;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 13, 18, 18);
    };
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(teams[left].short, cx - 48, 22);
    swatch(cx - 48 - ctx.measureText(teams[left].short).width - 26, kits[left]);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(teams[right].short, cx + 48, 22);
    swatch(cx + 48 + ctx.measureText(teams[right].short).width + 8, kits[right]);
    // Match clock shown as football minutes.
    const regular = view.extra ? view.duration - 60 : view.duration;
    let label;
    if (view.extra) label = `ET ${Math.min(120, 90 + Math.floor(((view.clock - regular) / 60) * 30))}'`;
    else label = `${Math.min(90, Math.floor((view.clock / regular) * 90))}'`;
    ctx.textAlign = 'right';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText(label, cssW - 64, 22);
  }

  return { draw, resize };
}
