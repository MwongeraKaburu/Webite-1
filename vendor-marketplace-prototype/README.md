# SiteName: Kenyan wedding vendor marketplace (Phase 1 prototype)

A working, zero-dependency prototype of phase 1 from the build prompt: database, accounts and the public vendor directory.
It runs on **Node 22.13 or newer** with nothing to install (built-in `node:sqlite`, plain server-rendered HTML).

```
npm start          # http://localhost:3000  (creates data/app.db and seeds 30 sample vendors on first run)
npm test           # 15 automated tests
npm run approve -- vendor@email.com   # approve a vendor listing (stand-in for the phase 4 admin panel)
```
Change the site name in `config.js` (or set `SITE_NAME`). Set `PORT`, `BASE_URL` and `DB_PATH` as environment variables if needed.

## What works in this phase
- **Menu:** Vendors (category mega-menu), Locations, List Your Business, Messages (signed in), Log in / Sign up. The Advice, Planning tools, Inspiration, Shop, Merch and Wedding website items are not present.
- **Home:** search by category, location and budget; 20 category tiles with counts; featured, top rated and newest vendors; popular locations; vendor call to action.
- **Directory** (`/vendors`, `/vendors/<category>`, `/locations/<place>`): 12 per page with pagination; filters for location, price range (KES), rating, verified, plus venue capacity and indoor/outdoor; sorting; heart to save.
- **Vendor profile:** photo gallery with lightbox, about, services and packages in KES, reviews, similar vendors, and a sticky contact panel with **Chat**, **WhatsApp** (prefilled message to wa.me) and **Call** (tel: link). Every WhatsApp, Call and Chat click is logged for vendor analytics. A **request a quote** form saves to the database.
- **Accounts:** couple and vendor signup with Data Protection Act consent, login, logout, hashed passwords (scrypt), HttpOnly session cookies. A new vendor signup creates a listing that stays hidden until approved.
- **Kenyan phone numbers** (07xx, 01xx, 254, +254) are normalised to `+254XXXXXXXXX` and validated.
- **SEO:** unique titles and descriptions per category and place (for example "Wedding Photographers in Nairobi"), sitemap.xml, robots.txt, schema.org LocalBusiness data.
- **Safety basics:** automatic HTML escaping, a strict Content-Security-Policy, rate limiting on login, signup, quotes and tracking, and a honeypot on the quote form.

## Not built yet (later phases)
- Vendor dashboard: editing the profile, services, **photo uploads**, availability calendar, quote inbox, reviews, analytics (phase 2). Photos here are generated placeholders.
- **On-site chat** (phase 3). The Chat button currently shows a "coming soon" page with WhatsApp and Call as fallbacks.
- M-Pesa subscriptions, featured placements and the admin panel (phase 4).
- Posting reviews, map view, availability search, PWA/offline, Swahili (phase 5).
- Guests' saved vendors live in the browser only; they are not synced to an account on login.

## Sample data
All 30 vendors, their phone numbers (`+254 7000 0xxxx`) and reviews are fictional placeholders. Delete `data/app.db` to reseed.

## Moving to the production stack
The structure maps directly onto the Next.js + Supabase plan: `lib/db.js` is the schema to port to Postgres migrations (add row-level security), `lib/views.js` becomes React components, `app.js` routes become Next.js pages and route handlers, and sessions move to Supabase Auth. The terms and privacy texts are templates; have them reviewed before launch.
