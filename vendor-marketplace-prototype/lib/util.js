import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

// ---------- HTML templating with automatic escaping ----------
export class Raw { constructor(s) { this.s = s; } }
export const raw = (s) => new Raw(String(s));
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const render = (v) => v instanceof Raw ? v.s : Array.isArray(v) ? v.map(render).join('') : (v == null || v === false) ? '' : esc(v);
export const html = (strs, ...vals) => new Raw(strs.reduce((o, s, i) => o + s + (i < vals.length ? render(vals[i]) : ''), ''));
export const toStr = render;
export const jsonLd = (obj) => raw(JSON.stringify(obj).replace(/</g, '\\u003c'));

// ---------- Formatting ----------
export const kes = (n) => (n == null ? '' : 'KES ' + Number(n).toLocaleString('en-US'));
export const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---------- Kenyan phone numbers ----------
// Accepts 07xx / 01xx / 7xx / 254xx / +254xx (with spaces, dashes, brackets). Returns +254XXXXXXXXX or null.
export function normalisePhone(input) {
  if (input == null) return null;
  let s = String(input).trim().replace(/[\s\-().]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('254')) s = s.slice(3);
  else if (s.startsWith('0')) s = s.slice(1);
  return /^[17]\d{8}$/.test(s) ? '+254' + s : null;
}
export const waNumber = (e164) => e164.replace(/^\+/, '');

// ---------- Passwords ----------
export function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString('hex')}`;
}
export function verifyPassword(pw, stored) {
  const [alg, salt, hash] = String(stored).split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------- HTTP helpers ----------
export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
export async function readForm(req, limit = 200_000) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > limit) throw new Error('Body too large'); chunks.push(c); }
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8')));
}
export const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') && !n.includes('\\') ? n : '/');

// ---------- Tiny in-memory rate limiter ----------
const hits = new Map();
export function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
}
export const resetLimits = () => hits.clear();

// ---------- Deterministic random (for seed data and placeholder art) ----------
export function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed) {
  let a = typeof seed === 'string' ? hash32(seed) : seed;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
