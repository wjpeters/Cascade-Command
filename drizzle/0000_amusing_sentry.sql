CREATE TABLE `scores` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`name` text NOT NULL,
	`score` integer NOT NULL,
	`services` integer NOT NULL,
	`date` text NOT NULL,
	`version` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_scores_session` ON `scores` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_scores_ranking` ON `scores` (`version`,"score" desc,"services" desc,`date`,`id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`seed` integer NOT NULL,
	`version` text NOT NULL,
	`started` integer NOT NULL,
	`expires` integer NOT NULL,
	`consumed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_expires` ON `sessions` (`expires`);