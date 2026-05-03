import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "vibe-cooking.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite, { schema });

// ==================
// Clear existing data
// ==================

db.delete(schema.favorites).run();
db.delete(schema.likes).run();
db.delete(schema.communityPosts).run();
db.delete(schema.mealPlans).run();
db.delete(schema.restaurants).run();
db.delete(schema.recipeTags).run();
db.delete(schema.recipes).run();
db.delete(schema.tasteProfiles).run();
db.delete(schema.tags).run();
db.delete(schema.users).run();

// ==================
// Users
// ==================

const userId = "user-1";
db.insert(schema.users).values([
  { id: userId, phone: "13800138000", nickname: "美食家" },
  { id: "user-2", phone: "13800138001", nickname: "Lucy Chen" },
  { id: "user-3", phone: "13800138002", nickname: "Mike Wang" },
  { id: "user-4", phone: "13800138003", nickname: "Sophie Li" },
  { id: "user-5", phone: "13800138004", nickname: "Jason Zhang" },
  { id: "user-6", phone: "13800138005", nickname: "Yuki Lin" },
]).run();

db.insert(schema.tasteProfiles).values({
  userId,
  spicy: 72,
  sweet: 45,
  savory: 88,
  sour: 30,
  preferredCuisines: ["川菜", "日料", "火锅"],
}).run();

// ==================
// Tags (cuisine + taste)
// ==================

const cuisineTags = [
  { id: "tag-cuisine-chuancai", name: "川菜", type: "cuisine", sortOrder: 0 },
  { id: "tag-cuisine-yuecai", name: "粤菜", type: "cuisine", sortOrder: 1 },
  { id: "tag-cuisine-xiangcai", name: "湘菜", type: "cuisine", sortOrder: 2 },
  { id: "tag-cuisine-riliao", name: "日料", type: "cuisine", sortOrder: 3 },
  { id: "tag-cuisine-hancan", name: "韩餐", type: "cuisine", sortOrder: 4 },
  { id: "tag-cuisine-yican", name: "意餐", type: "cuisine", sortOrder: 5 },
  { id: "tag-cuisine-facan", name: "法餐", type: "cuisine", sortOrder: 6 },
  { id: "tag-cuisine-dny", name: "东南亚", type: "cuisine", sortOrder: 7 },
  { id: "tag-cuisine-xican", name: "西餐", type: "cuisine", sortOrder: 8 },
  { id: "tag-cuisine-huoguo", name: "火锅", type: "cuisine", sortOrder: 9 },
  { id: "tag-cuisine-shaokao", name: "烧烤", type: "cuisine", sortOrder: 10 },
  { id: "tag-cuisine-tianpin", name: "甜品", type: "cuisine", sortOrder: 11 },
  { id: "tag-cuisine-kafei", name: "咖啡", type: "cuisine", sortOrder: 12 },
  { id: "tag-cuisine-xiaochi", name: "小吃", type: "cuisine", sortOrder: 13 },
  { id: "tag-cuisine-zhecai", name: "浙菜", type: "cuisine", sortOrder: 14 },
  { id: "tag-cuisine-lucai", name: "鲁菜", type: "cuisine", sortOrder: 15 },
  { id: "tag-cuisine-sucai", name: "苏菜", type: "cuisine", sortOrder: 16 },
  { id: "tag-cuisine-mincai", name: "闽菜", type: "cuisine", sortOrder: 17 },
  { id: "tag-cuisine-huicai", name: "徽菜", type: "cuisine", sortOrder: 18 },
];

const tasteTags = [
  { id: "tag-taste-la", name: "辣", type: "taste", sortOrder: 0 },
  { id: "tag-taste-qingdan", name: "清淡", type: "taste", sortOrder: 1 },
  { id: "tag-taste-tian", name: "甜", type: "taste", sortOrder: 2 },
  { id: "tag-taste-xianxian", name: "咸鲜", type: "taste", sortOrder: 3 },
  { id: "tag-taste-suan", name: "酸", type: "taste", sortOrder: 4 },
  { id: "tag-taste-ma", name: "麻", type: "taste", sortOrder: 5 },
  { id: "tag-taste-xianxiang", name: "鲜香", type: "taste", sortOrder: 6 },
];

db.insert(schema.tags).values([...cuisineTags, ...tasteTags]).run();

// ==================
// Restaurants
// ==================

db.insert(schema.restaurants).values([
  {
    id: "rest-1",
    userId,
    name: "陈记小馆",
    address: "上海市静安区南京西路1266号",
    longitude: 121.4537,
    latitude: 31.2304,
    tags: [
      { id: "tag-cuisine-chuancai", name: "川菜", type: "cuisine", sortOrder: 0 },
      { id: "tag-taste-la", name: "辣", type: "taste", sortOrder: 0 },
    ],
    costAvg: 45,
    rating: 4,
    signatureDishes: ["水煮鱼", "麻婆豆腐"],
    notes: "老板是四川人，味道很正宗",
    status: "visited",
  },
  {
    id: "rest-2",
    userId,
    name: "鮨 · 小野",
    address: "上海市静安区愚园路668号",
    longitude: 121.4410,
    latitude: 31.2260,
    tags: [
      { id: "tag-cuisine-riliao", name: "日料", type: "cuisine", sortOrder: 0 },
    ],
    costAvg: 320,
    rating: 5,
    signatureDishes: ["Omakase", "海胆", "金枪鱼腹"],
    notes: "需要提前预约",
    status: "visited",
  },
  {
    id: "rest-3",
    userId,
    name: "老码头火锅",
    address: "上海市黄浦区中山南路505号",
    longitude: 121.4900,
    latitude: 31.2250,
    tags: [
      { id: "tag-cuisine-huoguo", name: "火锅", type: "cuisine", sortOrder: 0 },
      { id: "tag-taste-la", name: "辣", type: "taste", sortOrder: 0 },
      { id: "tag-taste-ma", name: "麻", type: "taste", sortOrder: 1 },
    ],
    costAvg: 120,
    rating: 4,
    signatureDishes: ["毛肚", "鸭肠", "黄喉"],
    status: "visited",
  },
  {
    id: "rest-4",
    userId,
    name: "Paris Baguette",
    address: "上海市徐汇区淮海中路999号",
    longitude: 121.4600,
    latitude: 31.2180,
    tags: [
      { id: "tag-cuisine-tianpin", name: "甜品", type: "cuisine", sortOrder: 0 },
      { id: "tag-taste-tian", name: "甜", type: "taste", sortOrder: 0 },
    ],
    costAvg: 55,
    rating: 3,
    signatureDishes: ["可颂", "提拉米苏"],
    status: "visited",
  },
  {
    id: "rest-5",
    userId,
    name: "绿茶餐厅",
    address: "上海市长宁区中山公园附近",
    longitude: 121.4180,
    latitude: 31.2220,
    tags: [
      { id: "tag-cuisine-zhecai", name: "浙菜", type: "cuisine", sortOrder: 0 },
      { id: "tag-taste-qingdan", name: "清淡", type: "taste", sortOrder: 0 },
    ],
    costAvg: 85,
    rating: 4,
    signatureDishes: ["绿茶饼", "龙井虾仁"],
    status: "want",
  },
  {
    id: "rest-6",
    userId,
    name: "鼎泰丰",
    address: "上海市黄浦区南京东路800号",
    longitude: 121.4750,
    latitude: 31.2350,
    tags: [
      { id: "tag-cuisine-xiaochi", name: "小吃", type: "cuisine", sortOrder: 0 },
    ],
    costAvg: 150,
    rating: 5,
    signatureDishes: ["小笼包", "蟹粉小笼", "红油抄手"],
    notes: "排队要很久",
    status: "want",
  },
]).run();

// ==================
// Recipes
// ==================

db.insert(schema.recipes).values([
  {
    id: "recipe-1",
    authorId: "user-2",
    title: "番茄罗勒意面",
    description: "经典意式风味，新鲜番茄和罗勒的完美结合",
    ingredients: [
      { name: "意面", amount: 200, unit: "g" },
      { name: "番茄", amount: 3, unit: "个" },
      { name: "罗勒", amount: 10, unit: "片" },
      { name: "大蒜", amount: 3, unit: "瓣" },
      { name: "橄榄油", amount: 30, unit: "ml" },
      { name: "帕玛森芝士", amount: 20, unit: "g" },
    ],
    steps: [
      { order: 1, text: "番茄划十字，沸水烫去皮，切碎备用", timerSeconds: 120 },
      { order: 2, text: "意面放入加盐的沸水中煮至al dente", timerSeconds: 480 },
      { order: 3, text: "锅中加橄榄油，小火爆香大蒜片" },
      { order: 4, text: "加入番茄碎，中火煮5分钟成酱汁", timerSeconds: 300 },
      { order: 5, text: "拌入煮好的意面，撒上罗勒叶和芝士" },
    ],
    calories: 420,
    protein: 18,
    fat: 14,
    carbs: 52,
    cookTime: 25,
    difficulty: "easy",
    isAiGenerated: false,
  },
  {
    id: "recipe-2",
    authorId: "user-3",
    title: "牛油果鸡肉碗",
    description: "高蛋白低碳水，健身党的完美选择",
    ingredients: [
      { name: "鸡胸肉", amount: 200, unit: "g" },
      { name: "牛油果", amount: 1, unit: "个" },
      { name: "糙米饭", amount: 100, unit: "g" },
      { name: "小番茄", amount: 6, unit: "颗" },
      { name: "柠檬汁", amount: 15, unit: "ml" },
    ],
    steps: [
      { order: 1, text: "鸡胸肉用盐和黑胡椒腌制10分钟", timerSeconds: 600 },
      { order: 2, text: "平底锅煎鸡胸肉至两面金黄，切片", timerSeconds: 360 },
      { order: 3, text: "牛油果切片，小番茄对半切" },
      { order: 4, text: "碗中铺糙米饭，摆上鸡肉、牛油果、番茄，淋柠檬汁" },
    ],
    calories: 310,
    protein: 32,
    fat: 12,
    carbs: 24,
    cookTime: 10,
    difficulty: "easy",
    isAiGenerated: false,
  },
  {
    id: "recipe-3",
    authorId: "user-4",
    title: "韩式泡菜豆腐锅",
    description: "天冷来一锅，酸辣开胃暖身",
    ingredients: [
      { name: "韩式泡菜", amount: 200, unit: "g" },
      { name: "嫩豆腐", amount: 1, unit: "盒" },
      { name: "五花肉", amount: 100, unit: "g" },
      { name: "洋葱", amount: 0.5, unit: "个" },
      { name: "韩式辣酱", amount: 30, unit: "g" },
      { name: "鸡蛋", amount: 1, unit: "个" },
    ],
    steps: [
      { order: 1, text: "五花肉切片，煸出油脂" },
      { order: 2, text: "加入洋葱丝和泡菜翻炒出香味", timerSeconds: 180 },
      { order: 3, text: "加水和韩式辣酱煮沸", timerSeconds: 300 },
      { order: 4, text: "放入豆腐块，小火煮10分钟", timerSeconds: 600 },
      { order: 5, text: "最后打入鸡蛋，盖盖焖1分钟", timerSeconds: 60 },
    ],
    calories: 580,
    protein: 28,
    fat: 22,
    carbs: 45,
    cookTime: 35,
    difficulty: "medium",
    isAiGenerated: false,
  },
  {
    id: "recipe-4",
    authorId: "user-5",
    title: "地中海风味沙拉",
    description: "清爽减脂餐，橄榄油柠檬汁酱汁是灵魂",
    ingredients: [
      { name: "烤鸡胸肉", amount: 150, unit: "g" },
      { name: "混合生菜", amount: 100, unit: "g" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "橄榄", amount: 30, unit: "g" },
      { name: "羊奶芝士", amount: 30, unit: "g" },
      { name: "橄榄油", amount: 20, unit: "ml" },
      { name: "柠檬", amount: 0.5, unit: "个" },
    ],
    steps: [
      { order: 1, text: "鸡胸肉提前烤好，切厚片" },
      { order: 2, text: "蔬菜洗净切块，橄榄对半切" },
      { order: 3, text: "调酱汁：橄榄油+柠檬汁+盐+黑胡椒" },
      { order: 4, text: "所有食材放大碗中，淋上酱汁拌匀，撒芝士碎" },
    ],
    calories: 280,
    protein: 35,
    fat: 10,
    carbs: 18,
    cookTime: 15,
    difficulty: "easy",
    isAiGenerated: false,
  },
  {
    id: "recipe-5",
    authorId: "user-6",
    title: "酸辣粉",
    description: "自制底料比外面好吃十倍，花生碎是灵魂",
    ingredients: [
      { name: "红薯粉", amount: 200, unit: "g" },
      { name: "花生", amount: 30, unit: "g" },
      { name: "黄豆", amount: 20, unit: "g" },
      { name: "香菜", amount: 10, unit: "g" },
      { name: "醋", amount: 30, unit: "ml" },
      { name: "辣椒油", amount: 20, unit: "ml" },
    ],
    steps: [
      { order: 1, text: "红薯粉提前用温水泡软", timerSeconds: 1800 },
      { order: 2, text: "花生炒香，稍微碾碎备用" },
      { order: 3, text: "调底料：醋+酱油+辣椒油+花椒粉+蒜泥" },
      { order: 4, text: "粉条煮3分钟至透明Q弹", timerSeconds: 180 },
      { order: 5, text: "碗中放底料，加粉条和汤，撒花生碎和香菜" },
    ],
    calories: 450,
    protein: 15,
    fat: 18,
    carbs: 60,
    cookTime: 20,
    difficulty: "medium",
    isAiGenerated: false,
  },
]).run();

// ==================
// Community Posts
// ==================

const now = Date.now();
db.insert(schema.communityPosts).values([
  {
    id: "post-1",
    userId: "user-2",
    recipeId: "recipe-1",
    caption: "周末在家做的，番茄一定要用新鲜的才好吃！罗勒是阳台自己种的～",
    likesCount: 238,
    createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "post-2",
    userId: "user-3",
    recipeId: "recipe-2",
    caption: "健身党的最爱！高蛋白低碳水，做起来也超级简单，10分钟搞定",
    likesCount: 512,
    createdAt: new Date(now - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: "post-3",
    userId: "user-4",
    recipeId: "recipe-3",
    caption: "天冷来一锅暖暖的，用了自己腌的泡菜，酸辣开胃特别下饭",
    likesCount: 189,
    createdAt: new Date(now - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "post-4",
    userId: "user-5",
    recipeId: "recipe-4",
    caption: "橄榄油+柠檬汁做的酱汁绝了，配上烤鸡胸肉就是完美的减脂餐",
    likesCount: 345,
    createdAt: new Date(now - 28 * 3600 * 1000).toISOString(),
  },
  {
    id: "post-5",
    userId: "user-6",
    recipeId: "recipe-5",
    caption: "自己调的底料比外面卖的好吃10倍！秘诀是花生碎一定要现炒的",
    likesCount: 421,
    createdAt: new Date(now - 48 * 3600 * 1000).toISOString(),
  },
]).run();

// ==================
// Initial likes & favorites for user-1
// ==================

db.insert(schema.likes).values([
  { userId, postId: "post-2" },
  { userId, postId: "post-5" },
]).run();

db.insert(schema.favorites).values([
  { userId, recipeId: "recipe-2" },
  { userId, recipeId: "recipe-3" },
  { userId, recipeId: "recipe-5" },
]).run();

// ==================

console.log("✓ Seed complete:");
console.log("  - 6 users");
console.log(`  - ${cuisineTags.length + tasteTags.length} tags`);
console.log("  - 6 restaurants");
console.log("  - 5 recipes");
console.log("  - 5 community posts");
console.log("  - 2 likes + 3 favorites for user-1");

sqlite.close();
