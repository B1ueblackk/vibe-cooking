CREATE TABLE `body_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`height` integer NOT NULL,
	`weight` integer NOT NULL,
	`age` integer,
	`gender` text,
	`activity_level` text,
	`goal` text DEFAULT 'maintain' NOT NULL,
	`cheat_meals` integer DEFAULT 0 NOT NULL,
	`target_calories` integer,
	`target_protein` integer,
	`target_fat` integer,
	`target_carbs` integer,
	`ai_summary` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`recipe_id` text,
	`caption` text DEFAULT '' NOT NULL,
	`likes_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`user_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `recipe_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`friend_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`starred` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`user_id` text NOT NULL,
	`post_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `post_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meal_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`week_start` text NOT NULL,
	`plan` text NOT NULL,
	`target_calories` integer DEFAULT 2000 NOT NULL,
	`cheat_days` text DEFAULT '[]',
	`shopping_list` text DEFAULT '[]',
	`status` text DEFAULT 'done' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recipe_tags` (
	`recipe_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`recipe_id`, `tag_id`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`ingredients` text DEFAULT '[]' NOT NULL,
	`steps` text DEFAULT '[]' NOT NULL,
	`calories` integer DEFAULT 0 NOT NULL,
	`protein` real DEFAULT 0 NOT NULL,
	`fat` real DEFAULT 0 NOT NULL,
	`carbs` real DEFAULT 0 NOT NULL,
	`cook_time` integer DEFAULT 0 NOT NULL,
	`difficulty` text DEFAULT 'easy' NOT NULL,
	`cover_image` text,
	`is_ai_generated` integer DEFAULT false NOT NULL,
	`source_ingredients` text,
	`status` text DEFAULT 'done' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`message` text,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`longitude` real NOT NULL,
	`latitude` real NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`cost_avg` integer,
	`rating` integer,
	`signature_dishes` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`status` text DEFAULT 'visited' NOT NULL,
	`visited_at` text,
	`cover_image` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`parent_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `taste_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`spicy` integer DEFAULT 50 NOT NULL,
	`sweet` integer DEFAULT 50 NOT NULL,
	`savory` integer DEFAULT 50 NOT NULL,
	`sour` integer DEFAULT 50 NOT NULL,
	`preferred_cuisines` text DEFAULT '[]' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_preferred_tags` (
	`user_id` text NOT NULL,
	`tag_name` text NOT NULL,
	`tag_type` text NOT NULL,
	PRIMARY KEY(`user_id`, `tag_name`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`nickname` text NOT NULL,
	`avatar_url` text,
	`taste_dirty` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);