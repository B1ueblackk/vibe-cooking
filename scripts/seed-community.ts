/**
 * Seed script: inserts mock community data (users, recipes, community posts).
 * Run with: npx tsx scripts/seed-community.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "vibe-cooking.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

const now = new Date().toISOString();

// ── Mock users ─────────────────────────────────────────────────
const mockUsers = [
  { id: randomUUID(), phone: "13800000001", nickname: "厨房达人小陈", createdAt: now },
  { id: randomUUID(), phone: "13800000002", nickname: "健身餐爱好者", createdAt: now },
  { id: randomUUID(), phone: "13800000003", nickname: "美食探险家", createdAt: now },
  { id: randomUUID(), phone: "13800000004", nickname: "轻食主义者", createdAt: now },
  { id: randomUUID(), phone: "13800000005", nickname: "辣味狂人", createdAt: now },
];

// ── Mock recipes (matching visualMap keys in CommunityFeed) ────
const mockRecipes = [
  {
    id: randomUUID(),
    authorId: mockUsers[0].id,
    title: "番茄罗勒意面",
    description: "经典意式番茄酱意面，搭配新鲜罗勒叶，简单又美味",
    ingredients: JSON.stringify([
      { name: "意大利面", amount: 200, unit: "g" },
      { name: "番茄", amount: 3, unit: "个" },
      { name: "大蒜", amount: 3, unit: "瓣" },
      { name: "新鲜罗勒", amount: 10, unit: "片" },
      { name: "橄榄油", amount: 15, unit: "ml" },
      { name: "帕玛森芝士", amount: 20, unit: "g" },
    ]),
    steps: JSON.stringify([
      { order: 1, text: "大锅水煮沸，加盐，下意面煮至 al dente" },
      { order: 2, text: "番茄切丁，大蒜切末，橄榄油炒香蒜末" },
      { order: 3, text: "加入番茄丁，中火煮8分钟至浓稠" },
      { order: 4, text: "捞出意面拌入酱汁，撒罗勒和芝士" },
    ]),
    calories: 520,
    protein: 18.5,
    fat: 14.2,
    carbs: 78.0,
    cookTime: 25,
    difficulty: "easy",
    isAiGenerated: 1,
    createdAt: now,
  },
  {
    id: randomUUID(),
    authorId: mockUsers[1].id,
    title: "牛油果鸡肉碗",
    description: "高蛋白低脂健身餐，牛油果配嫩煎鸡胸肉",
    ingredients: JSON.stringify([
      { name: "鸡胸肉", amount: 200, unit: "g" },
      { name: "牛油果", amount: 1, unit: "个" },
      { name: "糙米饭", amount: 150, unit: "g" },
      { name: "小番茄", amount: 6, unit: "个" },
      { name: "柠檬汁", amount: 10, unit: "ml" },
    ]),
    steps: JSON.stringify([
      { order: 1, text: "鸡胸肉用盐、黑胡椒腌制15分钟" },
      { order: 2, text: "平底锅中火煎鸡胸肉，每面5分钟" },
      { order: 3, text: "牛油果切片，小番茄对半切" },
      { order: 4, text: "碗中铺糙米饭，摆上鸡肉、牛油果、番茄，淋柠檬汁" },
    ]),
    calories: 485,
    protein: 42.0,
    fat: 18.5,
    carbs: 35.0,
    cookTime: 30,
    difficulty: "easy",
    isAiGenerated: 1,
    createdAt: now,
  },
  {
    id: randomUUID(),
    authorId: mockUsers[2].id,
    title: "韩式泡菜豆腐锅",
    description: "暖胃又开胃的韩式经典，酸辣鲜香一锅搞定",
    ingredients: JSON.stringify([
      { name: "韩式泡菜", amount: 200, unit: "g" },
      { name: "嫩豆腐", amount: 300, unit: "g" },
      { name: "五花肉", amount: 100, unit: "g" },
      { name: "大葱", amount: 1, unit: "根" },
      { name: "韩式辣酱", amount: 1, unit: "勺" },
      { name: "鸡蛋", amount: 1, unit: "个" },
    ]),
    steps: JSON.stringify([
      { order: 1, text: "五花肉切薄片，煎至微焦" },
      { order: 2, text: "加泡菜翻炒出香味，加辣酱" },
      { order: 3, text: "加水煮沸，放入豆腐块，煮10分钟" },
      { order: 4, text: "打入鸡蛋，撒葱花，出锅" },
    ]),
    calories: 380,
    protein: 28.0,
    fat: 22.0,
    carbs: 18.0,
    cookTime: 25,
    difficulty: "easy",
    isAiGenerated: 0,
    createdAt: now,
  },
  {
    id: randomUUID(),
    authorId: mockUsers[3].id,
    title: "地中海风味沙拉",
    description: "清爽营养的地中海沙拉，适合减脂期的完美选择",
    ingredients: JSON.stringify([
      { name: "混合生菜", amount: 150, unit: "g" },
      { name: "樱桃番茄", amount: 100, unit: "g" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "费塔芝士", amount: 50, unit: "g" },
      { name: "黑橄榄", amount: 30, unit: "g" },
      { name: "橄榄油", amount: 10, unit: "ml" },
    ]),
    steps: JSON.stringify([
      { order: 1, text: "生菜洗净沥干，撕成小块" },
      { order: 2, text: "番茄对半切，黄瓜切片" },
      { order: 3, text: "所有蔬菜混合，加芝士碎和橄榄" },
      { order: 4, text: "淋橄榄油和少许柠檬汁，拌匀" },
    ]),
    calories: 245,
    protein: 12.0,
    fat: 16.5,
    carbs: 14.0,
    cookTime: 10,
    difficulty: "easy",
    isAiGenerated: 1,
    createdAt: now,
  },
  {
    id: randomUUID(),
    authorId: mockUsers[4].id,
    title: "酸辣粉",
    description: "正宗重庆酸辣粉，酸辣开胃，一碗就上瘾",
    ingredients: JSON.stringify([
      { name: "红薯粉条", amount: 200, unit: "g" },
      { name: "花生碎", amount: 20, unit: "g" },
      { name: "醋", amount: 15, unit: "ml" },
      { name: "辣椒油", amount: 10, unit: "ml" },
      { name: "肉末", amount: 50, unit: "g" },
      { name: "黄豆", amount: 20, unit: "g" },
    ]),
    steps: JSON.stringify([
      { order: 1, text: "粉条提前泡软，煮至透明弹牙" },
      { order: 2, text: "调底料：醋、酱油、辣椒油、花椒粉" },
      { order: 3, text: "肉末炒熟，加入黄豆" },
      { order: 4, text: "粉条捞入碗中，浇底料和肉末，撒花生碎和香菜" },
    ]),
    calories: 420,
    protein: 15.0,
    fat: 16.0,
    carbs: 55.0,
    cookTime: 20,
    difficulty: "medium",
    isAiGenerated: 0,
    createdAt: now,
  },
];

// ── Mock community posts ───────────────────────────────────────
const mockPosts = [
  {
    id: randomUUID(),
    userId: mockUsers[0].id,
    recipeId: mockRecipes[0].id,
    caption: "下班后 20 分钟搞定！罗勒的香气太治愈了 🌿",
    likesCount: 128,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: randomUUID(),
    userId: mockUsers[1].id,
    recipeId: mockRecipes[1].id,
    caption: "增肌期主力餐，42g 蛋白质直接拉满 💪",
    likesCount: 256,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: randomUUID(),
    userId: mockUsers[2].id,
    recipeId: mockRecipes[2].id,
    caption: "天冷来一锅泡菜汤，暖到心里 ❤️",
    likesCount: 89,
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    id: randomUUID(),
    userId: mockUsers[3].id,
    recipeId: mockRecipes[3].id,
    caption: "减脂期也能吃得开心！这个沙拉太好吃了",
    likesCount: 195,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: randomUUID(),
    userId: mockUsers[4].id,
    recipeId: mockRecipes[4].id,
    caption: "在家也能做出街边味道的酸辣粉！🌶️",
    likesCount: 312,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

// ── Insert ─────────────────────────────────────────────────────
const insertUser = sqlite.prepare(
  `INSERT OR IGNORE INTO users (id, phone, nickname, created_at) VALUES (?, ?, ?, ?)`
);
const insertRecipe = sqlite.prepare(
  `INSERT OR IGNORE INTO recipes (id, author_id, title, description, ingredients, steps, calories, protein, fat, carbs, cook_time, difficulty, is_ai_generated, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertPost = sqlite.prepare(
  `INSERT OR IGNORE INTO community_posts (id, user_id, recipe_id, caption, likes_count, created_at) VALUES (?, ?, ?, ?, ?, ?)`
);

const tx = sqlite.transaction(() => {
  for (const u of mockUsers) {
    insertUser.run(u.id, u.phone, u.nickname, u.createdAt);
  }
  for (const r of mockRecipes) {
    insertRecipe.run(
      r.id, r.authorId, r.title, r.description,
      r.ingredients, r.steps,
      r.calories, r.protein, r.fat, r.carbs,
      r.cookTime, r.difficulty, r.isAiGenerated, r.createdAt
    );
  }
  for (const p of mockPosts) {
    insertPost.run(p.id, p.userId, p.recipeId, p.caption, p.likesCount, p.createdAt);
  }
});

tx();
console.log(`Seeded ${mockUsers.length} users, ${mockRecipes.length} recipes, ${mockPosts.length} community posts.`);
sqlite.close();
