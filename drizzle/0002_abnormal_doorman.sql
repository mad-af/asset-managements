CREATE TABLE `asset` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category_id` text,
	`location_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`purchase_item_id` text,
	`serial_no` text,
	`purchase_date` integer,
	`purchase_cost_cents` integer,
	`useful_life_months` integer,
	`depreciation_method` text,
	`residual_value_cents` integer DEFAULT 0,
	`retired_at` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `asset_category`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`location_id`) REFERENCES `location`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_item`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `asset_code_unique` ON `asset` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_asset_code` ON `asset` (`code`);--> statement-breakpoint
CREATE INDEX `ix_asset_category` ON `asset` (`category_id`);--> statement-breakpoint
CREATE INDEX `ix_asset_location` ON `asset` (`location_id`);--> statement-breakpoint
CREATE TABLE `asset_assignment` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`user_id` text NOT NULL,
	`assigned_at` integer DEFAULT (unixepoch()) NOT NULL,
	`due_at` integer,
	`returned_at` integer,
	`condition_out` text,
	`condition_in` text,
	`notes` text,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_assignment_asset` ON `asset_assignment` (`asset_id`);--> statement-breakpoint
CREATE INDEX `ix_assignment_user` ON `asset_assignment` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_assignment_outstanding` ON `asset_assignment` (`asset_id`,`returned_at`);--> statement-breakpoint
CREATE TABLE `asset_category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `asset_category_name_unique` ON `asset_category` (`name`);--> statement-breakpoint
CREATE TABLE `asset_tag` (
	`asset_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`asset_id`, `tag_id`),
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_asset_tag_asset` ON `asset_tag` (`asset_id`);--> statement-breakpoint
CREATE INDEX `ix_asset_tag_tag` ON `asset_tag` (`tag_id`);--> statement-breakpoint
CREATE TABLE `attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text,
	`path_or_url` text NOT NULL,
	`uploaded_at` integer DEFAULT (unixepoch()),
	`notes` text,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_attachment_asset` ON `attachment` (`asset_id`);--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`location_id` text,
	`title` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`started_at` integer,
	`finalized_at` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `location`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ix_audit_location` ON `audit` (`location_id`);--> statement-breakpoint
CREATE INDEX `ix_audit_status` ON `audit` (`status`);--> statement-breakpoint
CREATE TABLE `audit_item` (
	`id` text PRIMARY KEY NOT NULL,
	`audit_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`found` integer DEFAULT false NOT NULL,
	`found_location_id` text,
	`condition` text,
	`notes` text,
	`scanned_at` integer,
	FOREIGN KEY (`audit_id`) REFERENCES `audit`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`found_location_id`) REFERENCES `location`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ix_audit_item_audit` ON `audit_item` (`audit_id`);--> statement-breakpoint
CREATE INDEX `ix_audit_item_asset` ON `audit_item` (`asset_id`);--> statement-breakpoint
CREATE TABLE `depreciation_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`period` text NOT NULL,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`accumulated_cents` integer DEFAULT 0 NOT NULL,
	`book_value_cents` integer DEFAULT 0 NOT NULL,
	`posted_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_depr_asset_period` ON `depreciation_entry` (`asset_id`,`period`);--> statement-breakpoint
CREATE INDEX `ix_depr_asset` ON `depreciation_entry` (`asset_id`);--> statement-breakpoint
CREATE TABLE `location` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`parent_id` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `location_name_unique` ON `location` (`name`);--> statement-breakpoint
CREATE INDEX `ix_location_parent` ON `location` (`parent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_location_name` ON `location` (`name`);--> statement-breakpoint
CREATE TABLE `maintenance_order` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`requested_by` text,
	`schedule_id` text,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'open' NOT NULL,
	`opened_at` integer DEFAULT (unixepoch()),
	`closed_at` integer,
	`cost_cents` integer DEFAULT 0,
	`vendor_id` text,
	`notes` text,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`requested_by`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`schedule_id`) REFERENCES `maintenance_schedule`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ix_maint_order_asset` ON `maintenance_order` (`asset_id`);--> statement-breakpoint
CREATE INDEX `ix_maint_order_status` ON `maintenance_order` (`status`);--> statement-breakpoint
CREATE TABLE `maintenance_schedule` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`title` text NOT NULL,
	`frequency` text NOT NULL,
	`interval_value` integer,
	`next_due_at` integer,
	`active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_maint_sched_asset` ON `maintenance_schedule` (`asset_id`);--> statement-breakpoint
CREATE INDEX `ix_maint_sched_next_due` ON `maintenance_schedule` (`next_due_at`);--> statement-breakpoint
CREATE TABLE `permission` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permission_code_unique` ON `permission` (`code`);--> statement-breakpoint
CREATE TABLE `purchase` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text,
	`po_number` text NOT NULL,
	`ordered_at` integer,
	`received_at` integer,
	`subtotal_cents` integer,
	`tax_cents` integer,
	`shipping_cents` integer,
	`total_cents` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_po_number_unique` ON `purchase` (`po_number`);--> statement-breakpoint
CREATE INDEX `ix_purchase_vendor` ON `purchase` (`vendor_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_purchase_po` ON `purchase` (`po_number`);--> statement-breakpoint
CREATE TABLE `purchase_item` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_id` text NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`qty` integer DEFAULT 1 NOT NULL,
	`unit_price_cents` integer DEFAULT 0 NOT NULL,
	`total_price_cents` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchase`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_purchase_item_purchase` ON `purchase_item` (`purchase_id`);--> statement-breakpoint
CREATE TABLE `role` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `role_name_unique` ON `role` (`name`);--> statement-breakpoint
CREATE TABLE `role_permission` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permission`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_role_perm_role` ON `role_permission` (`role_id`);--> statement-breakpoint
CREATE INDEX `ix_role_perm_perm` ON `role_permission` (`permission_id`);--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_tag_name` ON `tag` (`name`);--> statement-breakpoint
CREATE TABLE `user_role` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_user_role_user` ON `user_role` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_user_role_role` ON `user_role` (`role_id`);--> statement-breakpoint
CREATE TABLE `vendor` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text,
	`email` text,
	`phone` text,
	`address` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_name_unique` ON `vendor` (`name`);--> statement-breakpoint
CREATE TABLE `warranty` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`vendor_id` text,
	`warranty_until` integer,
	`terms` text,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_warranty_asset` ON `warranty` (`asset_id`);--> statement-breakpoint
CREATE INDEX `ix_warranty_vendor` ON `warranty` (`vendor_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_session`("id", "user_id", "expires_at") SELECT "id", "user_id", "expires_at" FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `ix_session_user_id` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_email` ON `user` (`email`);