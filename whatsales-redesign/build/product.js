(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let lenis = null;
  if (!reduce && window.Lenis) { lenis = new Lenis({ lerp: 0.1, smoothWheel: true }); const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  // cursor
  if (fine && !reduce) {
    const dot = document.getElementById('curDot'), ring = document.getElementById('curRing');
    let mx = -100, my = -100, rx = -100, ry = -100;
    root.classList.add('cur-ready');
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; document.body.classList.add('cur-on'); dot.style.transform = `translate(${mx}px,${my}px)`; }, { passive: true });
    addEventListener('pointerdown', () => document.body.classList.add('cur-down'));
    addEventListener('pointerup', () => document.body.classList.remove('cur-down'));
    document.addEventListener('pointerover', e => { if (e.target.closest('a,button,summary,input,.relc')) document.body.classList.add('cur-hover'); });
    document.addEventListener('pointerout', e => { if (e.target.closest('a,button,summary,input,.relc')) document.body.classList.remove('cur-hover'); });
    const loop = () => { rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); }; loop();
  }
  // word split
  const wrapWords = node => { [...node.childNodes].forEach(ch => { if (ch.nodeType === 3) { const f = document.createDocumentFragment(); ch.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(' ')); return; } const w = document.createElement('span'); w.className = 'w'; const s = document.createElement('span'); s.textContent = t; w.appendChild(s); f.appendChild(w); }); ch.replaceWith(f); } else if (ch.nodeType === 1) wrapWords(ch); }); };
  const title = document.getElementById('heroTitle'); wrapWords(title);
  title.querySelectorAll('.w>span').forEach((s, i) => s.style.transitionDelay = (0.06 + i * 0.06) + 's');
  root.classList.add('anim');
  requestAnimationFrame(() => requestAnimationFrame(() => { title.classList.add('in'); document.body.classList.add('loaded'); }));
  document.querySelectorAll('h2.sh').forEach(h => { h.classList.add('split'); wrapWords(h); h.querySelectorAll('.w>span').forEach((x, k) => x.style.transitionDelay = (0.05 * k) + 's'); });
  // menus + drawer
  const items = [...document.querySelectorAll('[data-menu]')];
  const closeAll = ex => items.forEach(li => { if (li !== ex) { li.classList.remove('open'); li.querySelector('button').setAttribute('aria-expanded', 'false'); } });
  items.forEach(li => { const b = li.querySelector('button'); let t; const open = () => { clearTimeout(t); closeAll(li); li.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }; li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') open(); }); li.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') t = setTimeout(() => { li.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }, 120); }); b.addEventListener('click', () => li.classList.contains('open') ? li.classList.remove('open') : open()); });
  const drawer = document.getElementById('drawer');
  document.getElementById('burger').addEventListener('click', () => drawer.classList.add('open'));
  document.getElementById('drawerClose').addEventListener('click', () => drawer.classList.remove('open'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); drawer.classList.remove('open'); } });
  document.addEventListener('click', e => { if (!e.target.closest('#menu')) closeAll(); });
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href'); if (id.length < 2) return; const el = document.querySelector(id); if (!el) return; e.preventDefault(); closeAll(); drawer.classList.remove('open'); lenis ? lenis.scrollTo(el, { offset: -90 }) : el.scrollIntoView({ behavior: 'smooth' }); }));
  // nav theme + progress
  const nav = document.getElementById('nav'), hero = document.getElementById('hero'), progress = document.getElementById('progress');
  const darkSecs = [hero, ...document.querySelectorAll('section.dark')];
  const onScroll = () => {
    progress.style.transform = `scaleX(${clamp(scrollY / (document.documentElement.scrollHeight - innerHeight))})`;
    const dark = darkSecs.some(s => { const r = s.getBoundingClientRect(); return r.top < 72 && r.bottom > 72; });
    nav.classList.toggle('dark-mode', dark); nav.classList.toggle('light-mode', !dark);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // day bars (illustrative)
  const db = document.getElementById('daybars');
  if (db) { const h = [22,35,18,40,55,30,26,61,44,38,20,48,70,52,33,29,45,58,36,24,63,41,30,50,72,46,34,27,53,39]; h.forEach(v => { const i = document.createElement('i'); i.dataset.h = v; db.appendChild(i); }); }
  // reveal
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; el.classList.add('in', 'go'); el.querySelectorAll('#daybars i').forEach((b, k) => setTimeout(() => b.style.height = b.dataset.h + '%', k * 25)); io.unobserve(el); }), { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
  const hio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); hio.unobserve(e.target); } }), { threshold: .4 });
  document.querySelectorAll('h2.sh').forEach(h => hio.observe(h));
  setTimeout(() => document.querySelectorAll('.rv').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in', 'go'); }), 2500);
})();
