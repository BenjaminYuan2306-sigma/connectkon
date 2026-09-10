import { env } from 'cloudflare:workers';
export function analyticsDb(): D1Database {
  if (!env.DB) throw new Error('Analytics database is unavailable.');
  return env.DB;
}
