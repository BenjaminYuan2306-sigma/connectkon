import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Intentionally excludes network content, URLs, emails, IPs, and user agents.
export const usageEvents = sqliteTable(
  'usage_events',
  {
    id: text('id').primaryKey(),
    visitor: text('visitor').notNull(),
    event: text('event').notNull(),
    day: text('day').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    index('usage_events_day_visitor').on(table.day, table.visitor),
    index('usage_events_visitor_day').on(table.visitor, table.day),
    index('usage_events_created_at').on(table.createdAt),
  ],
);
