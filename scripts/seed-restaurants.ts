import { db } from "../lib/db/client";
import { restaurants } from "../lib/db/schema";

const USER_ID = "9facb744-1dd8-434b-aa28-9d83bccb813b";

const data = [
  { name: "陈麻婆豆腐", address: "成都市青羊区西玉龙街197号", lng: 104.0587, lat: 30.6636, cuisine: "川菜", cost: 65, rating: 5, dishes: ["麻婆豆腐","回锅肉","水煮鱼"], notes: "百年老店，麻婆豆腐一绝", status: "visited", visitedAt: "2026-03-15" },
  { name: "鼎泰丰", address: "上海市黄浦区南京西路1376号", lng: 121.4516, lat: 31.2278, cuisine: "中餐", cost: 120, rating: 5, dishes: ["小笼包","蟹粉小笼","红油抄手"], notes: "小笼包皮薄汁多，排队也值得", status: "visited", visitedAt: "2026-04-02" },
  { name: "松鹤楼", address: "苏州市姑苏区太监弄72号", lng: 120.6275, lat: 31.3075, cuisine: "中餐", cost: 150, rating: 4, dishes: ["松鼠桂鱼","响油鳝糊","清炒虾仁"], notes: "苏帮菜代表，松鼠桂鱼造型惊艳", status: "visited", visitedAt: "2026-02-20" },
  { name: "一兰拉面", address: "上海市静安区南京西路1601号", lng: 121.4430, lat: 31.2295, cuisine: "日料", cost: 88, rating: 4, dishes: ["天然豚骨拉面","半熟煮蛋","抹茶杏仁豆腐"], notes: "一人一格的设计很有仪式感", status: "visited", visitedAt: "2026-04-10" },
  { name: "海底捞火锅", address: "杭州市西湖区学院路28号", lng: 120.1268, lat: 30.2843, cuisine: "火锅", cost: 130, rating: 4, dishes: ["捞面表演","番茄锅底","虾滑"], notes: "服务无敌，番茄锅底yyds", status: "visited", visitedAt: "2026-03-28" },
  { name: "烤匠麻辣烤鱼", address: "成都市锦江区东大街紫东楼段11号", lng: 104.0817, lat: 30.6520, cuisine: "烧烤", cost: 85, rating: 4, dishes: ["麻辣烤鱼","烤脑花","冰粉"], notes: "烤鱼麻辣鲜香，冰粉解辣神器", status: "visited", visitedAt: "2026-03-16" },
  { name: "寿司青 OMAKASE", address: "上海市长宁区愚园路1号", lng: 121.4220, lat: 31.2198, cuisine: "日料", cost: 800, rating: 5, dishes: ["otoro寿司","海胆手卷","烤鳗鱼"], notes: "顶级Omakase，食材从筑地直送", status: "visited", visitedAt: "2026-04-20" },
  { name: "外婆家", address: "杭州市上城区延安路56号", lng: 120.1650, lat: 30.2590, cuisine: "中餐", cost: 60, rating: 3, dishes: ["茶香鸡","外婆红烧肉","西湖醋鱼"], notes: "性价比高，茶香鸡必点", status: "visited", visitedAt: "2026-02-14" },
  { name: "文和友老长沙龙虾馆", address: "长沙市天心区太平街127号", lng: 112.9772, lat: 28.1870, cuisine: "中餐", cost: 110, rating: 4, dishes: ["口味虾","臭豆腐","糖油粑粑"], notes: "排了两小时但口味虾真的绝", status: "visited", visitedAt: "2026-04-25" },
  { name: "南京大牌档", address: "南京市秦淮区中山南路1号", lng: 118.7877, lat: 32.0380, cuisine: "中餐", cost: 70, rating: 4, dishes: ["盐水鸭","鸭血粉丝汤","美龄粥"], notes: "古色古香的装修，盐水鸭正宗", status: "visited", visitedAt: "2026-01-28" },
  { name: "Pain Chaud 面包房", address: "上海市徐汇区武康路378号", lng: 121.4365, lat: 31.2048, cuisine: "面包", cost: 45, rating: 5, dishes: ["可颂","法棍","巧克力丹麦"], notes: "武康路最好吃的可颂，没有之一", status: "visited", visitedAt: "2026-04-18" },
  { name: "阿嬷手作", address: "广州市天河区体育西路101号", lng: 113.3252, lat: 23.1365, cuisine: "甜品", cost: 30, rating: 4, dishes: ["芋泥波波奶茶","芝士奶盖","杨枝甘露"], notes: "芋泥用料扎实，喝完很满足", status: "visited", visitedAt: "2026-03-05" },
  { name: "望湘园", address: "北京市朝阳区三里屯太古里北区", lng: 116.4545, lat: 39.9370, cuisine: "川菜", cost: 90, rating: 3, dishes: ["剁椒鱼头","小炒黄牛肉","酸菜鱼"], notes: "辣度适中，适合北方口味的湘菜", status: "visited", visitedAt: "2026-02-08" },
  { name: "明洞韩国料理", address: "上海市长宁区水城路68号", lng: 121.3910, lat: 31.2105, cuisine: "韩餐", cost: 95, rating: 4, dishes: ["石锅拌饭","芝士年糕","部队锅"], notes: "韩国老板开的，泡菜味道很正", status: "visited", visitedAt: "2026-04-05" },
  { name: "Seesaw Coffee", address: "上海市黄浦区淮海中路333号", lng: 121.4690, lat: 31.2218, cuisine: "咖啡", cost: 42, rating: 5, dishes: ["创意燕麦拿铁","冷萃","桂花拿铁"], notes: "国产精品咖啡天花板，桂花拿铁绝了", status: "visited", visitedAt: "2026-04-22" },
  { name: "椰客·泰国菜", address: "深圳市南山区海岸城购物中心", lng: 113.9365, lat: 22.5180, cuisine: "东南亚", cost: 100, rating: 4, dishes: ["冬阴功汤","芒果糯米饭","菠萝炒饭"], notes: "冬阴功汤酸辣正宗，仿佛在曼谷", status: "visited", visitedAt: "2026-03-22" },
  { name: "Da Marco 意大利餐厅", address: "上海市浦东新区陆家嘴环路1000号", lng: 121.5055, lat: 31.2395, cuisine: "西餐", cost: 280, rating: 4, dishes: ["松露意面","玛格丽特披萨","提拉米苏"], notes: "陆家嘴景观位，约会圣地", status: "want" },
  { name: "广州酒家", address: "广州市荔湾区文昌南路2号", lng: 113.2445, lat: 23.1190, cuisine: "粤菜", cost: 100, rating: 5, dishes: ["白切鸡","虾饺皇","红米肠"], notes: "早茶必去，虾饺皮薄到透光", status: "want" },
  { name: "巴奴毛肚火锅", address: "郑州市金水区花园路39号", lng: 113.6655, lat: 34.7710, cuisine: "火锅", cost: 140, rating: 5, dishes: ["毛肚","鲜鸭血","笨菠菜"], notes: "朋友强推的毛肚，必须去试试", status: "want" },
  { name: "新荣记", address: "上海市黄浦区马当路245号", lng: 121.4710, lat: 31.2150, cuisine: "中餐", cost: 500, rating: 5, dishes: ["台州黄鱼","家烧望潮","椒盐九肚鱼"], notes: "米其林台州菜，海鲜太新鲜了", status: "want" },
];

async function main() {
  for (const r of data) {
    await db.insert(restaurants).values({
      userId: USER_ID,
      name: r.name,
      address: r.address,
      longitude: r.lng,
      latitude: r.lat,
      tags: [{ name: r.cuisine, type: "cuisine" }] as any,
      costAvg: r.cost,
      rating: r.rating,
      signatureDishes: r.dishes,
      notes: r.notes,
      status: r.status as "visited" | "want",
      visitedAt: r.visitedAt ?? null,
    });
  }
  console.log(`Inserted ${data.length} restaurants for user ${USER_ID}`);
}

main().catch(console.error);
