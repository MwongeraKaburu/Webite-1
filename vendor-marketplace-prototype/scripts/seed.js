import { openDb } from '../lib/db.js';
import { seed } from '../lib/seed.js';
const db = openDb();
const r = seed(db);
const n = db.prepare('SELECT COUNT(*) n FROM vendor_profiles').get().n;
console.log(r.skipped ? `Database already seeded (${n} vendors).` : `Seeded ${n} sample vendors.`);
