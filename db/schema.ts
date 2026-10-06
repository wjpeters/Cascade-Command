import { desc } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
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


export const prizeDraws = sqliteTable('prize_draws', {
  version: text('version').notNull(), day: text('day').notNull(), result: text('result').notNull(),
}, table => [uniqueIndex('idx_prize_draws_day').on(table.version, table.day)]);

export const analyticsEvents = sqliteTable('analytics_events', {
  id: text('id').primaryKey(), kind: text('kind').notNull(), started: integer('started').notNull(), day: text('day').notNull(),
  version: text('version').notNull(), finished: integer('finished'), saved: integer('saved').notNull().default(0),
  score: integer('score'), services: integer('services'), duration: real('duration'),
  ip: text('ip'), ipSource: text('ip_source').notNull(), country: text('country').notNull(),
  browser: text('browser').notNull(), os: text('os').notNull(), device: text('device').notNull(),
  language: text('language').notNull(), referrer: text('referrer').notNull(), viewport: text('viewport').notNull(),
}, table => [index('idx_analytics_started').on(table.started), index('idx_analytics_day_kind').on(table.day, table.kind)]);
export const analyticsDaily = sqliteTable('analytics_daily', {
  day: text('day').primaryKey(), visits: integer('visits').notNull().default(0), starts: integer('starts').notNull().default(0),
  completed: integer('completed').notNull().default(0), saved: integer('saved').notNull().default(0),
  durationSum: real('duration_sum').notNull().default(0), scoreSum: integer('score_sum').notNull().default(0),
});
