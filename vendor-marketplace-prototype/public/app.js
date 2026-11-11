(() => {
  const body = document.body;
  const loggedIn = !!body.dataset.user;
  const KEY = 'saved-vendors';

  // ---- mobile menu ----
  const burger = document.querySelector('[data-burger]');
  burger?.addEventListener('click', () => {
    const open = document.querySelector('.site-header').classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  // ---- filters start collapsed on small screens so results are visible ----
  const fl = document.getElementById('filters');
  if (fl && matchMedia('(max-width: 960px)').matches) fl.removeAttribute('open');

  // ---- saved hearts (account when logged in, this browser otherwise) ----
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const write = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* storage unavailable */ } };
  const saved = new Set(loggedIn ? (body.dataset.saved || '').split(',').filter(Boolean).map(Number) : read());
  const paint = (btn) => {
    const on = saved.has(Number(btn.dataset.id));
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('on', on);
    const label = btn.querySelector('span');
    btn.firstChild.textContent = on ? '♥ ' : '♡ ';
    if (!label && !btn.classList.contains('lg')) btn.textContent = on ? '♥' : '♡';
    if (label) label.textContent = on ? 'Saved' : 'Save';
  };
  document.querySelectorAll('.heart').forEach(paint);
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.heart');
    if (!btn) return;
    e.preventDefault();
    const id = Number(btn.dataset.id);
    if (loggedIn) {
      try {
        const r = await fetch(`/api/save/${id}`, { method: 'POST' });
        if (r.ok) { (await r.json()).saved ? saved.add(id) : saved.delete(id); }
      } catch { return; }
    } else {
      saved.has(id) ? saved.delete(id) : saved.add(id);
      write([...saved]);
    }
    document.querySelectorAll(`.heart[data-id="${id}"]`).forEach(paint);
  });

  // ---- contact click tracking (does not delay navigation) ----
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-track]');
    if (!a) return;
    const data = new Blob([new URLSearchParams({ vendor: a.dataset.vendor, type: a.dataset.track })], { type: 'application/x-www-form-urlencoded' });
    navigator.sendBeacon?.('/api/track', data);
  });

  // ---- photo lightbox ----
  const gallery = document.querySelector('[data-gallery]');
  const lb = document.querySelector('[data-lightbox]');
  if (gallery && lb) {
    const imgs = [...gallery.querySelectorAll('img')];
    const big = lb.querySelector('img');
    let i = 0;
    const show = (n) => { i = (n + imgs.length) % imgs.length; big.src = imgs[i].src; big.alt = imgs[i].alt; };
    const open = (n) => { show(n); lb.hidden = false; lb.querySelector('.lb-x').focus(); };
    const close = () => { lb.hidden = true; };
    gallery.addEventListener('click', (e) => { const im = e.target.closest('img'); if (im) open(imgs.indexOf(im)); });
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.querySelector('.lb-p').addEventListener('click', () => show(i - 1));
    lb.querySelector('.lb-n').addEventListener('click', () => show(i + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
    let x0 = null;
    lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
  }
})();
