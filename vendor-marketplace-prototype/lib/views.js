import { SITE_NAME, BASE_URL } from '../config.js';
import { html, raw, kes, jsonLd, waNumber } from './util.js';

const stars = (v) => (v.review_count ? html`<span class="rating" title="${v.rating} out of 5"><span class="star">★</span> ${v.rating.toFixed(1)} <span class="muted">(${v.review_count})</span></span>` : html`<span class="muted">New</span>`);
const priceFrom = (v) => (v.price_from ? `From ${kes(v.price_from)}` : 'Ask for a quote');
export const vendorUrl = (v) => `/vendors/${v.category_slug}/${v.slug}`;
export const waLink = (v, extra = '') => `https://wa.me/${waNumber(v.whatsapp || v.phone)}?text=${encodeURIComponent(`Hi ${v.name}, I found you on ${SITE_NAME} and I'm interested in your ${v.category_name.toLowerCase()} services for my wedding${extra}.`)}`;

// ---------- Layout ----------
export function layout(ctx, { title, description, body, canonical, ld, noindex = false }) {
  const { user, cats, locs } = ctx;
  const fullTitle = title === SITE_NAME ? `${SITE_NAME} | Find Wedding Vendors in Kenya` : `${title} | ${SITE_NAME}`;
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${description || 'Find and contact trusted wedding vendors in Kenya: venues, photographers, caterers, planners and more. Chat, WhatsApp or call them directly.'}">
${noindex ? html`<meta name="robots" content="noindex">` : ''}
${canonical ? html`<link rel="canonical" href="${BASE_URL}${canonical}">` : ''}
<meta property="og:title" content="${fullTitle}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#1f4d3a">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
${ld ? html`<script type="application/ld+json">${jsonLd(ld)}</script>` : ''}
</head>
<body data-user="${user ? user.id : ''}" data-saved="${(ctx.savedIds || []).join(',')}">
<div class="notice">Prototype with sample vendors. All businesses, phone numbers and reviews are fictional.</div>
<header class="site-header" id="top">
  <div class="wrap bar">
    <a class="logo" href="/">${SITE_NAME}</a>
    <button class="burger" aria-label="Menu" aria-expanded="false" data-burger>☰</button>
    <nav class="nav" aria-label="Main">
      <div class="dd">
        <a href="/vendors" class="dd-t">Vendors <span aria-hidden="true">▾</span></a>
        <div class="dd-m mega">
          ${cats.map((c) => html`<a href="/vendors/${c.slug}"><span aria-hidden="true">${c.icon}</span> ${c.name}</a>`)}
        </div>
      </div>
      <div class="dd">
        <a href="/vendors#locations" class="dd-t">Locations <span aria-hidden="true">▾</span></a>
        <div class="dd-m">
          ${locs.map((l) => html`<a href="/locations/${l.slug}">${l.name}</a>`)}
        </div>
      </div>
      <a href="/signup?role=vendor" class="nav-link">List Your Business</a>
      ${user ? html`<a href="/messages" class="nav-link">Messages</a>` : ''}
      ${user
        ? html`<div class="dd right"><a href="/dashboard" class="avatar" title="${user.name}">${user.name.trim().charAt(0).toUpperCase()}</a>
            <div class="dd-m small">
              <span class="who">${user.name}</span>
              <a href="${user.role === 'vendor' ? '/dashboard' : '/saved'}">${user.role === 'vendor' ? 'Dashboard' : 'Saved vendors'}</a>
              <a href="/saved">Saved vendors</a>
              <form method="post" action="/logout"><button type="submit" class="linklike">Log out</button></form>
            </div></div>`
        : html`<a href="/login" class="nav-link">Log in</a><a href="/signup" class="btn btn-sm">Sign up</a>`}
    </nav>
  </div>
</header>
<main id="main">${body}</main>
<footer class="site-footer">
  <div class="wrap foot">
    <div><a class="logo light" href="/">${SITE_NAME}</a><p class="muted-l">Find wedding vendors across Kenya and contact them directly.</p></div>
    <nav aria-label="Footer"><a href="/about">About</a><a href="/contact">Contact</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/signup?role=vendor">Vendor sign-up</a></nav>
    <div class="social"><a href="#" aria-label="Instagram">Instagram</a><a href="#" aria-label="Facebook">Facebook</a><a href="#" aria-label="TikTok">TikTok</a></div>
  </div>
  <div class="wrap legal">© ${new Date().getFullYear()} ${SITE_NAME}. Prices are shown in Kenyan shillings (KES).</div>
</footer>
<nav class="bottombar" aria-label="Quick">
  <a href="/vendors">Vendors</a><a href="/#search">Search</a><a href="/messages">Messages</a><a href="${user ? '/dashboard' : '/login'}">Account</a>
</nav>
<script src="/app.js" defer></script>
</body></html>`;
}

// ---------- Components ----------
export function vendorCard(v) {
  const url = vendorUrl(v);
  return html`<article class="card">
  <a class="card-img" href="${url}" tabindex="-1" aria-hidden="true"><img loading="lazy" width="400" height="300" src="/img/${v.slug}-0.svg" alt="">
    <span class="badges">${v.featured ? html`<span class="badge gold">Featured</span>` : ''}${v.verified ? html`<span class="badge">✓ Verified</span>` : ''}</span></a>
  <button class="heart" data-id="${v.id}" aria-label="Save ${v.name}" aria-pressed="false">♡</button>
  <div class="card-b">
    <p class="eyebrow">${v.category_name} · ${v.location_name}</p>
    <h3><a href="${url}">${v.name}</a></h3>
    <p class="meta">${stars(v)} <span class="dot">·</span> ${priceFrom(v)}</p>
    <div class="contact-row">
      <a class="btn btn-sm btn-outline" href="/messages/new?vendor=${v.id}" data-track="chat" data-vendor="${v.id}">Chat</a>
      <a class="btn btn-sm btn-wa" href="${waLink(v)}" target="_blank" rel="noopener" data-track="whatsapp" data-vendor="${v.id}">WhatsApp</a>
      <a class="btn btn-sm btn-outline" href="tel:${v.phone}" data-track="call" data-vendor="${v.id}">Call</a>
    </div>
  </div>
</article>`;
}

function pager(page, pages, qs) {
  if (pages <= 1) return '';
  const link = (p, label, cls = '') => {
    const q = new URLSearchParams(qs); q.set('page', p);
    return html`<a class="pg ${cls}" href="?${q.toString()}">${label}</a>`;
  };
  const items = [];
  if (page > 1) items.push(link(page - 1, '← Prev'));
  for (let p = 1; p <= pages; p++) items.push(p === page ? html`<span class="pg cur" aria-current="page">${p}</span>` : link(p, p));
  if (page < pages) items.push(link(page + 1, 'Next →'));
  return html`<nav class="pager" aria-label="Pages">${items}</nav>`;
}

// ---------- Pages ----------
export function homePage(ctx, { counts, featured, newest, topRated }) {
  const { cats, locs } = ctx;
  return layout(ctx, {
    title: SITE_NAME, canonical: '/',
    ld: { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: BASE_URL },
    body: html`
<section class="hero">
  <div class="wrap hero-in">
    <p class="kicker">Weddings across Kenya</p>
    <h1>Find the right vendors for your wedding</h1>
    <p class="lead">Compare venues, photographers, caterers, planners and more. Then chat, WhatsApp or call them directly.</p>
    <form class="search" id="search" action="/vendors" method="get">
      <label><span>What do you need?</span>
        <select name="category"><option value="">All categories</option>${cats.map((c) => html`<option value="${c.slug}">${c.name}</option>`)}</select></label>
      <label><span>Where?</span>
        <select name="location"><option value="">All of Kenya</option>${locs.map((l) => html`<option value="${l.slug}">${l.name}</option>`)}</select></label>
      <label><span>Budget up to (KES)</span><input name="max" type="number" min="0" step="1000" inputmode="numeric" placeholder="e.g. 100000"></label>
      <button class="btn" type="submit">Search vendors</button>
    </form>
    <p class="hero-sub"><a class="btn btn-ghost" href="/vendors">Browse all vendors</a></p>
  </div>
</section>

<section class="wrap section">
  <h2>Browse by category</h2>
  <div class="cat-grid">
    ${counts.map((c) => html`<a class="cat" href="/vendors/${c.slug}"><span class="cat-icon" aria-hidden="true">${c.icon}</span><span class="cat-n">${c.name}</span><span class="cat-c">${c.n} ${c.n === 1 ? 'vendor' : 'vendors'}</span></a>`)}
  </div>
</section>

<section class="band"><div class="wrap section">
  <div class="sec-head"><h2>Featured vendors</h2><a href="/vendors">See all</a></div>
  <div class="grid">${featured.map(vendorCard)}</div>
</div></section>

<section class="wrap section" id="locations">
  <h2>Popular locations</h2>
  <div class="chips">${locs.filter((l) => l.popular).map((l) => html`<a class="chip" href="/locations/${l.slug}">${l.name}</a>`)}</div>
</section>

<section class="wrap section">
  <div class="sec-head"><h2>Top rated</h2><a href="/vendors?sort=top">See more</a></div>
  <div class="grid">${topRated.map(vendorCard)}</div>
</section>

<section class="wrap section">
  <div class="sec-head"><h2>Newly joined</h2><a href="/vendors?sort=newest">See more</a></div>
  <div class="grid">${newest.map(vendorCard)}</div>
</section>

<section class="cta"><div class="wrap cta-in">
  <div><h2>Are you a wedding vendor?</h2><p>Create a free listing, show off your work and get enquiries straight to your phone.</p></div>
  <a class="btn btn-gold" href="/signup?role=vendor">List your business</a>
</div></section>`,
  });
}

export function listingPage(ctx, { f, result, category, location, heading, intro, canonical, noindex }) {
  const { cats, locs } = ctx;
  const qs = {};
  for (const k of ['category', 'location', 'min', 'max', 'rating', 'verified', 'sort', 'capacity', 'setting']) if (f[k]) qs[k] = f[k];
  const showVenue = (category && category.slug === 'venues') || f.category === 'venues';
  return layout(ctx, {
    title: heading, description: intro, canonical, noindex,
    body: html`
<section class="page-head"><div class="wrap">
  <p class="crumbs"><a href="/">Home</a> / <a href="/vendors">Vendors</a>${category ? html` / ${category.name}` : ''}</p>
  <h1>${heading}</h1>
  <p class="lead sm">${intro}</p>
  <div class="chip-row" aria-label="Categories"><a class="chip ${!category ? 'on' : ''}" href="/vendors">All</a>${cats.map((c) => html`<a class="chip ${category && category.slug === c.slug ? 'on' : ''}" href="/vendors/${c.slug}">${c.name}</a>`)}</div>
</div></section>
<div class="wrap listing">
  <details class="filters" ${Object.keys(qs).length ? '' : 'open'} id="filters">
    <summary>Filters</summary>
    <form method="get" action="${category && !f.category ? `/vendors/${category.slug}` : '/vendors'}">
      ${category && !f.category ? '' : html`<label>Category<select name="category"><option value="">All categories</option>${cats.map((c) => html`<option value="${c.slug}" ${f.category === c.slug ? 'selected' : ''}>${c.name}</option>`)}</select></label>`}
      <label>Location<select name="location"><option value="">All locations</option>${locs.map((l) => html`<option value="${l.slug}" ${f.location === l.slug ? 'selected' : ''}>${l.name}</option>`)}</select></label>
      <fieldset><legend>Price range (KES)</legend>
        <div class="two"><input name="min" type="number" min="0" step="1000" inputmode="numeric" placeholder="Min" value="${f.min || ''}" aria-label="Minimum price"><input name="max" type="number" min="0" step="1000" inputmode="numeric" placeholder="Max" value="${f.max || ''}" aria-label="Maximum price"></div></fieldset>
      <label>Minimum rating<select name="rating"><option value="">Any</option>${[4.5, 4, 3].map((r) => html`<option value="${r}" ${String(f.rating) === String(r) ? 'selected' : ''}>${r}+ stars</option>`)}</select></label>
      ${showVenue ? html`<label>Minimum capacity (guests)<input name="capacity" type="number" min="0" step="10" inputmode="numeric" value="${f.capacity || ''}"></label>
        <label>Setting<select name="setting"><option value="">Any</option>${['indoor', 'outdoor', 'both'].map((s) => html`<option value="${s}" ${f.setting === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`)}</select></label>` : ''}
      <label class="check"><input type="checkbox" name="verified" value="1" ${f.verified ? 'checked' : ''}> Verified vendors only</label>
      <label>Sort by<select name="sort">${[['', 'Recommended'], ['top', 'Top rated'], ['price_asc', 'Price: low to high'], ['newest', 'Newest']].map(([v, l]) => html`<option value="${v}" ${(f.sort || '') === v ? 'selected' : ''}>${l}</option>`)}</select></label>
      <button class="btn" type="submit">Apply filters</button>
      <a class="reset" href="${category && !f.category ? `/vendors/${category.slug}` : '/vendors'}">Clear all</a>
    </form>
  </details>
  <section class="results" aria-live="polite">
    <p class="count"><strong>${result.total}</strong> ${result.total === 1 ? 'vendor' : 'vendors'} found</p>
    ${result.rows.length
      ? html`<div class="grid g2">${result.rows.map(vendorCard)}</div>${pager(result.page, result.pages, qs)}`
      : html`<div class="empty"><h2>No vendors match yet</h2><p>Try widening your price range or choosing another location.</p><a class="btn" href="${category && !f.category ? `/vendors/${category.slug}` : '/vendors'}">Clear filters</a></div>`}
  </section>
</div>`,
  });
}

export function vendorPage(ctx, { v, services, reviews, similar, sent, quoteErr, form = {} }) {
  const url = vendorUrl(v);
  const about = v.description || `${v.name} is a ${v.category_name.toLowerCase()} provider in ${v.location_name}, Kenya.`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: v.name, description: about,
    address: { '@type': 'PostalAddress', addressLocality: v.location_name, addressRegion: v.county, addressCountry: 'KE' },
    telephone: v.phone, url: `${BASE_URL}${url}`, image: `${BASE_URL}/img/${v.slug}-0.svg`,
    ...(v.price_from ? { priceRange: `${kes(v.price_from)} - ${kes(v.price_to)}` } : {}),
    ...(v.review_count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: v.rating, reviewCount: v.review_count } } : {}),
  };
  return layout(ctx, {
    title: `${v.name}: ${v.category_name} in ${v.location_name}`, description: about.slice(0, 155), canonical: url, ld,
    body: html`
<div class="wrap vendor">
  <p class="crumbs"><a href="/">Home</a> / <a href="/vendors">Vendors</a> / <a href="/vendors/${v.category_slug}">${v.category_name}</a> / ${v.name}</p>
  <div class="gallery" data-gallery>
    ${[0, 1, 2, 3, 4].map((i) => html`<img class="g${i}" loading="${i ? 'lazy' : 'eager'}" src="/img/${v.slug}-${i}.svg" alt="${v.name} photo ${i + 1}" data-i="${i}" width="800" height="600">`)}
  </div>
  <div class="v-cols">
    <div class="v-main">
      <div class="v-head">
        <div>
          <p class="eyebrow">${v.category_name}</p>
          <h1>${v.name} ${v.verified ? html`<span class="badge">✓ Verified</span>` : ''}${v.featured ? html` <span class="badge gold">Featured</span>` : ''}</h1>
          <p class="meta">${v.area ? `${v.area}, ` : ''}${v.location_name}, ${v.county} · ${stars(v)}</p>
        </div>
        <button class="heart lg" data-id="${v.id}" aria-label="Save ${v.name}" aria-pressed="false">♡ <span>Save</span></button>
      </div>
      <h2>About</h2>
      <p>${about}</p>
      <ul class="facts">
        ${v.years ? html`<li><strong>${v.years}</strong> years in business</li>` : ''}
        ${v.languages ? html`<li><strong>Languages:</strong> ${v.languages}</li>` : ''}
        ${v.capacity ? html`<li><strong>Capacity:</strong> up to ${v.capacity} guests</li>` : ''}
        ${v.setting ? html`<li><strong>Setting:</strong> ${v.setting}</li>` : ''}
        ${v.price_from ? html`<li><strong>Price range:</strong> ${kes(v.price_from)} to ${kes(v.price_to)}</li>` : ''}
      </ul>
      <h2>Services and packages</h2>
      <div class="services">
        ${services.length ? services.map((s) => html`<div class="svc"><div><h3>${s.title}</h3><p>${s.description}</p>${s.includes ? html`<p class="inc"><strong>Includes:</strong> ${s.includes}</p>` : ''}</div><div class="svc-p">${s.price_from ? html`From<br><strong>${kes(s.price_from)}</strong>` : 'Ask'}</div></div>`) : html`<p class="muted">This vendor has not listed services yet. Send a quote request to ask.</p>`}
      </div>
      <p class="note">Prices are a guide. Final quotes depend on your date, location and requirements. Availability is confirmed by the vendor.</p>
      <h2>Reviews ${v.review_count ? html`<span class="muted">(${v.review_count})</span>` : ''}</h2>
      ${reviews.length ? reviews.map((r) => html`<article class="review"><div class="rv-h"><strong>${r.author}</strong><span class="star">${'★'.repeat(r.rating)}</span><span class="muted">${r.event_type || ''}</span></div><p>${r.body}</p></article>`) : html`<p class="muted">No reviews yet.</p>`}
    </div>
    <aside class="v-side" id="contact">
      <div class="panel">
        <p class="panel-t">Contact ${v.name}</p>
        <a class="btn btn-block" href="/messages/new?vendor=${v.id}" data-track="chat" data-vendor="${v.id}">Chat on ${SITE_NAME}</a>
        <a class="btn btn-block btn-wa" href="${waLink(v)}" target="_blank" rel="noopener" data-track="whatsapp" data-vendor="${v.id}">WhatsApp</a>
        <a class="btn btn-block btn-outline" href="tel:${v.phone}" data-track="call" data-vendor="${v.id}">Call ${v.phone}</a>
        <hr>
        <p class="panel-t">Request a quote</p>
        ${sent ? html`<p class="ok" role="status">Thank you! Your request has been sent. ${v.name} will get back to you.</p>` : ''}
        ${quoteErr ? html`<p class="err" role="alert">${quoteErr}</p>` : ''}
        <form method="post" action="${url}/quote" class="stack">
          <label>Your name<input name="name" required maxlength="80" value="${form.name || ctx.user?.name || ''}" autocomplete="name"></label>
          <label>Phone<input name="phone" type="tel" required placeholder="07XX XXX XXX" value="${form.phone || ''}" autocomplete="tel"></label>
          <label>Email (optional)<input name="email" type="email" maxlength="120" value="${form.email || ctx.user?.email || ''}" autocomplete="email"></label>
          <label>Wedding date<input name="event_date" type="date" value="${form.event_date || ''}"></label>
          <label>Event location<input name="location" maxlength="120" value="${form.location || ''}"></label>
          <div class="two"><label>Guests<input name="guests" type="number" min="1" max="5000" inputmode="numeric" value="${form.guests || ''}"></label>
          <label>Budget (KES)<input name="budget" type="number" min="0" step="1000" inputmode="numeric" value="${form.budget || ''}"></label></div>
          <label>Message<textarea name="message" rows="3" maxlength="1000">${form.message || ''}</textarea></label>
          <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button class="btn btn-block" type="submit">Send request</button>
        </form>
      </div>
    </aside>
  </div>
  ${similar.length ? html`<section class="section"><h2>Similar vendors</h2><div class="grid">${similar.map(vendorCard)}</div></section>` : ''}
</div>
<div class="lightbox" data-lightbox hidden><button class="lb-x" aria-label="Close">×</button><button class="lb-p" aria-label="Previous">‹</button><img alt=""><button class="lb-n" aria-label="Next">›</button></div>`,
  });
}

function authShell(ctx, title, inner) {
  return layout(ctx, { title, noindex: true, body: html`<div class="wrap auth"><div class="auth-card">${inner}</div></div>` });
}

export function loginPage(ctx, { error, next = '/', email = '' }) {
  return authShell(ctx, 'Log in', html`
    <h1>Welcome back</h1>
    ${error ? html`<p class="err" role="alert">${error}</p>` : ''}
    <form method="post" action="/login" class="stack">
      <input type="hidden" name="next" value="${next}">
      <label>Email<input name="email" type="email" required autocomplete="email" value="${email}"></label>
      <label>Password<input name="password" type="password" required autocomplete="current-password"></label>
      <button class="btn btn-block" type="submit">Log in</button>
    </form>
    <p class="alt">New here? <a href="/signup${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}">Create an account</a></p>`);
}

export function signupPage(ctx, { error, role = 'couple', next = '/', form = {} }) {
  const isVendor = role === 'vendor';
  return authShell(ctx, isVendor ? 'List your business' : 'Create account', html`
    <h1>${isVendor ? 'List your business' : 'Create your account'}</h1>
    <div class="tabs"><a class="${!isVendor ? 'on' : ''}" href="/signup?role=couple">I'm planning a wedding</a><a class="${isVendor ? 'on' : ''}" href="/signup?role=vendor">I'm a vendor</a></div>
    ${error ? html`<p class="err" role="alert">${error}</p>` : ''}
    <form method="post" action="/signup" class="stack">
      <input type="hidden" name="role" value="${role}"><input type="hidden" name="next" value="${next}">
      <label>Your name<input name="name" required maxlength="80" autocomplete="name" value="${form.name || ''}"></label>
      <label>Email<input name="email" type="email" required autocomplete="email" value="${form.email || ''}"></label>
      <label>Phone (Kenya)<input name="phone" type="tel" ${isVendor ? 'required' : ''} placeholder="07XX XXX XXX" autocomplete="tel" value="${form.phone || ''}"></label>
      <label>Password (8+ characters)<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
      ${isVendor ? html`
        <label>Business name<input name="business" required maxlength="100" value="${form.business || ''}"></label>
        <label>Category<select name="category" required><option value="">Choose a category</option>${ctx.cats.map((c) => html`<option value="${c.slug}" ${form.category === c.slug ? 'selected' : ''}>${c.name}</option>`)}</select></label>
        <label>Main location<select name="location" required><option value="">Choose a location</option>${ctx.locs.map((l) => html`<option value="${l.slug}" ${form.location === l.slug ? 'selected' : ''}>${l.name}</option>`)}</select></label>` : ''}
      <label class="check"><input type="checkbox" name="consent" value="1" required> I agree to the <a href="/terms" target="_blank">Terms</a> and the <a href="/privacy" target="_blank">Privacy Policy</a>, and consent to my details being processed as described, in line with the Kenya Data Protection Act.</label>
      <button class="btn btn-block" type="submit">${isVendor ? 'Create vendor account' : 'Create account'}</button>
    </form>
    <p class="alt">Already have an account? <a href="/login">Log in</a></p>`);
}

export function dashboardPage(ctx, { vendor }) {
  return layout(ctx, { title: 'Dashboard', noindex: true, body: html`
<div class="wrap section narrow">
  <h1>Hello, ${ctx.user.name.split(' ')[0]}</h1>
  ${vendor ? html`
    <div class="panel"><p class="panel-t">${vendor.name}</p>
      <p>Status: <span class="badge ${vendor.status === 'approved' ? '' : 'gold'}">${vendor.status === 'approved' ? 'Live' : vendor.status === 'pending' ? 'Awaiting approval' : 'Not approved'}</span></p>
      ${vendor.status === 'approved' ? html`<p><a class="btn btn-sm" href="${vendorUrl(vendor)}">View your public profile</a></p>` : html`<p class="muted">Your listing will appear in the directory once approved.</p>`}
    </div>
    <p class="note">The full vendor dashboard, with services, photo uploads, availability, enquiries and analytics, arrives in phase 2.</p>`
    : html`<p>Your account is ready. Browse vendors or save the ones you like.</p><p><a class="btn" href="/vendors">Browse vendors</a></p>`}
</div>` });
}

export function messagesPage(ctx, { vendor }) {
  return layout(ctx, { title: 'Messages', noindex: true, body: html`
<div class="wrap section narrow">
  <h1>Messages</h1>
  ${vendor ? html`<div class="panel"><p class="panel-t">Chat with ${vendor.name}</p><p>On-site chat is coming in phase 3. For now you can reach ${vendor.name} on WhatsApp or by phone.</p>
    <a class="btn btn-wa" href="${waLink(vendor)}" target="_blank" rel="noopener">WhatsApp</a> <a class="btn btn-outline" href="tel:${vendor.phone}">Call</a></div>`
    : html`<p>On-site chat is coming in phase 3. Until then, contact vendors by WhatsApp or phone from their profile.</p><p><a class="btn" href="/vendors">Browse vendors</a></p>`}
</div>` });
}

export function savedPage(ctx, { rows }) {
  return layout(ctx, { title: 'Saved vendors', noindex: true, body: html`
<div class="wrap section"><h1>Saved vendors</h1>
${rows.length ? html`<div class="grid">${rows.map(vendorCard)}</div>` : html`<p>You have not saved any vendors yet. Tap the heart on a vendor to save it.</p><p><a class="btn" href="/vendors">Browse vendors</a></p>`}
</div>` });
}

export function staticPage(ctx, title, bodyHtml) {
  return layout(ctx, { title, body: html`<div class="wrap section prose"><h1>${title}</h1>${raw(bodyHtml)}</div>` });
}

export function notFoundPage(ctx) {
  return layout(ctx, { title: 'Page not found', noindex: true, body: html`<div class="wrap section narrow"><h1>Page not found</h1><p>We could not find that page.</p><p><a class="btn" href="/vendors">Browse vendors</a></p></div>` });
}
