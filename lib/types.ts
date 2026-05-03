// ==================
// Core Types
// ==================

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface TasteProfile {
  userId: string;
  spicy: number;    // 0-100
  sweet: number;
  savory: number;
  sour: number;
  preferredCuisines: string[];
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeStep {
  order: number;
  text: string;
  imageUrl?: string;
  timerSeconds?: number;
}

export interface Recipe {
  id: string;
  authorId: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  calories: number;       // kcal
  protein: number;        // g
  fat: number;            // g
  carbs: number;          // g
  cookTime: number;       // minutes
  difficulty: "easy" | "medium" | "hard";
  coverImage?: string;
  isAiGenerated: boolean;
  sourceIngredients?: string[];
  tags?: Tag[];
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  type: "cuisine" | "dish" | "taste" | "scene" | "diet";
  parentId?: string;
  sortOrder: number;
}

export type RestaurantStatus = "want" | "visited";

export interface Restaurant {
  id: string;
  userId: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  tags: Tag[];               // denormalized tags
  costAvg?: number;          // average cost per person (CNY)
  rating?: number;           // 1-5
  signatureDishes: string[];
  notes?: string;
  status: RestaurantStatus;
  visitedAt?: string;
  coverImage?: string;
  createdAt: string;
}

export interface RestaurantFormData {
  name: string;
  address: string;
  lng: number;
  lat: number;
  costAvg: number | null;
  rating: number | null;
  signatureDishes: string[];
  notes: string;
  status: RestaurantStatus;
  cuisineTagNames: string[];
  tasteTagNames: string[];
}

export interface RestaurantFilterPayload {
  cuisines: string[];
  tastes: string[];
  status: RestaurantStatus[];
  maxCost: number | null;
  minCost: number | null;
  minRating: number | null;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStart: string;      // YYYY-MM-DD (Monday)
  plan: WeekPlan;
  targetCalories: number;
  createdAt: string;
}

export interface DayMeals {
  breakfast?: string;     // recipe id
  lunch?: string;
  dinner?: string;
}

export interface WeekPlan {
  mon: DayMeals;
  tue: DayMeals;
  wed: DayMeals;
  thu: DayMeals;
  fri: DayMeals;
  sat: DayMeals;
  sun: DayMeals;
}

export interface CommunityPost {
  id: string;
  userId: string;
  recipeId: string;
  caption: string;
  likesCount: number;
  createdAt: string;
  // joined fields
  author?: User;
  recipe?: Recipe;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

// ==================
// API Types
// ==================

export interface GenerateRecipeRequest {
  ingredients: string[];
  preferences?: {
    cuisine?: string;
    difficulty?: "easy" | "medium" | "hard";
    maxCookTime?: number;
    dietaryRestrictions?: string[];
  };
}

export interface GenerateRecipeResponse {
  recipe: Omit<Recipe, "id" | "authorId" | "createdAt">;
}

export interface GenerateMealPlanRequest {
  targetCalories: number;
  tasteProfile?: TasteProfile;
  excludeIngredients?: string[];
  days?: number;
}

export interface FilterPayload {
  cuisines?: string[];
  tastes?: string[];
  scenes?: string[];
  diets?: string[];
  maxCalories?: number;
  maxCookTime?: number;
  difficulty?: string;
  query?: string;         // AI natural language search
}
