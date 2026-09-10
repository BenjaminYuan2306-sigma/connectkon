CREATE TABLE `usage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`event` text NOT NULL,
	`day` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `usage_events_day_visitor` ON `usage_events` (`day`,`visitor`);--> statement-breakpoint
CREATE INDEX `usage_events_visitor_day` ON `usage_events` (`visitor`,`day`);--> statement-breakpoint
CREATE INDEX `usage_events_created_at` ON `usage_events` (`created_at`);