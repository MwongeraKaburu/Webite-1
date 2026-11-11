import { readFileSync, existsSync, statSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_NAME, BASE_URL, PER_PAGE, SESSION_DAYS } from './config.js';
import { esc, slugify, normalisePhone, hashPassword, verifyPassword, parseCookies, readForm, safeNext, limited, hash32, toStr } from './lib/util.js';
import * as V from './lib/views.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dir, 'public');
const MIME = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const secure = BASE_URL.startsWith('https');

const intOrNull = (x) => { const n = parseInt(x, 10); return Number.isFinite(n) && n >= 0 ? n : null; };

const BASE_SELECT = `SELECT v.*, c.slug AS category_slug, c.name AS category_name, l.name AS location_name, l.slug AS location_slug, l.county AS county
  FROM vendor_profiles v JOIN categories c ON c.id = v.category_id JOIN locations l ON l.id = v.location_id`;

export function createApp(db) {
  // ---------- data access ----------
  const q = (sql, ...p) => db.prepare(sql).all(...p);
  const one = (sql, ...p) => db.prepare(sql).get(...p);
  const run = (sql, ...p) => db.prepare(sql).run(...p);

  function queryVendors(f, page = 1) {
    const where = ["v.status = 'approved'"], p = [];
    if (f.category) { where.push('c.slug = ?'); p.push(f.category); }
    if (f.location) { where.push('l.slug = ?'); p.push(f.location); }
    const min = intOrNull(f.min), max = intOrNull(f.max);
    if (max != null) { where.push('v.price_from <= ?'); p.push(max); }
    if (min != null) { where.push('v.price_to >= ?'); p.push(min); }
    const rating = parseFloat(f.rating);
    if (rating > 0) { where.push('v.rating >= ?'); p.push(rating); }
    if (f.verified) where.push('v.verified = 1');
    const cap = intOrNull(f.capacity);
    if (cap != null) { where.push('v.capacity >= ?'); p.push(cap); }
    if (['indoor', 'outdoor', 'both'].includes(f.setting)) { where.push("(v.setting = ? OR v.setting = 'both')"); p.push(f.setting); }
    const order = { top: 'v.rating DESC, v.review_count DESC', price_asc: 'v.price_from ASC', newest: 'v.created_at DESC, v.id DESC' }[f.sort]
      || 'v.featured DESC, v.verified DESC, v.rating DESC, v.review_count DESC';
    const w = where.join(' AND ');
    const total = one(`SELECT COUNT(*) n FROM vendor_profiles v JOIN categories c ON c.id = v.category_id JOIN locations l ON l.id = v.location_id WHERE ${w}`, ...p).n;
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    const pg = Math.min(Math.max(1, parseInt(page, 10) || 1), pages);
    const rows = q(`${BASE_SELECT} WHERE ${w} ORDER BY ${order} LIMIT ? OFFSET ?`, ...p, PER_PAGE, (pg - 1) * PER_PAGE);
    return { rows, total, page: pg, pages };
  }

  // ---------- sessions ----------
  function getUser(req) {
    const sid = parseCookies(req.headers.cookie).sid;
    if (!sid) return null;
    const row = one('SELECT u.id, u.name, u.email, u.role, u.phone, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?', sid);
    if (!row) return null;
    if (row.expires_at < Date.now()) { run('DELETE FROM sessions WHERE id = ?', sid); return null; }
    return row;
  }
  function startSession(userId) {
    const sid = randomBytes(32).toString('hex');
    run('INSERT INTO sessions (id, user_id, expires_at) VALUES (?,?,?)', sid, userId, Date.now() + SESSION_DAYS * 864e5);
    return `sid=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`;
  }
  const endCookie = `sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`;

  // ---------- responses ----------
  const SEC = {
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'self'",
  };
  function send(res, status, body, type = 'text/html; charset=utf-8', extra = {}) {
    res.writeHead(status, { 'Content-Type': type, ...SEC, ...extra });
    res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : toStr(body));
  }
  const redirect = (res, loc, extra = {}) => { res.writeHead(303, { Location: loc, ...SEC, ...extra }); res.end(); };

  function placeholderSvg(key) {
    const h = hash32(key);
    const palettes = [['#e8d5c4', '#b8573a', '#f6ece2'], ['#cfe0d4', '#1f4d3a', '#eef5ef'], ['#efe2bf', '#b8923f', '#fbf5e4'], ['#d9d4e8', '#5b4a8a', '#f1eef8'], ['#f1d3d0', '#a8433f', '#fbeceb'], ['#cddfe6', '#2f6277', '#eaf3f6']];
    const [a, b, c] = palettes[h % palettes.length];
    const cx = 120 + (h % 560), cy = 100 + ((h >> 8) % 360), r = 140 + ((h >> 16) % 160);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${a}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${b}" opacity=".18"/><circle cx="${800 - cx}" cy="${600 - cy}" r="${r * 0.6}" fill="${b}" opacity=".12"/><path d="M0 ${430 + (h % 80)} Q 200 ${340 + (h % 60)} 400 ${440} T 800 ${400 + (h % 60)} V600 H0Z" fill="${b}" opacity=".16"/></svg>`;
  }

  const STATIC = {
    about: ['About', '<p>This marketplace helps couples in Kenya find wedding vendors and contact them directly, whether by chat, WhatsApp or phone.</p><p>Vendors can create a free listing, show their work and receive enquiries.</p>'],
    contact: ['Contact', '<p>Questions or feedback? Email <a href="mailto:hello@example.com">hello@example.com</a> (placeholder, replace with your address).</p>'],
    terms: ['Terms of Use', '<p><strong>Template text. Have it reviewed by a lawyer before launch.</strong></p><p>This platform connects couples and wedding vendors. It is not a party to any agreement, booking or payment between them, and does not guarantee the quality, availability or pricing of any vendor. Prices shown are a guide only. Users should confirm details and agree terms directly with vendors.</p><p>Vendors are responsible for the accuracy of their listings, photos and prices, and must have the right to use any photos they upload. We may remove listings or reviews that are misleading, abusive or unlawful.</p>'],
    privacy: ['Privacy Policy', '<p><strong>Template text. Have it reviewed before launch.</strong></p><p>We collect the details you give us (name, email, phone, enquiries you send) to operate your account, pass enquiries to vendors and keep the service secure. We share your enquiry details with the vendor you contact.</p><p>Under the Kenya Data Protection Act, 2019 you may ask to see, correct, export or delete your personal data. Contact us using the details on the Contact page. We will respond within a reasonable time.</p>'],
  };

  // ---------- handler ----------
  return async function handler(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const method = req.method;
      const ip = req.socket.remoteAddress || 'x';

      // static files
      if (method === 'GET' && (path === '/style.css' || path === '/app.js' || path === '/favicon.svg' || path === '/manifest.webmanifest' || path === '/sw.js')) {
        const file = normalize(join(PUBLIC, path));
        if (file.startsWith(PUBLIC) && existsSync(file) && statSync(file).isFile()) {
          return send(res, 200, readFileSync(file), MIME[extname(file)] || 'application/octet-stream', { 'Cache-Control': 'public, max-age=300' });
        }
      }
      let m;
      if (method === 'GET' && (m = path.match(/^\/img\/([a-z0-9-]+)\.svg$/))) {
        return send(res, 200, placeholderSvg(m[1]), 'image/svg+xml', { 'Cache-Control': 'public, max-age=86400' });
      }
      if (method === 'GET' && path === '/robots.txt') {
        return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /dashboard\nDisallow: /messages\nSitemap: ${BASE_URL}/sitemap.xml\n`, 'text/plain; charset=utf-8');
      }

      const user = getUser(req);
      const cats = q('SELECT * FROM categories ORDER BY sort');
      const locs = q('SELECT * FROM locations ORDER BY sort');
      const savedIds = user ? q('SELECT vendor_id FROM saved_vendors WHERE user_id = ?', user.id).map((r) => r.vendor_id) : [];
      const ctx = { user, cats, locs, savedIds };
      const page = (status, content, extra) => send(res, status, content, 'text/html; charset=utf-8', extra);
      const f = Object.fromEntries(url.searchParams);

      if (method === 'GET' && path === '/sitemap.xml') {
        const urls = ['/', '/vendors', ...cats.map((c) => `/vendors/${c.slug}`), ...locs.map((l) => `/locations/${l.slug}`)];
        for (const r of q("SELECT DISTINCT c.slug cs, l.slug ls FROM vendor_profiles v JOIN categories c ON c.id=v.category_id JOIN locations l ON l.id=v.location_id WHERE v.status='approved'")) urls.push(`/vendors/${r.cs}?location=${r.ls}`);
        for (const v of q(`${BASE_SELECT} WHERE v.status='approved'`)) urls.push(V.vendorUrl(v));
        return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${esc(BASE_URL + u)}</loc></url>`).join('')}</urlset>`, 'application/xml; charset=utf-8');
      }

      // ----- home -----
      if (method === 'GET' && path === '/') {
        const counts = q("SELECT c.*, COUNT(v.id) n FROM categories c LEFT JOIN vendor_profiles v ON v.category_id = c.id AND v.status = 'approved' GROUP BY c.id ORDER BY c.sort");
        return page(200, V.homePage(ctx, {
          counts,
          featured: q(`${BASE_SELECT} WHERE v.status='approved' AND v.featured=1 ORDER BY v.rating DESC LIMIT 4`),
          topRated: q(`${BASE_SELECT} WHERE v.status='approved' ORDER BY v.rating DESC, v.review_count DESC LIMIT 4`),
          newest: q(`${BASE_SELECT} WHERE v.status='approved' ORDER BY v.created_at DESC, v.id DESC LIMIT 4`),
        }));
      }

      // ----- directory -----
      if (method === 'GET' && (path === '/vendors' || (m = path.match(/^\/vendors\/([a-z0-9-]+)$/)) || (m = path.match(/^\/locations\/([a-z0-9-]+)$/)))) {
        const isLocPath = path.startsWith('/locations/');
        if (path === '/vendors' && f.category && cats.some((c) => c.slug === f.category)) {
          const rest = new URLSearchParams(url.searchParams); rest.delete('category');
          return redirect(res, `/vendors/${f.category}${rest.toString() ? '?' + rest : ''}`);
        }
        let category = null, location = null;
        if (m && !isLocPath) { category = cats.find((c) => c.slug === m[1]); if (!category) return page(404, V.notFoundPage(ctx)); f.category = category.slug; }
        if (m && isLocPath) { location = locs.find((l) => l.slug === m[1]); if (!location) return page(404, V.notFoundPage(ctx)); f.location = location.slug; }
        if (!location && f.location) location = locs.find((l) => l.slug === f.location) || null;
        if (location === null) delete f.location;
        const result = queryVendors(f, f.page);
        const label = category ? category.seo_name : 'Wedding Vendors';
        const heading = `${label} in ${location ? location.name : 'Kenya'}`;
        const intro = category ? `${category.blurb} Compare ${result.total} ${category.seo_name.toLowerCase()} ${location ? 'in ' + location.name : 'across Kenya'}, then chat, WhatsApp or call them directly.`
          : `Browse ${result.total} wedding vendors ${location ? 'in ' + location.name : 'across Kenya'}. Chat, WhatsApp or call the ones you like.`;
        const extra = ['min', 'max', 'rating', 'verified', 'capacity', 'setting', 'sort'].some((k) => f[k]);
        const canonical = isLocPath ? `/locations/${location.slug}` : category ? `/vendors/${category.slug}${location ? '?location=' + location.slug : ''}` : '/vendors';
        // When the listing came from a category path the form already has the category, mark f accordingly for the template
        const fForView = { ...f }; if (category && !isLocPath) delete fForView.category;
        return page(200, V.listingPage(ctx, { f: fForView, result, category, location, heading, intro, canonical, noindex: extra }));
      }

      // ----- vendor profile & quote -----
      if ((m = path.match(/^\/vendors\/([a-z0-9-]+)\/([a-z0-9-]+)(\/quote)?$/))) {
        const v = one(`${BASE_SELECT} WHERE c.slug = ? AND v.slug = ? AND v.status = 'approved'`, m[1], m[2]);
        if (!v) return page(404, V.notFoundPage(ctx));
        const renderVendor = (status, extra = {}) => page(status, V.vendorPage(ctx, {
          v, services: q('SELECT * FROM services WHERE vendor_id = ? ORDER BY price_from', v.id),
          reviews: q('SELECT * FROM reviews WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 20', v.id),
          similar: q(`${BASE_SELECT} WHERE v.status='approved' AND v.category_id = ? AND v.id != ? ORDER BY (v.location_id = ?) DESC, v.rating DESC LIMIT 4`, v.category_id, v.id, v.location_id),
          ...extra,
        }));
        if (method === 'GET' && !m[3]) {
          run('UPDATE vendor_profiles SET views = views + 1 WHERE id = ?', v.id);
          return renderVendor(200, { sent: f.sent === '1' });
        }
        if (method === 'POST' && m[3]) {
          const b = await readForm(req);
          if (b.website) return redirect(res, `${V.vendorUrl(v)}?sent=1#contact`); // honeypot: silently drop bots
          if (limited(`quote:${ip}`, 5, 3600_000)) return renderVendor(429, { quoteErr: 'Too many requests. Please try again later.', form: b });
          const name = (b.name || '').trim().slice(0, 80);
          const phone = normalisePhone(b.phone);
          if (!name) return renderVendor(400, { quoteErr: 'Please enter your name.', form: b });
          if (!phone) return renderVendor(400, { quoteErr: 'Please enter a valid Kenyan phone number, like 0712 345 678.', form: b });
          if (b.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) return renderVendor(400, { quoteErr: 'That email address does not look right.', form: b });
          if (b.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(b.event_date)) return renderVendor(400, { quoteErr: 'Please pick a valid date.', form: b });
          run('INSERT INTO quote_requests (vendor_id,user_id,name,phone,email,event_date,location,guests,budget,message) VALUES (?,?,?,?,?,?,?,?,?,?)',
            v.id, user?.id ?? null, name, phone, (b.email || '').trim().slice(0, 120) || null, b.event_date || null,
            (b.location || '').trim().slice(0, 120) || null, intOrNull(b.guests), intOrNull(b.budget), (b.message || '').trim().slice(0, 1000) || null);
          return redirect(res, `${V.vendorUrl(v)}?sent=1#contact`);
        }
      }

      // ----- tracking & saves (JSON APIs) -----
      if (method === 'POST' && path === '/api/track') {
        const b = await readForm(req);
        if (limited(`track:${ip}`, 60, 60_000)) return send(res, 429, '', 'text/plain');
        const vid = intOrNull(b.vendor);
        if (!['whatsapp', 'call', 'chat'].includes(b.type) || vid == null || !one("SELECT 1 x FROM vendor_profiles WHERE id = ? AND status = 'approved'", vid)) return send(res, 400, '', 'text/plain');
        run('INSERT INTO contact_clicks (vendor_id, type, user_id) VALUES (?,?,?)', vid, b.type, user?.id ?? null);
        return send(res, 204, '', 'text/plain');
      }
      if (method === 'POST' && (m = path.match(/^\/api\/save\/(\d+)$/))) {
        if (!user) return send(res, 401, '{"error":"login"}', 'application/json');
        const vid = Number(m[1]);
        if (!one("SELECT 1 x FROM vendor_profiles WHERE id = ? AND status = 'approved'", vid)) return send(res, 404, '{"error":"not found"}', 'application/json');
        const had = one('SELECT 1 x FROM saved_vendors WHERE user_id = ? AND vendor_id = ?', user.id, vid);
        if (had) run('DELETE FROM saved_vendors WHERE user_id = ? AND vendor_id = ?', user.id, vid);
        else run('INSERT INTO saved_vendors (user_id, vendor_id) VALUES (?,?)', user.id, vid);
        return send(res, 200, JSON.stringify({ saved: !had }), 'application/json');
      }

      // ----- auth -----
      if (path === '/login' && method === 'GET') return page(200, V.loginPage(ctx, { next: safeNext(f.next) }));
      if (path === '/login' && method === 'POST') {
        const b = await readForm(req);
        const next = safeNext(b.next);
        if (limited(`login:${ip}`, 10, 900_000)) return page(429, V.loginPage(ctx, { error: 'Too many attempts. Please wait a few minutes.', next }));
        const row = one('SELECT * FROM users WHERE email = ?', (b.email || '').trim().toLowerCase());
        if (!row || !verifyPassword(b.password || '', row.password_hash)) return page(401, V.loginPage(ctx, { error: 'Incorrect email or password.', next, email: b.email }));
        return redirect(res, next, { 'Set-Cookie': startSession(row.id) });
      }
      if (path === '/signup' && method === 'GET') return page(200, V.signupPage(ctx, { role: f.role === 'vendor' ? 'vendor' : 'couple', next: safeNext(f.next) }));
      if (path === '/signup' && method === 'POST') {
        const b = await readForm(req);
        const role = b.role === 'vendor' ? 'vendor' : 'couple';
        const next = safeNext(b.next);
        const fail = (error) => page(400, V.signupPage(ctx, { error, role, next, form: b }));
        if (limited(`signup:${ip}`, 10, 3600_000)) return page(429, V.signupPage(ctx, { error: 'Too many sign-ups from this connection. Please try later.', role, next }));
        const name = (b.name || '').trim().slice(0, 80), email = (b.email || '').trim().toLowerCase();
        if (!name) return fail('Please enter your name.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Please enter a valid email address.');
        const phone = b.phone?.trim() ? normalisePhone(b.phone) : null;
        if ((b.phone?.trim() || role === 'vendor') && !phone) return fail('Please enter a valid Kenyan phone number, like 0712 345 678.');
        if ((b.password || '').length < 8) return fail('Your password must be at least 8 characters.');
        if (!b.consent) return fail('Please accept the Terms and Privacy Policy to continue.');
        if (one('SELECT 1 x FROM users WHERE email = ?', email)) return fail('An account with that email already exists. Try logging in.');
        let category, location, business;
        if (role === 'vendor') {
          business = (b.business || '').trim().slice(0, 100);
          category = cats.find((c) => c.slug === b.category); location = locs.find((l) => l.slug === b.location);
          if (!business) return fail('Please enter your business name.');
          if (!category || !location) return fail('Please choose a category and a location.');
        }
        const uid = Number(run('INSERT INTO users (role,name,email,phone,password_hash,consent_at) VALUES (?,?,?,?,?,datetime(\'now\'))', role, name, email, phone, hashPassword(b.password)).lastInsertRowid);
        if (role === 'vendor') {
          let slug = slugify(business) || 'vendor', n = 1;
          while (one('SELECT 1 x FROM vendor_profiles WHERE slug = ?', slug)) slug = `${slugify(business) || 'vendor'}-${++n}`;
          run('INSERT INTO vendor_profiles (user_id,slug,name,category_id,location_id,phone,whatsapp,email,status) VALUES (?,?,?,?,?,?,?,?,\'pending\')', uid, slug, business, category.id, location.id, phone, phone, email);
        }
        return redirect(res, role === 'vendor' ? '/dashboard' : next, { 'Set-Cookie': startSession(uid) });
      }
      if (path === '/logout' && method === 'POST') {
        const sid = parseCookies(req.headers.cookie).sid;
        if (sid) run('DELETE FROM sessions WHERE id = ?', sid);
        return redirect(res, '/', { 'Set-Cookie': endCookie });
      }

      // ----- signed-in pages -----
      if (method === 'GET' && path === '/dashboard') {
        if (!user) return redirect(res, '/login?next=/dashboard');
        const vendor = user.role === 'vendor' ? one(`${BASE_SELECT} WHERE v.user_id = ?`, user.id) : null;
        return page(200, V.dashboardPage(ctx, { vendor }));
      }
      if (method === 'GET' && path === '/messages') {
        if (!user) return redirect(res, '/login?next=/messages');
        return page(200, V.messagesPage(ctx, { vendor: null }));
      }
      if (method === 'GET' && path === '/messages/new') {
        const vid = intOrNull(f.vendor);
        if (!user) return redirect(res, `/login?next=${encodeURIComponent('/messages/new?vendor=' + (vid ?? ''))}`);
        const vendor = vid == null ? null : one(`${BASE_SELECT} WHERE v.id = ? AND v.status = 'approved'`, vid);
        return page(200, V.messagesPage(ctx, { vendor }));
      }
      if (method === 'GET' && path === '/saved') {
        if (!user) return redirect(res, '/login?next=/saved');
        return page(200, V.savedPage(ctx, { rows: q(`${BASE_SELECT} JOIN saved_vendors s ON s.vendor_id = v.id WHERE s.user_id = ? AND v.status = 'approved' ORDER BY s.created_at DESC`, user.id) }));
      }

      // ----- static pages -----
      if (method === 'GET' && STATIC[path.slice(1)]) return page(200, V.staticPage(ctx, ...STATIC[path.slice(1)]));

      return page(404, V.notFoundPage(ctx));
    } catch (err) {
      console.error(err);
      if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); }
      res.end('Something went wrong.');
    }
  };
}
