import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";
import type { Ingredient, RecipeStep, Tag, WeekPlan } from "@/lib/types";

// ==================
// Users
// ==================

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  phone: text("phone").unique().notNull(),
  nickname: text("nickname").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ==================
// Taste Profiles
// ==================

export const tasteProfiles = sqliteTable("taste_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id),
  spicy: integer("spicy").notNull().default(50),
  sweet: integer("sweet").notNull().default(50),
  savory: integer("savory").notNull().default(50),
  sour: integer("sour").notNull().default(50),
  preferredCuisines: text("preferred_cuisines", { mode: "json" }).$type<string[]>().notNull().default([]),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ==================
// Tags
// ==================

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'cuisine' | 'dish' | 'taste' | 'scene' | 'diet'
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ==================
// Recipes
// ==================

export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  authorId: text("author_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  ingredients: text("ingredients", { mode: "json" }).$type<Ingredient[]>().notNull().default([]),
  steps: text("steps", { mode: "json" }).$type<RecipeStep[]>().notNull().default([]),
  calories: integer("calories").notNull().default(0),
  protein: real("protein").notNull().default(0),
  fat: real("fat").notNull().default(0),
  carbs: real("carbs").notNull().default(0),
  cookTime: integer("cook_time").notNull().default(0),
  difficulty: text("difficulty").notNull().default("easy"), // 'easy' | 'medium' | 'hard'
  coverImage: text("cover_image"),
  isAiGenerated: integer("is_ai_generated", { mode: "boolean" }).notNull().default(false),
  sourceIngredients: text("source_ingredients", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ==================
// Recipe ↔ Tag junction
// ==================

export const recipeTags = sqliteTable("recipe_tags", {
  recipeId: text("recipe_id").notNull().references(() => recipes.id),
  tagId: text("tag_id").notNull().references(() => tags.id),
}, (t) => [
  primaryKey({ columns: [t.recipeId, t.tagId] }),
]);

// ==================
// Restaurants
// ==================

export const restaurants = sqliteTable("restaurants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull().default(""),
  longitude: real("longitude").notNull(),
  latitude: real("latitude").notNull(),
  tags: text("tags", { mode: "json" }).$type<Tag[]>().notNull().default([]),
  costAvg: integer("cost_avg"),
  rating: integer("rating"),
  signatureDishes: text("signature_dishes", { mode: "json" }).$type<string[]>().notNull().default([]),
  notes: text("notes"),
  status: text("status").notNull().default("visited"), // 'want' | 'visited'
  visitedAt: text("visited_at"),
  coverImage: text("cover_image"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ==================
// Meal Plans
// ==================

export const mealPlans = sqliteTable("meal_plans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  weekStart: text("week_start").notNull(),
  plan: text("plan", { mode: "json" }).$type<WeekPlan>().notNull(),
  targetCalories: integer("target_calories").notNull().default(2000),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ==================
// Body Profiles
// ==================

export const bodyProfiles = sqliteTable("body_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id),
  height: integer("height").notNull(),             // cm
  weight: integer("weight").notNull(),             // kg
  goal: text("goal").notNull().default("maintain"), // 'bulk' | 'cut' | 'maintain'
  cheatMeals: integer("cheat_meals").notNull().default(0),
  targetCalories: integer("target_calories"),
  targetProtein: integer("target_protein"),         // g
  targetFat: integer("target_fat"),                 // g
  targetCarbs: integer("target_carbs"),             // g
  aiSummary: text("ai_summary"),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ==================
// Community Posts
// ==================

export const communityPosts = sqliteTable("community_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  recipeId: text("recipe_id").references(() => recipes.id),
  caption: text("caption").notNull().default(""),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ==================
// Likes (junction)
// ==================

export const likes = sqliteTable("likes", {
  userId: text("user_id").notNull().references(() => users.id),
  postId: text("post_id").notNull().references(() => communityPosts.id),
}, (t) => [
  primaryKey({ columns: [t.userId, t.postId] }),
]);

// ==================
// Favorites (junction)
// ==================

export const favorites = sqliteTable("favorites", {
  userId: text("user_id").notNull().references(() => users.id),
  recipeId: text("recipe_id").notNull().references(() => recipes.id),
}, (t) => [
  primaryKey({ columns: [t.userId, t.recipeId] }),
]);
