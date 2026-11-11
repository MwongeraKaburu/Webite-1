// Usage: npm run approve -- <vendor-email>   (stand-in for the admin panel, built in phase 4)
import { openDb } from '../lib/db.js';
const email = process.argv[2];
if (!email) { console.error('Usage: npm run approve -- <vendor-email>'); process.exit(1); }
const db = openDb();
const r = db.prepare("UPDATE vendor_profiles SET status='approved' WHERE user_id=(SELECT id FROM users WHERE email=?)").run(email.toLowerCase());
console.log(r.changes ? `Approved listing for ${email}.` : `No vendor listing found for ${email}.`);
