# Vibe Cooking — Project Guide for Claude

## What This Is

一个 AI 驱动的美食生活应用。核心功能：食材拍照/输入 → AI 菜谱推荐（含热量与宏量营养素估算）、口味偏好学习、美食足迹地图、菜谱社区分享、每周 Meal Plan 自动生成。面向热爱做饭和探索美食的健身人群。

## Tech Stack

| 层         | 技术                                          |
| --------- | ------------------------------------------- |
| Framework | Next.js (App Router) + TypeScript            |
| AI        | DeepSeek API（菜谱生成、营养估算、Meal Plan 规划）  |
| Map       | 高德地图 JS API 2.0（国内直连，自带 POI 搜索）      |
| Database  | PostgreSQL（开发阶段可用 SQLite）                 |
| Auth      | 手机号验证码登录 / 微信登录                         |
| UI        | Tailwind CSS + shadcn/ui                     |
| Deploy    | 阿里云 / 腾讯云                                 |

## Project Structure

```
app/
  page.tsx                    server component, 渲染首页
  HomePage.tsx                client root: 首页状态管理、模块组合
  layout.tsx                  全局布局、字体、metadata
  api/
    recipes/route.ts          GET (筛选/搜索) + POST (创建菜谱)
    recipes/[id]/route.ts     GET (详情) + PUT (更新) + DELETE
    recipes/generate/route.ts POST → DeepSeek AI 生成菜谱 + 营养估算
    mealplan/route.ts         GET (本周计划) + POST (AI 生成新计划)
    restaurants/route.ts      GET (筛选列表) + POST (添加餐厅)
    restaurants/[id]/route.ts PUT + DELETE
    community/route.ts        GET (动态流) + POST (分享菜谱)
    community/[id]/route.ts   GET (详情) + PUT (点赞/收藏) + DELETE
    upload/route.ts           POST 图片上传
    auth/
      login/route.ts          手机号/验证码登录
      callback/route.ts       OAuth 回调（微信登录）
  explore/page.tsx            美食足迹地图页
  mealplan/page.tsx           每周食谱计划页
  community/page.tsx          社区动态页
  profile/page.tsx            个人主页（口味画像、收藏、我的菜谱）

components/
  recipe/
    RecipeCard.tsx            菜谱卡片（封面、标题、营养摘要）
    RecipeDetail.tsx          菜谱详情（步骤、食材、营养仪表盘）
    NutritionPanel.tsx        营养信息面板（热量、蛋白质、脂肪、碳水环形图）
    IngredientInput.tsx       食材输入（文本 + 拍照上传）
  map/
    MapContainer.tsx          高德地图容器，餐厅 Pin 标记
    PinMarker.tsx             自定义地图标记 + 信息弹窗
    AddRestaurantModal.tsx    添加/编辑餐厅弹窗
  mealplan/
    WeekView.tsx              周视图横向滑动组件
    DayCard.tsx               单日卡片（早中晚 + 总热量）
    GeneratePlanModal.tsx     AI 生成计划设置（目标热量、口味偏好）
  community/
    FeedCard.tsx              社区动态卡片
    ShareRecipeModal.tsx      分享菜谱弹窗
  profile/
    TasteProfile.tsx          口味偏好雷达图/进度条
    StatsCard.tsx             美食足迹统计
  sidebar/
    FilterPanel.tsx           菜系/口味/场合/热量筛选
  ui/                         shadcn/ui 组件（button, dialog, input 等）
  BottomNav.tsx               底部导航栏

lib/
  types.ts                    核心类型定义
  constants.ts                地图常量、菜系配色、营养素参考值
  ai/
    deepseek.ts               DeepSeek API 封装（菜谱生成、营养估算）
    prompts.ts                AI prompt 模板
  amap.ts                     高德地图 API 封装（POI 搜索、地理编码）
  db/
    client.ts                 数据库客户端
    migrations/               SQL 迁移文件
  auth.ts                     认证工具函数
  nutrition.ts                营养素计算工具
  utils.ts                    通用工具函数

public/
  icons/                      应用图标
  images/                     静态图片资源
```

## Key Data Model

```
users (
  id UUID PK,
  phone TEXT UNIQUE,           -- 手机号
  nickname TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)

taste_profiles (
  user_id UUID FK → users,
  spicy INT 0-100,             -- 辣度偏好
  sweet INT 0-100,
  savory INT 0-100,
  sour INT 0-100,
  preferred_cuisines TEXT[],   -- ['川菜','日料','意餐']
  updated_at TIMESTAMPTZ
)

recipes (
  id UUID PK,
  author_id UUID FK → users,
  title TEXT,
  description TEXT,
  ingredients JSONB,           -- [{name, amount, unit}]
  steps JSONB,                 -- [{order, text, image_url?, timer_seconds?}]
  calories INT,                -- kcal
  protein DECIMAL,             -- g
  fat DECIMAL,                 -- g
  carbs DECIMAL,               -- g
  cook_time INT,               -- minutes
  difficulty TEXT,             -- 'easy' | 'medium' | 'hard'
  cover_image TEXT,
  is_ai_generated BOOLEAN,
  source_ingredients TEXT[],   -- 用户输入的原始食材（AI 生成时记录）
  created_at TIMESTAMPTZ
)

recipe_tags (recipe_id UUID, tag_id UUID)  -- junction

tags (
  id UUID PK,
  name TEXT,
  type TEXT,                   -- 'cuisine' | 'dish' | 'taste' | 'scene' | 'diet'
  parent_id UUID,              -- 子标签层级
  sort_order INT
)

restaurants (
  id UUID PK,
  user_id UUID FK → users,
  name TEXT,
  address TEXT,
  longitude DECIMAL,
  latitude DECIMAL,
  cuisine_tags TEXT[],
  cost_avg INT,                -- 人均消费
  rating INT 1-5,
  signature_dishes TEXT[],
  notes TEXT,
  status TEXT,                 -- 'want' | 'visited'
  visited_at DATE,
  cover_image TEXT,
  created_at TIMESTAMPTZ
)

meal_plans (
  id UUID PK,
  user_id UUID FK → users,
  week_start DATE,             -- 周一日期
  plan JSONB,                  -- {mon: {breakfast: recipe_id, lunch: ..., dinner: ...}, tue: ...}
  target_calories INT,
  created_at TIMESTAMPTZ
)

community_posts (
  id UUID PK,
  user_id UUID FK → users,
  recipe_id UUID FK → recipes,
  caption TEXT,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ
)

likes (user_id UUID, post_id UUID)         -- junction, UNIQUE
favorites (user_id UUID, recipe_id UUID)   -- junction, UNIQUE
```

## AI Integration (DeepSeek)

核心 AI 调用场景：

1. **食材 → 菜谱生成**：用户输入食材列表 → DeepSeek 返回菜谱（含步骤、食材用量、预估营养素）
2. **营养估算**：基于食材和用量，估算热量、蛋白质、脂肪、碳水
3. **Meal Plan 生成**：根据用户口味偏好 + 目标热量 → 生成一周三餐计划
4. **智能搜索**：自然语言搜索菜谱（"低卡高蛋白的快手菜"）

AI 响应格式约定：所有 AI 接口返回结构化 JSON，在 prompt 中用 JSON Schema 约束输出格式。参见 `lib/ai/prompts.ts`。

## Map Integration (高德地图)

- 使用高德地图 JS API 2.0，需申请 Key：https://console.amap.com
- `AMap.Map` 渲染地图，`AMap.Marker` 添加餐厅标记
- `AMap.PlaceSearch` 搜索附近餐厅 POI
- `AMap.Geocoder` 地址 ↔ 坐标转换
- 地图组件需动态导入（`dynamic(..., { ssr: false })`），高德 JS SDK 是浏览器端 only

## Environment Variables

```
# 高德地图
NEXT_PUBLIC_AMAP_KEY=your-amap-js-key
AMAP_SERVER_KEY=your-amap-server-key

# DeepSeek
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/vibe_cooking

# Auth
AUTH_SECRET=random-secret-for-jwt
SMS_API_KEY=your-sms-provider-key
```

## CSS Design System

基于 Tailwind CSS，自定义 CSS 变量定义在 `app/globals.css`：

- 主色：`--vc-terracotta`（赤陶橘）、`--vc-forest`（森林绿）
- 背景：`--vc-cream`（奶油白）、`--vc-cream-deep`
- 点缀：`--vc-amber`（琥珀金）
- 文字：`--vc-brown-dark`、`--vc-brown-medium`、`--vc-brown-light`

字体：衬线展示字体（标题）+ 无衬线正文字体。参见 `app/layout.tsx` 中的字体配置。

## Dev Notes

- 在 `dev` 分支开发，不直接改 `main`。功能分支用 `feat/*`，修复用 `fix/*`。
- `npm run dev` 启动开发服务器，`npm run build` 构建。
- 高德地图组件必须 `dynamic(() => import(...), { ssr: false })` 动态导入。
- DeepSeek API 调用只在服务端（API routes），不暴露 key 到客户端。
- 图片上传暂存本地 `public/uploads/`，后续迁移至 OSS。
- 开发阶段可用 SQLite（通过 Prisma 或 Drizzle 切换），生产用 PostgreSQL。
