// Shared statements are separately prepared, bound and tested against SQLite.
export const analyticsSql = {
  collect: `INSERT OR IGNORE INTO usage_events (id, visitor, event, day, created_at)
    SELECT ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM usage_events WHERE visitor = ? AND day = ?) < 500`,
  prune: 'DELETE FROM usage_events WHERE created_at < ?',
  totals: `SELECT COUNT(DISTINCT CASE WHEN day = ? THEN visitor END) AS today,
    COUNT(DISTINCT visitor) AS visitors, COALESCE(SUM(event = 'visit'), 0) AS visits
    FROM usage_events WHERE day >= ?`,
  returning: `SELECT COUNT(*) AS "returning" FROM (
    SELECT visitor FROM usage_events WHERE event = 'visit'
    GROUP BY visitor HAVING MAX(day) >= ? AND MIN(day) < MAX(day)
  )`,
  daily: `SELECT day, COUNT(DISTINCT visitor) AS visitors, COALESCE(SUM(event = 'visit'), 0) AS visits
    FROM usage_events WHERE day >= ? GROUP BY day ORDER BY day`,
  features: `SELECT event, COUNT(*) AS count, COUNT(DISTINCT visitor) AS visitors
    FROM usage_events WHERE day >= ? AND event != 'visit' GROUP BY event ORDER BY count DESC`,
  first: 'SELECT MIN(day) AS firstEvent FROM usage_events',
};
