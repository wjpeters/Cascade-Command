import { desc } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), seed: integer('seed').notNull(),
  version: text('version').notNull(), started: integer('started').notNull(),
  expires: integer('expires').notNull(), consumed: integer('consumed').notNull().default(0),
}, table => [index('idx_sessions_expires').on(table.expires)]);
export const scores = sqliteTable('scores', {
  id: text('id').primaryKey(), sessionId: text('session_id').notNull(),
  name: text('name').notNull(), score: integer('score').notNull(),
  services: integer('services').notNull(), date: text('date').notNull(),
  version: text('version').notNull(),
}, table => [
  uniqueIndex('idx_scores_session').on(table.sessionId),
  index('idx_scores_ranking').on(table.version, desc(table.score), desc(table.services), table.date, table.id),
]);
