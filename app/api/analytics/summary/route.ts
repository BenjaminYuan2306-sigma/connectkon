import { analyticsDb } from '@/db';
import { analyticsAccess } from '@/lib/analytics-auth';
import { analyticsDay, analyticsStart } from '@/lib/analytics-contract';
import { analyticsSql } from '@/lib/analytics-sql';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
  });
export async function GET() {
  const access = await analyticsAccess();
  if (!access.owner)
    return json(
      {
        error: access.signedIn ? 'Owner access required.' : 'Sign in required.',
      },
      access.signedIn ? 403 : 401,
    );
  try {
    const db = analyticsDb(),
      now = Date.now(),
      start = analyticsStart(now);
    await db.batch([db.prepare(analyticsSql.prune).bind(now - 90 * 86400_000)]);
    const results = await db.batch<Record<string, unknown>>([
      db.prepare(analyticsSql.totals).bind(analyticsDay(now), start),
      db.prepare(analyticsSql.returning).bind(start),
      db.prepare(analyticsSql.daily).bind(start),
      db.prepare(analyticsSql.features).bind(start),
      db.prepare(analyticsSql.first),
    ]);
    return json({
      ...results[0].results[0],
      ...results[1].results[0],
      daily: results[2].results,
      features: results[3].results,
      ...results[4].results[0],
      updatedAt: new Date(now).toISOString(),
    });
  } catch {
    return json(
      { error: 'Statistics are temporarily unavailable. Please retry.' },
      503,
    );
  }
}
