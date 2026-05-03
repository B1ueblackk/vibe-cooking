// ==================
// Map Constants
// ==================

/** Default map center: Shanghai */
export const DEFAULT_MAP_CENTER = {
  lng: 121.4650,
  lat: 31.2280,
};

export const DEFAULT_MAP_ZOOM = 13;

// ==================
// Cuisine System (inspired by FoodMap)
// ==================

export const CUISINE_COLORS: Record<string, string> = {
  中餐: "#D4654A",
  川菜: "#E63946",
  粤菜: "#F4A261",
  湘菜: "#C25740",
  鲁菜: "#8B6F5E",
  苏菜: "#40916C",
  浙菜: "#2D6A4F",
  闽菜: "#E9C46A",
  徽菜: "#5C3D2E",
  日料: "#4A90D9",
  韩餐: "#6b2a2a",
  意餐: "#6b3a5c",
  法餐: "#2a5c6b",
  东南亚: "#16a085",
  西餐: "#6b3a5c",
  烧烤: "#C25740",
  火锅: "#E63946",
  甜品: "#FFB4A2",
  咖啡: "#8B6F5E",
  面包: "#b8820a",
  小吃: "#d96b2c",
};

/** Light background colors per cuisine */
export const CUISINE_BG: Record<string, string> = {
  中餐: "#FFF3ED",
  川菜: "#FEE2E2",
  粤菜: "#FFF9E6",
  湘菜: "#FFF3ED",
  日料: "#EDF6FF",
  韩餐: "#fae8e0",
  意餐: "#F3EDFF",
  法餐: "#EDF6FF",
  东南亚: "#EDFFEF",
  西餐: "#F3EDFF",
  火锅: "#FEE2E2",
  烧烤: "#FFF3ED",
  甜品: "#FFF0F0",
  咖啡: "#F5EBE0",
};

/** Cuisine tag hierarchy */
export const CUISINE_HIERARCHY: Record<string, string[]> = {
  中餐: ["川菜", "粤菜", "湘菜", "鲁菜", "苏菜", "浙菜", "闽菜", "徽菜"],
};

/** Cuisine emoji mapping */
export const CUISINE_EMOJI: Record<string, string> = {
  中餐: "🍚",  川菜: "🌶️", 粤菜: "🦆", 湘菜: "🫕", 日料: "🍣",
  韩餐: "🥩",  意餐: "🍝", 法餐: "🥖", 东南亚: "🥭", 西餐: "🥩",
  烧烤: "🔥",  火锅: "♨️", 甜品: "🍰", 咖啡: "☕", 面包: "🥐",
  小吃: "🥟",  鲁菜: "🍜", 苏菜: "🥢", 浙菜: "🐟", 闽菜: "🦐",
  徽菜: "🍲",
};

// ==================
// Nutrition Constants
// ==================

/** Daily recommended intake (China Nutrition Society) */
export const DAILY_REFERENCE = {
  calories: 2000,     // kcal
  protein: 65,        // g
  fat: 55,            // g
  carbs: 300,         // g
  fiber: 25,          // g
  sodium: 2000,       // mg
} as const;

export const MACRO_COLORS = {
  calories: "#D4654A",
  protein: "#4A90D9",
  fat: "#E9C46A",
  carbs: "#40916C",
} as const;

// ==================
// Difficulty Labels
// ==================

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#40916C",
  medium: "#E9C46A",
  hard: "#D4654A",
};
