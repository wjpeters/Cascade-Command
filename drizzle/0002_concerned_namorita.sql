CREATE TABLE `prize_draws` (
	`version` text NOT NULL,
	`day` text NOT NULL,
	`result` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_prize_draws_day` ON `prize_draws` (`version`,`day`);