import { createServer } from 'node:http';
import { openDb } from './lib/db.js';
import { seed } from './lib/seed.js';
import { createApp } from './app.js';
import { PORT, SITE_NAME } from './config.js';

const db = openDb();
if (!seed(db).skipped) console.log('Seeded sample data.');
createServer(createApp(db)).listen(PORT, () => console.log(`${SITE_NAME} running at http://localhost:${PORT}`));
