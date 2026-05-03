import { NextResponse } from "next/server";

/** Fixed tag catalog — no DB needed, just a typed constant */

const TAG_CATALOG = {
  cuisine: [
    "川菜", "粤菜", "湘菜", "浙菜", "鲁菜", "苏菜", "闽菜", "徽菜",
    "东北菜", "西北菜", "江浙菜", "云南菜",
    "日料", "韩餐", "意餐", "法餐", "东南亚", "西餐",
    "火锅", "烧烤", "甜品", "小吃", "轻食",
  ],
  taste: ["辣", "清淡", "甜", "咸鲜", "酸", "麻", "鲜香"],
  scene: ["快手菜", "减脂餐", "增肌食谱", "家宴", "便当", "夜宵", "早餐", "下午茶"],
  diet: ["低卡", "高蛋白", "低碳水", "素食", "无麸质"],
};

export async function GET() {
  return NextResponse.json(TAG_CATALOG);
}
