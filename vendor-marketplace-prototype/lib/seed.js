// Sample data only. All vendors, phone numbers and reviews are fictional placeholders.
import { slugify, rng } from './util.js';

export const CATEGORIES = [
  ['venues', 'Venues', 'Wedding Venues', '🏛️', 'Gardens, lodges, hotels and beach villas for your ceremony and reception.'],
  ['photographers', 'Photographers', 'Wedding Photographers', '📷', 'Capture the day, from the ruracio to the reception.'],
  ['videographers', 'Videographers', 'Wedding Videographers', '🎬', 'Cinematic films, highlight reels and live streaming.'],
  ['planners', 'Wedding Planners and Coordinators', 'Wedding Planners and Coordinators', '📋', 'Full planning, partial planning and day-of coordination.'],
  ['caterers', 'Caterers', 'Wedding Caterers', '🍽️', 'Buffets, nyama choma, plated dinners and cocktail menus.'],
  ['decor-florists', 'Décor and Florists', 'Wedding Décor and Florists', '💐', 'Flowers, draping, backdrops and table styling.'],
  ['bridal-wear', 'Bridal Gowns and Suits', 'Bridal Gowns and Suits', '👰', 'Gowns, suits and bridal party outfits, bought or hired.'],
  ['traditional-attire', 'Tailors and Traditional Attire', 'Traditional Wedding Attire and Tailors', '🧵', 'Kitenge, leso, kanzu and custom-tailored ceremony wear.'],
  ['hair-makeup', 'Hair and Makeup', 'Wedding Hair and Makeup Artists', '💄', 'Bridal makeup, hair styling and trials.'],
  ['cakes', 'Cakes and Desserts', 'Wedding Cakes and Desserts', '🎂', 'Custom wedding cakes, cupcakes and dessert tables.'],
  ['mcs', 'MCs', 'Wedding MCs', '🎤', 'Hosts who keep the programme flowing and the guests smiling.'],
  ['djs-bands', 'DJs and Live Bands', 'Wedding DJs and Live Bands', '🎶', 'Music for the ceremony, the reception and the dance floor.'],
  ['sound-lighting', 'Sound, Lighting and Staging', 'Wedding Sound, Lighting and Staging', '🔊', 'PA systems, uplighting, stages and LED screens.'],
  ['tents-hire', 'Tents, Chairs and Equipment Hire', 'Wedding Tents, Chairs and Equipment Hire', '⛺', 'Marquees, chairs, tables, linen and cutlery hire.'],
  ['transport', 'Transport and Wedding Cars', 'Wedding Cars and Transport', '🚗', 'Bridal cars, guest shuttles and convoy coordination.'],
  ['invitations', 'Invitations and Stationery', 'Wedding Invitations and Stationery', '✉️', 'Printed and digital invitations, programmes and signage.'],
  ['photo-booths', 'Photo Booths', 'Wedding Photo Booths', '🖼️', 'Instant prints, 360 booths and custom props.'],
  ['honeymoon-travel', 'Honeymoon and Travel', 'Honeymoon and Travel Planners', '✈️', 'Safari, beach and international honeymoon packages.'],
  ['ruracio', 'Ruracio and Traditional Ceremony Services', 'Ruracio and Traditional Ceremony Services', '🤝', 'Coordination for dowry negotiations and traditional ceremonies.'],
  ['bridal-showers', 'Bridal Shower and Bachelorette Planners', 'Bridal Shower and Bachelorette Planners', '🥂', 'Themed showers, kitchen parties and bachelorette getaways.'],
];

export const LOCATIONS = [
  // slug-derived from name; [name, county, popular]
  ['Nairobi', 'Nairobi', 1], ['Mombasa', 'Mombasa', 1], ['Kisumu', 'Kisumu', 1], ['Nakuru', 'Nakuru', 1],
  ['Eldoret', 'Uasin Gishu', 1], ['Kiambu', 'Kiambu', 1], ['Machakos', 'Machakos', 1], ['Kajiado', 'Kajiado', 1],
  ['Nanyuki', 'Laikipia', 1], ['Naivasha', 'Nakuru', 1], ['Diani', 'Kwale', 1], ['Malindi', 'Kilifi', 1],
  ['Thika', 'Kiambu', 0], ['Nyeri', 'Nyeri', 0],
];

// Per-category pricing and service templates.
// base = typical "from" price in KES. svc = [title, description, multiplier of base, what's included]
const PRICING = {
  venues: { base: 150000, svc: [['Ceremony and reception hire', 'Full-day exclusive use of the grounds.', 1, 'Setup time, tables and chairs, parking, on-site manager'], ['Reception only', 'Evening reception package.', 0.6, 'Tables and chairs, basic lighting, parking']] },
  photographers: { base: 60000, svc: [['Half-day coverage', 'Up to 5 hours of coverage with edited photos.', 1, '300+ edited photos, online gallery'], ['Full-day coverage', 'Preparation through to the first dance.', 1.7, '600+ edited photos, 2 photographers, album'], ['Engagement shoot', 'A relaxed pre-wedding session.', 0.4, '1 hour, 40 edited photos']] },
  videographers: { base: 80000, svc: [['Highlight film', '3 to 5 minute cinematic film.', 1, 'Drone shots, licensed music'], ['Full documentary', 'Complete ceremony and speeches.', 1.8, 'Highlight film, full edit, USB copy']] },
  planners: { base: 120000, svc: [['Day-of coordination', 'We run the day so you can enjoy it.', 1, 'Vendor liaison, timeline, on-site team'], ['Full planning', 'From budget to the last dance.', 3, 'Budget, vendor sourcing, site visits, coordination']] },
  caterers: { base: 1200, svc: [['Buffet menu (per guest)', 'Choice of mains, sides and dessert.', 1, 'Service staff, buffet setup, cutlery'], ['Plated dinner (per guest)', 'Three-course sit-down meal.', 1.8, 'Waiters, crockery, table service'], ['Nyama choma station', 'Live grill add-on.', 0.8, 'Grill chef, accompaniments']] },
  'decor-florists': { base: 70000, svc: [['Ceremony décor', 'Arch, aisle and altar styling.', 1, 'Fresh flowers, draping, setup and takedown'], ['Reception styling', 'Tables, backdrop and centrepieces.', 1.6, 'Centrepieces, head table, backdrop']] },
  'bridal-wear': { base: 45000, svc: [['Gown hire', 'Choice from our current collection.', 1, 'Fitting, alterations, cleaning'], ['Groom suit hire', 'Three-piece suit with accessories.', 0.5, 'Fitting, accessories']] },
  'traditional-attire': { base: 12000, svc: [['Custom kitenge outfit', 'Made-to-measure traditional attire.', 1, 'Fabric, two fittings'], ['Bridal party set', 'Matching outfits for the bridal party.', 2.5, 'Up to 6 outfits, fittings']] },
  'hair-makeup': { base: 15000, svc: [['Bridal makeup', 'Airbrush or classic finish.', 1, 'Trial, touch-up kit'], ['Makeup and hair', 'Full bridal beauty package.', 1.6, 'Trial, hair styling, lashes']] },
  cakes: { base: 12000, svc: [['Two-tier wedding cake', 'Serves about 80 guests.', 1, 'Custom flavours, delivery'], ['Dessert table', 'Cupcakes, cake pops and sweets.', 1.4, 'Display stands, setup']] },
  mcs: { base: 25000, svc: [['Full-day MC', 'Ceremony to reception.', 1, 'Programme planning, bilingual hosting'], ['Reception MC', 'Evening programme host.', 0.7, 'Programme planning']] },
  'djs-bands': { base: 40000, svc: [['DJ and sound', 'Six hours of music with sound system.', 1, 'Sound system, MC mic, playlist consult'], ['Live band', 'Five-piece band, two sets.', 2.2, 'Instruments, sound, 2 x 45-minute sets']] },
  'sound-lighting': { base: 50000, svc: [['Sound and uplighting', 'PA system with LED uplighting.', 1, 'PA, microphones, 12 uplights, technician'], ['Stage and LED screen', 'Stage with a large LED backdrop.', 2, 'Stage, LED screen, operator']] },
  'tents-hire': { base: 35000, svc: [['200-guest tent package', 'Marquee, chairs and tables.', 1, 'Tent, 200 chairs, 20 tables, setup'], ['Linen and cutlery', 'Hire per table setting.', 0.3, 'Linen, crockery, cutlery']] },
  transport: { base: 20000, svc: [['Bridal car', 'Decorated luxury car with driver.', 1, 'Driver, décor, 6 hours'], ['Guest shuttle', '33-seater coach for guests.', 0.8, 'Driver, fuel within county']] },
  invitations: { base: 8000, svc: [['Printed invitations (50)', 'Custom designed and printed.', 1, 'Design, printing, envelopes'], ['Digital invitation', 'Shareable on WhatsApp and email.', 0.25, 'Design, RSVP link']] },
  'photo-booths': { base: 30000, svc: [['Photo booth (4 hours)', 'Unlimited prints with props.', 1, 'Attendant, props, instant prints'], ['360 booth', 'Video booth for slow-motion clips.', 1.4, 'Attendant, sharing station']] },
  'honeymoon-travel': { base: 90000, svc: [['Beach honeymoon', '4 nights at a Kenyan coast resort.', 1, 'Accommodation, transfers, breakfast'], ['Safari honeymoon', '3 nights in the Maasai Mara.', 1.6, 'Lodge, park fees, game drives']] },
  ruracio: { base: 40000, svc: [['Ruracio coordination', 'Planning and running the traditional ceremony.', 1, 'Programme, family liaison, on-site team'], ['Ruracio hosting package', 'Coordination plus tent, seating and catering.', 2.2, 'Tent, seating, catering, coordinator']] },
  'bridal-showers': { base: 25000, svc: [['Bridal shower', 'Themed shower for up to 20 guests.', 1, 'Décor, games, snacks'], ['Bachelorette getaway', 'Weekend plan with activities.', 2.2, 'Itinerary, booking, coordinator']] },
};

// name, category, location, area, years, languages, verified, featured, extra
const VENDORS = [
  ['Acacia Ridge Gardens', 'venues', 'Kiambu', 'Kiambu Road', 9, 'English, Kiswahili', 1, 1, { capacity: 400, setting: 'outdoor' }],
  ['Baobab Coast Villa', 'venues', 'Diani', 'Diani Beach', 6, 'English, Kiswahili', 1, 1, { capacity: 150, setting: 'both' }],
  ['Lakeview Terrace', 'venues', 'Kisumu', 'Milimani', 5, 'English, Kiswahili, Dholuo', 0, 0, { capacity: 300, setting: 'both' }],
  ['Rift Ridge Lodge', 'venues', 'Naivasha', 'Moi South Lake Road', 11, 'English, Kiswahili', 1, 0, { capacity: 250, setting: 'outdoor' }],
  ['Golden Hour Studios', 'photographers', 'Nairobi', 'Westlands', 8, 'English, Kiswahili', 1, 1],
  ['Pwani Frames', 'photographers', 'Mombasa', 'Nyali', 5, 'English, Kiswahili', 0, 0],
  ['Reel Vows Films', 'videographers', 'Nairobi', 'Kilimani', 6, 'English, Kiswahili', 1, 0],
  ['Eventide Weddings Co.', 'planners', 'Nairobi', 'Lavington', 10, 'English, Kiswahili', 1, 1],
  ['Lakeside Celebrations', 'planners', 'Kisumu', 'Milimani', 4, 'English, Kiswahili, Dholuo', 0, 0],
  ['Zawadi Table Catering', 'caterers', 'Nakuru', 'Milimani', 12, 'English, Kiswahili', 1, 0],
  ['Savoury Spoon Events', 'caterers', 'Nairobi', 'Embakasi', 7, 'English, Kiswahili', 0, 0],
  ['Petal and Thread Décor', 'decor-florists', 'Nairobi', 'Karen', 7, 'English, Kiswahili', 1, 1],
  ['Coastal Bloom Florals', 'decor-florists', 'Mombasa', 'Bamburi', 4, 'English, Kiswahili', 0, 0],
  ['Ivory Lane Bridal', 'bridal-wear', 'Nairobi', 'Westlands', 9, 'English, Kiswahili', 1, 0],
  ['Kariokor Heritage Tailors', 'traditional-attire', 'Nairobi', 'Kariokor', 15, 'English, Kiswahili, Kikuyu', 1, 0],
  ['Glow by Wanjiru', 'hair-makeup', 'Nairobi', 'Kilimani', 6, 'English, Kiswahili', 1, 1],
  ['Sweet Crumb Cakes', 'cakes', 'Eldoret', 'Elgon View', 5, 'English, Kiswahili', 0, 0],
  ['Silver Tongue MCs', 'mcs', 'Nairobi', 'South B', 8, 'English, Kiswahili, Sheng', 1, 0],
  ['Afrobeat Collective Band', 'djs-bands', 'Nairobi', 'Kileleshwa', 10, 'English, Kiswahili', 1, 0],
  ['Lumen Stage and Sound', 'sound-lighting', 'Thika', 'Thika Town', 7, 'English, Kiswahili', 0, 0],
  ['Grand Canopy Hire', 'tents-hire', 'Machakos', 'Machakos Town', 12, 'English, Kiswahili, Kamba', 1, 0],
  ['Royal Ride Wedding Cars', 'transport', 'Nairobi', 'Parklands', 8, 'English, Kiswahili', 1, 0],
  ['Paper Hearts Stationery', 'invitations', 'Nairobi', 'Ngong Road', 4, 'English, Kiswahili', 0, 0],
  ['Flashbox Booths', 'photo-booths', 'Nairobi', 'Ruaka', 3, 'English, Kiswahili', 0, 0],
  ['Safari Vows Honeymoons', 'honeymoon-travel', 'Diani', 'Diani Beach', 8, 'English, Kiswahili', 1, 0],
  ['Heritage Ruracio Coordinators', 'ruracio', 'Nyeri', 'Nyeri Town', 11, 'English, Kiswahili, Kikuyu', 1, 0],
  ['Bachelorette Nest', 'bridal-showers', 'Nairobi', 'Kileleshwa', 3, 'English, Kiswahili', 0, 0],
  ['Rungiri Kitchens', 'caterers', 'Kajiado', 'Ongata Rongai', 6, 'English, Kiswahili, Maa', 0, 0],
  ['Nanyuki Peaks Weddings', 'planners', 'Nanyuki', 'Nanyuki Town', 5, 'English, Kiswahili', 0, 0],
  ['Malindi Sands Photography', 'photographers', 'Malindi', 'Casuarina', 6, 'English, Kiswahili, Italian', 1, 0],
];

const DESCRIPTIONS = {
  venues: '{name} is a wedding venue in {place} with space for your ceremony and reception, parking for your guests and a team that handles setup on the day.',
  photographers: '{name} tells wedding stories through natural, timeless photography. Based in {place}, the team travels across Kenya for ruracio, church, civil and coastal weddings.',
  videographers: '{name} creates cinematic wedding films that you will want to rewatch for years. Based in {place}, with drone coverage available.',
  planners: '{name} plans and coordinates weddings from {place}, from budgets and vendor sourcing to a calm, well-run wedding day.',
  caterers: '{name} serves fresh, generously portioned wedding menus in {place} and beyond, from nyama choma to plated three-course dinners.',
  'decor-florists': '{name} designs wedding florals and décor in {place}, from ceremony arches to table styling, matched to your colours and venue.',
  'bridal-wear': '{name} offers bridal gowns and suits in {place}, with fittings and alterations included so everything fits on the day.',
  'traditional-attire': '{name} makes custom traditional and contemporary wedding attire in {place}, with kitenge, leso and kanzu options.',
  'hair-makeup': '{name} provides bridal hair and makeup in {place}, with a trial session so you know exactly how you will look.',
  cakes: '{name} bakes custom wedding cakes and dessert tables in {place}, with flavour tastings available.',
  mcs: '{name} hosts weddings in English, Kiswahili and Sheng, keeping the programme on time and the mood warm. Based in {place}.',
  'djs-bands': '{name} brings the dance floor to life with a mix of Afrobeat, benga, gospel, rhumba and the current hits. Based in {place}.',
  'sound-lighting': '{name} supplies sound, lighting and staging for weddings in {place} and surrounding areas, with a technician on site throughout.',
  'tents-hire': '{name} hires tents, chairs, tables and linen for weddings in {place}, delivered, set up and collected.',
  transport: '{name} provides decorated bridal cars and guest transport in {place}, with experienced, punctual drivers.',
  invitations: '{name} designs and prints wedding invitations, programmes and signage in {place}, with digital options for WhatsApp.',
  'photo-booths': '{name} brings photo booth fun to weddings in {place}, with instant prints, custom backdrops and a friendly attendant.',
  'honeymoon-travel': '{name} plans honeymoons across the Kenyan coast, the Maasai Mara and beyond, with transfers and bookings handled for you.',
  ruracio: '{name} coordinates ruracio and other traditional ceremonies in {place} and surrounding areas, working with both families so the day runs with respect and ease.',
  'bridal-showers': '{name} plans bridal showers, kitchen parties and bachelorette getaways in {place}, from themes and décor to games and bookings.',
};

const REVIEW_BODIES = [
  'Professional from the first call to the last dance. Highly recommend.',
  'Delivered exactly what we asked for, and on time.',
  'Very responsive on WhatsApp, which made planning so much easier.',
  'Worth every shilling. Our guests are still talking about it.',
  'Good communication and fair pricing. We would book again.',
  'They went above and beyond on the day and nothing was too much trouble.',
  'Easy to work with and very flexible when our plans changed.',
  'Our families were impressed, especially at the ruracio.',
];
const REVIEWERS = ['Wanjiru M.', 'Brian O.', 'Achieng A.', 'Kevin K.', 'Mercy N.', 'Faith W.', 'Otieno J.', 'Amina H.', 'Njeri G.', 'Mwangi P.', 'Chebet R.', 'Hassan S.'];
const EVENTS = ['Church wedding', 'Ruracio', 'Civil wedding', 'Coastal wedding', 'Garden wedding'];

const round1000 = (n) => Math.round(n / 1000) * 1000;
const round100 = (n) => Math.round(n / 100) * 100;

export function seed(db) {
  if (db.prepare('SELECT COUNT(*) n FROM categories').get().n > 0) return { skipped: true };
  db.exec('BEGIN');
  try {
    const insCat = db.prepare('INSERT INTO categories (slug,name,seo_name,icon,blurb,sort) VALUES (?,?,?,?,?,?)');
    CATEGORIES.forEach(([slug, name, seo, icon, blurb], i) => insCat.run(slug, name, seo, icon, blurb, i));
    const insLoc = db.prepare('INSERT INTO locations (slug,name,county,popular,sort) VALUES (?,?,?,?,?)');
    LOCATIONS.forEach(([name, county, pop], i) => insLoc.run(slugify(name), name, county, pop, i));

    const cat = Object.fromEntries(db.prepare('SELECT id, slug FROM categories').all().map((c) => [c.slug, c.id]));
    const loc = Object.fromEntries(db.prepare('SELECT id, name FROM locations').all().map((l) => [l.name, l.id]));
    const insV = db.prepare(`INSERT INTO vendor_profiles
      (slug,name,category_id,location_id,area,description,years,languages,phone,whatsapp,email,price_from,price_to,capacity,setting,verified,featured,status,rating,review_count,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'approved',?,?,datetime('now', ?))`);
    const insS = db.prepare('INSERT INTO services (vendor_id,title,description,price_from,price_to,includes) VALUES (?,?,?,?,?,?)');
    const insR = db.prepare('INSERT INTO reviews (vendor_id,author,rating,body,event_type,created_at) VALUES (?,?,?,?,?,datetime(\'now\', ?))');

    VENDORS.forEach(([name, catSlug, place, area, years, languages, verified, featured, extra = {}], i) => {
      const r = rng(name);
      const p = PRICING[catSlug];
      const isPerGuest = catSlug === 'caterers';
      const round = isPerGuest ? round100 : round1000;
      const factor = 0.75 + r() * 0.6;
      const svcRows = p.svc.map(([title, desc, mult, includes]) => {
        const from = round(p.base * mult * factor);
        return [title, desc, from, round(from * (1.25 + r() * 0.4)), includes];
      });
      const priceFrom = Math.min(...svcRows.map((s) => s[2]));
      const priceTo = Math.max(...svcRows.map((s) => s[3]));
      // Sample phone numbers: obviously fake sequence, not real subscribers.
      const phone = '+2547000' + String(1000 + i).padStart(5, '0');
      const slug = slugify(name);
      const reviewCount = 2 + Math.floor(r() * 6);
      const ratings = Array.from({ length: reviewCount }, () => (r() < 0.78 ? 5 : r() < 0.8 ? 4 : 3));
      const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
      const description = DESCRIPTIONS[catSlug].replace('{name}', name).replace('{place}', area ? `${area}, ${place}` : place);
      const res = insV.run(slug, name, cat[catSlug], loc[place], area, description, years, languages, phone, phone,
        `hello@${slug.replace(/-/g, '')}.example`, priceFrom, priceTo, extra.capacity ?? null, extra.setting ?? null,
        verified, featured, avg, reviewCount, `-${i * 9 + 3} days`);
      const vid = Number(res.lastInsertRowid);
      svcRows.forEach((s) => insS.run(vid, ...s));
      ratings.forEach((rating, k) => insR.run(vid, REVIEWERS[Math.floor(r() * REVIEWERS.length)], rating,
        REVIEW_BODIES[Math.floor(r() * REVIEW_BODIES.length)], EVENTS[Math.floor(r() * EVENTS.length)], `-${20 + k * 37} days`));
    });
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return { skipped: false };
}
