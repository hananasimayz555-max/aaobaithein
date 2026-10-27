// Touch joystick + buttons on phones, keyboard on desktop. Produces { mx, my, shoot, pass, sprint }.
export function createControls(root) {
  const keys = new Set();
  const touch = { mx: 0, my: 0, shoot: false, pass: false, sprint: false };
  let stickId = null;
  let origin = null;
  const RADIUS = 56;

  root.innerHTML = `
    <div class="stick-zone"><div class="stick-base"><div class="stick-knob"></div></div></div>
    <div class="buttons">
      <button class="btn-sprint" data-btn="sprint" aria-label="Sprint">SPRINT</button>
      <button class="btn-pass" data-btn="pass" aria-label="Pass or switch player">PASS</button>
      <button class="btn-shoot" data-btn="shoot" aria-label="Shoot or tackle">SHOOT</button>
    </div>`;
  const zone = root.querySelector('.stick-zone');
  const base = root.querySelector('.stick-base');
  const knob = root.querySelector('.stick-knob');

  const setKnob = (dx, dy) => {
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  zone.addEventListener('pointerdown', (e) => {
    if (stickId !== null) return;
    stickId = e.pointerId;
    zone.setPointerCapture(e.pointerId);
    const rect = zone.getBoundingClientRect();
    origin = { x: e.clientX, y: e.clientY };
    base.style.left = `${e.clientX - rect.left}px`;
    base.style.top = `${e.clientY - rect.top}px`;
    base.classList.add('active');
    e.preventDefault();
  });
  const moveStick = (e) => {
    if (e.pointerId !== stickId) return;
    let dx = e.clientX - origin.x;
    let dy = e.clientY - origin.y;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    setKnob(dx, dy);
    const m = Math.min(1, d / RADIUS);
    touch.mx = m < 0.15 ? 0 : dx / RADIUS;
    touch.my = m < 0.15 ? 0 : dy / RADIUS;
  };
  const endStick = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    touch.mx = touch.my = 0;
    setKnob(0, 0);
    base.classList.remove('active');
  };
  zone.addEventListener('pointermove', moveStick);
  zone.addEventListener('pointerup', endStick);
  zone.addEventListener('pointercancel', endStick);

  for (const btn of root.querySelectorAll('[data-btn]')) {
    const name = btn.dataset.btn;
    const down = (e) => {
      touch[name] = true;
      btn.classList.add('down');
      btn.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };
    const up = () => {
      touch[name] = false;
      btn.classList.remove('down');
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  const GAME_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
  const onKey = (e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.type === 'keydown') keys.add(e.code);
    else keys.delete(e.code);
    if (GAME_KEYS.has(e.code)) e.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  const onBlur = () => keys.clear();
  window.addEventListener('blur', onBlur);

  return {
    read(flip = false) {
      let kx = 0;
      let ky = 0;
      if (keys.has('ArrowLeft') || keys.has('KeyA')) kx -= 1;
      if (keys.has('ArrowRight') || keys.has('KeyD')) kx += 1;
      if (keys.has('ArrowUp') || keys.has('KeyW')) ky -= 1;
      if (keys.has('ArrowDown') || keys.has('KeyS')) ky += 1;
      let mx = kx || touch.mx;
      const my = ky || touch.my;
      if (flip) mx = -mx;
      return {
        mx,
        my,
        shoot: touch.shoot || keys.has('Space') || keys.has('KeyK'),
        pass: touch.pass || keys.has('KeyJ') || keys.has('KeyX'),
        sprint: touch.sprint || keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyL'),
      };
    },
    destroy() {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', onBlur);
      root.innerHTML = '';
    },
  };
}
