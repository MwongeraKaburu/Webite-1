// Change the site name here and it updates everywhere.
export const SITE_NAME = process.env.SITE_NAME || 'SiteName';
export const PORT = Number(process.env.PORT || 3000);
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
export const PER_PAGE = 12;
export const SESSION_DAYS = 30;
