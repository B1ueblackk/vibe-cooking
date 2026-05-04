import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { mealPlans } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth";

interface ParsedIngredient {
  name: string;
  amount: number;
  unit: string;
}

/**
 * Parse a portion string like "鸡胸肉150g+西兰花100g+橄榄油5g"
 * into structured ingredients. Returns empty array on failure.
 */
function parsePortion(portion: string): ParsedIngredient[] {
  if (!portion) return [];
  const results: ParsedIngredient[] = [];
  // Split by + or 、 or ，
  const parts = portion.split(/[+、，,]/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Match patterns like: "鸡胸肉150g", "牛奶200ml", "鸡蛋2个", "米饭1碗"
    const match = trimmed.match(/^(.+?)(\d+(?:\.\d+)?)\s*(g|ml|kg|个|片|根|条|块|碗|勺|杯|颗|只|瓣|把|份|适量)?$/);
    if (match) {
      results.push({
        name: match[1].trim(),
        amount: parseFloat(match[2]),
        unit: match[3] || "g",
      });
    } else {
      // Fallback: treat the whole thing as a name with amount 1
      // Only if it looks like food (has Chinese chars, length > 1)
      if (/[\u4e00-\u9fa5]/.test(trimmed) && trimmed.length >= 2) {
        results.push({ name: trimmed, amount: 1, unit: "份" });
      }
    }
  }
  return results;
}

const CATEGORY_MAP: Record<string, string[]> = {
  "蔬菜": ["菜", "菠菜", "白菜", "青菜", "生菜", "芹菜", "西兰花", "花菜", "茄子", "番茄", "西红柿", "黄瓜", "胡萝卜", "萝卜", "土豆", "洋葱", "蒜", "姜", "葱", "辣椒", "豆芽", "韭菜", "莴笋", "南瓜", "冬瓜", "苦瓜", "丝瓜", "玉米", "蘑菇", "香菇", "金针菇", "木耳", "紫菜", "海带", "芦笋", "秋葵"],
  "肉类": ["鸡", "猪", "牛", "羊", "鸭", "肉", "排骨", "五花", "里脊", "腊肉", "培根", "火腿", "肘子"],
  "海鲜": ["鱼", "虾", "蟹", "贝", "鱿鱼", "三文鱼", "带鱼", "鲈鱼", "蛤蜊", "海鲜", "鲜虾", "虾仁"],
  "蛋奶": ["鸡蛋", "蛋", "牛奶", "奶", "酸奶", "奶酪", "芝士", "黄油", "奶油"],
  "主食": ["米", "面", "面条", "意面", "粉", "馒头", "饺子", "包子", "面包", "吐司", "燕麦", "红薯", "糙米", "荞麦", "粥", "饭"],
  "豆制品": ["豆腐", "豆", "豆浆", "腐竹", "豆皮", "毛豆", "黄豆", "黑豆", "红豆"],
  "调料": ["盐", "糖", "酱油", "醋", "料酒", "蚝油", "味精", "花椒", "八角", "桂皮", "生抽", "老抽", "豆瓣酱", "辣酱", "芝麻", "麻油", "橄榄油", "油", "酱", "椒", "粉", "蜂蜜"],
  "水果": ["苹果", "香蕉", "橙", "柠檬", "蓝莓", "草莓", "牛油果", "芒果", "葡萄", "猕猴桃"],
};

function categorize(name: string): string {
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => name.includes(kw))) return cat;
  }
  return "其他";
}

interface DayPlan {
  breakfast?: { title?: string; portion?: string };
  lunch?: { title?: string; portion?: string };
  dinner?: { title?: string; portion?: string };
}

export async function GET() {
  const userId = await getAuthUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [plan] = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.userId, userId))
    .orderBy(desc(mealPlans.createdAt))
    .limit(1);

  if (!plan) {
    return NextResponse.json({ items: [], weekStart: null });
  }

  // Try pre-computed shopping list first (from older AI-generated plans)
  if (plan.shoppingList && Array.isArray(plan.shoppingList) && plan.shoppingList.length > 0) {
    const items = plan.shoppingList.map((item) => ({
      ...item,
      sources: item.sources ?? [],
    }));
    items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return NextResponse.json({ items, weekStart: plan.weekStart });
  }

  // Parse from portion fields
  const merged = new Map<string, { amount: number; unit: string; sources: Set<string> }>();
  const planData = plan.plan as unknown as Record<string, DayPlan>;

  for (const day of Object.values(planData)) {
    if (!day) continue;
    for (const meal of [day.breakfast, day.lunch, day.dinner]) {
      if (!meal?.portion) continue;
      const ingredients = parsePortion(meal.portion);
      for (const ing of ingredients) {
        const key = ing.name;
        if (!key) continue;
        const existing = merged.get(key);
        if (existing && existing.unit === ing.unit) {
          existing.amount += ing.amount;
          existing.sources.add(meal.title ?? "");
        } else if (!existing) {
          merged.set(key, { amount: ing.amount, unit: ing.unit, sources: new Set([meal.title ?? ""]) });
        } else {
          // Different units — separate entry
          const altKey = `${key}(${ing.unit})`;
          const alt = merged.get(altKey);
          if (alt) {
            alt.amount += ing.amount;
            alt.sources.add(meal.title ?? "");
          } else {
            merged.set(altKey, { amount: ing.amount, unit: ing.unit, sources: new Set([meal.title ?? ""]) });
          }
        }
      }
    }
  }

  const items = Array.from(merged.entries()).map(([name, data]) => ({
    name,
    amount: Math.round(data.amount * 10) / 10,
    unit: data.unit,
    category: categorize(name),
    sources: Array.from(data.sources).filter(Boolean),
  }));

  items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  return NextResponse.json({ items, weekStart: plan.weekStart });
}
