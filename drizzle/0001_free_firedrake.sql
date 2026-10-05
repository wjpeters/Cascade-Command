CREATE TABLE `analytics_daily` (
	`day` text PRIMARY KEY NOT NULL,
	`visits` integer DEFAULT 0 NOT NULL,
	`starts` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`saved` integer DEFAULT 0 NOT NULL,
	`duration_sum` real DEFAULT 0 NOT NULL,
	`score_sum` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`started` integer NOT NULL,
	`day` text NOT NULL,
	`version` text NOT NULL,
	`finished` integer,
	`saved` integer DEFAULT 0 NOT NULL,
	`score` integer,
	`services` integer,
	`duration` real,
	`ip` text,
	`ip_source` text NOT NULL,
	`country` text NOT NULL,
	`browser` text NOT NULL,
	`os` text NOT NULL,
	`device` text NOT NULL,
	`language` text NOT NULL,
	`referrer` text NOT NULL,
	`viewport` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_analytics_started` ON `analytics_events` (`started`);--> statement-breakpoint
CREATE INDEX `idx_analytics_day_kind` ON `analytics_events` (`day`,`kind`);