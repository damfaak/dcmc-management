CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deposit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` integer NOT NULL,
	`player_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transaction_logs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deposit_transactions_transaction_id_unique` ON `deposit_transactions` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `discord_settings` (
	`channel` text PRIMARY KEY NOT NULL,
	`env_key` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`category` text NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transaction_logs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `finance_transactions_transaction_id_unique` ON `finance_transactions` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` integer NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`previous_stock` integer NOT NULL,
	`current_stock` integer NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transaction_logs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_transactions_transaction_id_unique` ON `inventory_transactions` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`minimum` integer DEFAULT 0 NOT NULL,
	`unit` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "stock_nonnegative" CHECK("items"."stock" >= 0),
	CONSTRAINT "min_nonnegative" CHECK("items"."minimum" >= 0)
);
--> statement-breakpoint
CREATE TABLE `login_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_id` text NOT NULL,
	`type` text NOT NULL,
	`player_id` text,
	`item_id` text,
	`amount` integer DEFAULT 0 NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`operator` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`date` text NOT NULL,
	`proof` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`reversal_of` integer,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_logs_request_id_unique` ON `transaction_logs` (`request_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_logs_reversal_of_unique` ON `transaction_logs` (`reversal_of`);--> statement-breakpoint
CREATE INDEX `transactions_date` ON `transaction_logs` (`date`);--> statement-breakpoint
CREATE INDEX `transactions_player_date` ON `transaction_logs` (`player_id`,`date`);--> statement-breakpoint
CREATE INDEX `transactions_creator` ON `transaction_logs` (`created_by`);--> statement-breakpoint
CREATE TABLE `notification_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` integer NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`error` text,
	`created_at` text NOT NULL,
	`sent_at` text,
	`locked_until` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transaction_logs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notifications_status` ON `notification_logs` (`status`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`key` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_role_key` ON `permissions` (`role_id`,`key`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rank` text NOT NULL,
	`status` text NOT NULL,
	`join_date` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `proofs` (
	`key` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `setoran_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`month` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `targets_player_month` ON `setoran_targets` (`player_id`,`month`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role_id` text NOT NULL,
	`pin_hash` text NOT NULL,
	`salt` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
