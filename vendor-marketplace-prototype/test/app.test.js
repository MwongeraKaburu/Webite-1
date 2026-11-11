import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb } from '../lib/db.js';
import { seed } from '../lib/seed.js';
import { createApp } from '../app.js';
import { readFileSync } from 'node:fs';
import { normalisePhone, html, resetLimits } from '../lib/util.js';

let server, base, db;
before(async () => {
  db = openDb(':memory:');
  seed(db);
  server = createServer(createApp(db));
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const get = (p, opts = {}) => fetch(base + p, { redirect: 'manual', ...opts });
const post = (p, data, headers = {}) => fetch(base + p, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers }, body: new URLSearchParams(data) });
const cookieOf = (res) => (res.headers.get('set-cookie') || '').split(';')[0];
const count = (s, needle) => s.split(needle).length - 1;

test('Kenyan phone numbers are normalised and validated', () => {
  for (const ok of ['0712345678', '0712 345 678', '+254712345678', '254712345678', '712345678', '0112345678', '+254 (712) 345-678']) assert.match(normalisePhone(ok), /^\+254[17]\d{8}$/, ok);
  assert.equal(normalisePhone('0712345678'), '+254712345678');
  for (const bad of ['', null, '12345', '0812345678', '+255712345678', '07123456789', 'abc']) assert.equal(normalisePhone(bad), null, String(bad));
});

test('template escaping blocks HTML injection', () => {
  const evil = '<img src=x onerror=alert(1)>"\'';
  const out = html`<p title="${evil}">${evil}</p>`.s;
  assert.ok(!out.includes('<img'));
  assert.ok(out.includes('&lt;img'));
});

test('seed data covers all 20 categories', () => {
  assert.equal(db.prepare('SELECT COUNT(*) n FROM categories').get().n, 20);
  assert.equal(db.prepare('SELECT COUNT(DISTINCT category_id) n FROM vendor_profiles').get().n, 20);
  assert.ok(db.prepare('SELECT COUNT(*) n FROM vendor_profiles').get().n >= 20);
});

test('home page: vendor-focused menu without removed items', async () => {
  const res = await get('/');
  assert.equal(res.status, 200);
  const t = await res.text();
  assert.match(t, /Find the right vendors/);
  assert.match(t, /List Your Business/);
  assert.match(t, /Browse by category/);
  assert.ok(!/\b(Advice|Planning Tools|Inspiration|Shop|Merch|Wedding Website)\b/.test(t), 'removed menu items must not appear');
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
});

test('directory lists 12 per page, paginates, and shows all 3 contact options', async () => {
  const t = await (await get('/vendors')).text();
  assert.equal(count(t, '<article class="card">'), 12);
  assert.match(t, /30<\/strong> vendors found/);
  assert.match(t, /href="\?[^"]*page=2/);
  assert.equal(count(t, 'data-track="whatsapp"'), 12);
  assert.equal(count(t, 'data-track="call"'), 12);
  assert.equal(count(t, 'data-track="chat"'), 12);
  const p3 = await (await get('/vendors?page=3')).text();
  assert.equal(count(p3, '<article class="card">'), 6);
});

test('category page, location page and search-form redirect', async () => {
  const t = await (await get('/vendors/photographers')).text();
  assert.match(t, /Wedding Photographers in Kenya/);
  assert.match(t, /3<\/strong> vendors found/);
  const r = await get('/vendors?category=photographers&location=nairobi&max=50000');
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('location'), '/vendors/photographers?location=nairobi&max=50000');
  const combo = await (await get('/vendors/photographers?location=nairobi')).text();
  assert.match(combo, /Wedding Photographers in Nairobi/);
  assert.match(combo, /1<\/strong> vendor found/);
  const loc = await (await get('/locations/mombasa')).text();
  assert.match(loc, /Wedding Vendors in Mombasa/);
  assert.equal((await get('/vendors/not-a-category')).status, 404);
  assert.equal((await get('/locations/atlantis')).status, 404);
});

test('filters: price, verified, rating, venue capacity, sort', async () => {
  const all = db.prepare("SELECT * FROM vendor_profiles WHERE status='approved'").all();
  const expectMax = all.filter((v) => v.price_from <= 30000).length;
  const t = await (await get('/vendors?max=30000&page=1')).text();
  assert.match(t, new RegExp(`<strong>${expectMax}</strong> vendors? found`));
  const ver = all.filter((v) => v.verified).length;
  assert.match(await (await get('/vendors?verified=1')).text(), new RegExp(`<strong>${ver}</strong> vendors? found`));
  const rate = all.filter((v) => v.rating >= 4.5).length;
  assert.match(await (await get('/vendors?rating=4.5')).text(), new RegExp(`<strong>${rate}</strong> vendors? found`));
  const venues = await (await get('/vendors/venues?capacity=300')).text();
  assert.match(venues, /2<\/strong> vendors found/); // capacity 400 and 300
  assert.match(venues, /Minimum capacity/);
  const empty = await (await get('/vendors?min=99999999')).text();
  assert.match(empty, /No vendors match yet/);
  const cheap = await (await get('/vendors?sort=price_asc')).text();
  const firstPrice = Number(/From KES ([\d,]+)/.exec(cheap)[1].replace(/,/g, ''));
  assert.equal(firstPrice, Math.min(...all.map((v) => v.price_from)));
});

test('vendor profile: contact options, services, reviews, JSON-LD, view counter', async () => {
  const v = db.prepare("SELECT v.*, c.slug cs FROM vendor_profiles v JOIN categories c ON c.id=v.category_id WHERE v.slug='golden-hour-studios'").get();
  const before = v.views;
  const res = await get(`/vendors/${v.cs}/${v.slug}`);
  assert.equal(res.status, 200);
  const t = await res.text();
  assert.match(t, /https:\/\/wa\.me\/2547000\d+\?text=Hi%20Golden%20Hour%20Studios/);
  assert.match(t, /href="tel:\+2547000\d+"/);
  assert.match(t, /Chat on SiteName/);
  assert.match(t, /Services and packages/);
  assert.match(t, /Request a quote/);
  assert.match(t, /"@type":"LocalBusiness"/);
  assert.equal(db.prepare('SELECT views FROM vendor_profiles WHERE id=?').get(v.id).views, before + 1);
  assert.equal((await get('/vendors/venues/golden-hour-studios')).status, 404, 'wrong category must 404');
});

test('quote request: validation, honeypot, success', async () => {
  resetLimits();
  const path = '/vendors/photographers/golden-hour-studios/quote';
  const n0 = db.prepare('SELECT COUNT(*) n FROM quote_requests').get().n;
  const badPhone = await post(path, { name: 'Amina', phone: '12345' });
  assert.equal(badPhone.status, 400);
  assert.match(await badPhone.text(), /valid Kenyan phone/);
  const bot = await post(path, { name: 'Bot', phone: '0712345678', website: 'spam.example' });
  assert.equal(bot.status, 303);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM quote_requests').get().n, n0, 'honeypot must not save');
  const ok = await post(path, { name: 'Amina Hassan', phone: '0712 345 678', event_date: '2027-03-20', guests: '150', budget: '80000', message: 'Hello' });
  assert.equal(ok.status, 303);
  const row = db.prepare('SELECT * FROM quote_requests ORDER BY id DESC LIMIT 1').get();
  assert.equal(row.phone, '+254712345678');
  assert.equal(row.guests, 150);
  assert.equal(row.status, 'new');
  assert.match(await (await get('/vendors/photographers/golden-hour-studios?sent=1')).text(), /Your request has been sent/);
});

test('contact click tracking and input validation', async () => {
  resetLimits();
  const id = db.prepare("SELECT id FROM vendor_profiles WHERE slug='golden-hour-studios'").get().id;
  assert.equal((await post('/api/track', { vendor: id, type: 'whatsapp' })).status, 204);
  assert.equal((await post('/api/track', { vendor: id, type: 'call' })).status, 204);
  assert.equal((await post('/api/track', { vendor: id, type: 'hack' })).status, 400);
  assert.equal((await post('/api/track', { vendor: 99999, type: 'call' })).status, 400);
  const clicks = db.prepare('SELECT type, COUNT(*) n FROM contact_clicks WHERE vendor_id=? GROUP BY type').all(id);
  assert.deepEqual(clicks.map((c) => c.type).sort(), ['call', 'whatsapp']);
});

test('auth: signup, duplicate, login, logout, protected pages, safe redirects', async () => {
  resetLimits();
  assert.equal((await get('/dashboard')).headers.get('location'), '/login?next=/dashboard');
  const noConsent = await post('/signup', { role: 'couple', name: 'Wanjiru', email: 'w@example.com', password: 'longpassword' });
  assert.equal(noConsent.status, 400);
  assert.match(await noConsent.text(), /accept the Terms/);
  const short = await post('/signup', { role: 'couple', name: 'Wanjiru', email: 'w@example.com', password: 'short', consent: '1' });
  assert.match(await short.text(), /at least 8/);
  const ok = await post('/signup', { role: 'couple', name: 'Wanjiru Kamau', email: 'W@Example.com', phone: '0722000111', password: 'longpassword', consent: '1' });
  assert.equal(ok.status, 303);
  const cookie = cookieOf(ok);
  assert.match(cookie, /^sid=[a-f0-9]{64}$/);
  assert.match(ok.headers.get('set-cookie'), /HttpOnly/);
  const stored = db.prepare('SELECT * FROM users WHERE email=?').get('w@example.com');
  assert.ok(stored.password_hash.startsWith('scrypt$'));
  assert.equal(stored.phone, '+254722000111');
  assert.ok(stored.consent_at);
  const dup = await post('/signup', { role: 'couple', name: 'X', email: 'w@example.com', password: 'longpassword', consent: '1' });
  assert.match(await dup.text(), /already exists/);
  const dash = await get('/dashboard', { headers: { cookie } });
  assert.equal(dash.status, 200);
  assert.match(await dash.text(), /Hello, Wanjiru/);
  const bad = await post('/login', { email: 'w@example.com', password: 'wrongpass1' });
  assert.equal(bad.status, 401);
  const evilNext = await post('/login', { email: 'w@example.com', password: 'longpassword', next: '//evil.example' });
  assert.equal(evilNext.headers.get('location'), '/');
  const good = await post('/login', { email: 'w@example.com', password: 'longpassword', next: '/saved' });
  assert.equal(good.headers.get('location'), '/saved');
  await post('/logout', {}, { cookie });
  assert.equal((await get('/dashboard', { headers: { cookie } })).status, 303, 'session must be gone after logout');
});

test('saving vendors requires login and toggles', async () => {
  resetLimits();
  const id = db.prepare("SELECT id FROM vendor_profiles WHERE slug='glow-by-wanjiru'").get().id;
  assert.equal((await post(`/api/save/${id}`, {})).status, 401);
  const s = await post('/signup', { role: 'couple', name: 'Brian', email: 'b@example.com', password: 'longpassword', consent: '1' });
  const cookie = cookieOf(s);
  const a = await post(`/api/save/${id}`, {}, { cookie });
  assert.deepEqual(await a.json(), { saved: true });
  assert.match(await (await get('/saved', { headers: { cookie } })).text(), /Glow by Wanjiru/);
  const b = await post(`/api/save/${id}`, {}, { cookie });
  assert.deepEqual(await b.json(), { saved: false });
});

test('vendor signup: pending until approved, then public; names are escaped', async () => {
  resetLimits();
  const s = await post('/signup', { role: 'vendor', name: 'Peter Otieno', email: 'p@example.com', phone: '0733 000 222', password: 'longpassword', consent: '1', business: '<script>alert(1)</script> Weddings', category: 'cakes', location: 'kisumu' });
  assert.equal(s.status, 303);
  assert.equal(s.headers.get('location'), '/dashboard');
  const cookie = cookieOf(s);
  const v = db.prepare("SELECT * FROM vendor_profiles WHERE email='p@example.com'").get();
  assert.equal(v.status, 'pending');
  assert.equal(v.phone, '+254733000222');
  assert.equal((await get(`/vendors/cakes/${v.slug}`)).status, 404, 'pending vendors are not public');
  assert.match(await (await get('/dashboard', { headers: { cookie } })).text(), /Awaiting approval/);
  assert.ok(!(await (await get('/vendors/cakes')).text()).includes('Alert(1)'));
  db.prepare("UPDATE vendor_profiles SET status='approved' WHERE id=?").run(v.id);
  const pub = await (await get(`/vendors/cakes/${v.slug}`)).text();
  assert.ok(!pub.includes('<script>alert(1)</script>'), 'business name must be escaped');
  assert.ok(pub.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.match(await (await get('/dashboard', { headers: { cookie } })).text(), /View your public profile/);
  const missing = await post('/signup', { role: 'vendor', name: 'X', email: 'q@example.com', phone: '0733000333', password: 'longpassword', consent: '1', business: 'Q', category: 'nope', location: 'kisumu' });
  assert.match(await missing.text(), /choose a category/);
});

test('sitemap, robots, static pages, 404', async () => {
  const sm = await (await get('/sitemap.xml')).text();
  assert.match(sm, /<loc>http:\/\/localhost:3000\/vendors\/photographers<\/loc>/);
  assert.match(sm, /\/vendors\/photographers\/golden-hour-studios/);
  assert.match(await (await get('/robots.txt')).text(), /Sitemap:/);
  for (const p of ['/about', '/contact', '/terms', '/privacy']) assert.equal((await get(p)).status, 200, p);
  assert.match(await (await get('/terms')).text(), /not a party to any agreement/);
  assert.equal((await get('/nope')).status, 404);
  assert.equal((await get('/img/golden-hour-studios-0.svg')).headers.get('content-type'), 'image/svg+xml');
});

test('static assets are served unmodified (not HTML-escaped)', async () => {
  for (const f of ['app.js', 'style.css']) {
    const res = await get('/' + f);
    assert.equal(res.status, 200);
    assert.equal(await res.text(), readFileSync(new URL('../public/' + f, import.meta.url), 'utf8'), f);
  }
});
