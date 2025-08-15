DROP TABLE `asset_tag`;--> statement-breakpoint
DROP TABLE `attachment`;--> statement-breakpoint
DROP TABLE `depreciation_entry`;--> statement-breakpoint
DROP TABLE `maintenance_schedule`;--> statement-breakpoint
DROP TABLE `permission`;--> statement-breakpoint
DROP TABLE `purchase`;--> statement-breakpoint
DROP TABLE `purchase_item`;--> statement-breakpoint
DROP TABLE `role`;--> statement-breakpoint
DROP TABLE `role_permission`;--> statement-breakpoint
DROP TABLE `tag`;--> statement-breakpoint
DROP TABLE `user_role`;--> statement-breakpoint
DROP TABLE `vendor`;--> statement-breakpoint
DROP TABLE `warranty`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_asset` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category_id` text,
	`location_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`serial_no` text,
	`purchase_date` integer,
	`purchase_cost_cents` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `asset_category`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`location_id`) REFERENCES `location`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_asset`("id", "code", "name", "category_id", "location_id", "status", "serial_no", "purchase_date", "purchase_cost_cents", "notes", "created_at", "updated_at") SELECT "id", "code", "name", "category_id", "location_id", "status", "serial_no", "purchase_date", "purchase_cost_cents", "notes", "created_at", "updated_at" FROM `asset`;--> statement-breakpoint
DROP TABLE `asset`;--> statement-breakpoint
ALTER TABLE `__new_asset` RENAME TO `asset`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `asset_code_unique` ON `asset` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_asset_code` ON `asset` (`code`);--> statement-breakpoint
CREATE INDEX `ix_asset_category` ON `asset` (`category_id`);--> statement-breakpoint
CREATE INDEX `ix_asset_location` ON `asset` (`location_id`);--> statement-breakpoint
CREATE TABLE `__new_maintenance_order` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'open' NOT NULL,
	`opened_at` integer DEFAULT (unixepoch()),
	`closed_at` integer,
	`cost_cents` integer DEFAULT 0,
	`notes` text,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_maintenance_order`("id", "asset_id", "title", "description", "status", "opened_at", "closed_at", "cost_cents", "notes") SELECT "id", "asset_id", "title", "description", "status", "opened_at", "closed_at", "cost_cents", "notes" FROM `maintenance_order`;--> statement-breakpoint
DROP TABLE `maintenance_order`;--> statement-breakpoint
ALTER TABLE `__new_maintenance_order` RENAME TO `maintenance_order`;--> statement-breakpoint
CREATE INDEX `ix_maint_asset` ON `maintenance_order` (`asset_id`);--> statement-breakpoint
DROP INDEX `ix_assignment_asset`;--> statement-breakpoint
DROP INDEX `ix_assignment_user`;--> statement-breakpoint
DROP INDEX `ix_assignment_outstanding`;--> statement-breakpoint
CREATE INDEX `ix_assign_asset` ON `asset_assignment` (`asset_id`);--> statement-breakpoint
CREATE INDEX `ix_assign_user` ON `asset_assignment` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_assign_outstanding` ON `asset_assignment` (`asset_id`,`returned_at`);--> statement-breakpoint
DROP INDEX `ix_session_user_id`;--> statement-breakpoint
CREATE INDEX `ix_session_user` ON `session` (`user_id`);--> statement-breakpoint
ALTER TABLE `location` DROP COLUMN `code`;