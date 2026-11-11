import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('couple','vendor','admin')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  consent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  seo_name TEXT NOT NULL,
  icon TEXT NOT NULL,
  blurb TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  county TEXT NOT NULL,
  popular INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  area TEXT,
  description TEXT,
  years INTEGER,
  languages TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  price_from INTEGER,
  price_to INTEGER,
  capacity INTEGER,
  setting TEXT CHECK (setting IN ('indoor','outdoor','both') OR setting IS NULL),
  verified INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rating REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vendor_cat ON vendor_profiles(category_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_loc ON vendor_profiles(location_id, status);
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_from INTEGER,
  price_to INTEGER,
  includes TEXT
);
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  is_cover INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  event_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS saved_vendors (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, vendor_id)
);
CREATE TABLE IF NOT EXISTS contact_clicks (
  id INTEGER PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('whatsapp','call','chat')),
  user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS quote_requests (
  id INTEGER PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  user_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  event_date TEXT,
  location TEXT,
  guests INTEGER,
  budget INTEGER,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','replied','booked','closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function openDb(path = process.env.DB_PATH || 'data/app.db') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}
