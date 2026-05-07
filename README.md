# 部门协作下单系统 (Department Order System)

> 全栈 Cloudflare 边缘应用 — Workers + D1 + Durable Objects + React 19

## 部署

请参考下方的[部署指南](#部署-1)自行部署到 Cloudflare。

## 技术栈

| 层 | 技术 |
|:---|:-----|
| 后端 API | Cloudflare Workers + itty-router |
| 数据库 | Cloudflare D1 (SQLite) |
| 实时推送 | Durable Objects + WebSocket |
| 前端 | React 19 + React Router v7 + TypeScript |
| 状态管理 | Zustand + persist |
| UI 组件 | shadcn/ui + Tailwind CSS v4 |
| 图表 | Recharts |
| 认证 | Web Crypto JWT (HS256, 零依赖) |

## 项目结构

```
department-orders/
├── worker/                 # Cloudflare Worker 后端
│   ├── src/
│   │   ├── index.ts        # 路由入口 + Durable Object
│   │   ├── auth.ts         # JWT 签发/验证 (Web Crypto)
│   │   ├── middleware.ts   # withAuth + 权限/角色守卫
│   │   └── handlers/
│   │       ├── auth.ts     # 登录/改密/Token刷新
│   │       ├── aEnd.ts     # A 端: 创建/查询订单
│   │       ├── bEnd.ts     # B 端: 接收/处理订单
│   │       ├── admin.ts    # 管理: 用户/角色 CRUD
│   │       ├── stats.ts    # 统计看板 API
│   │       └── logs.ts     # 操作日志 API
│   ├── schema.sql          # D1 数据库初始化脚本
│   └── wrangler.toml       # Worker 配置
│
├── frontend/               # React 前端
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── A/          # A 端 (下单方)
│   │   │   ├── B/          # B 端 (接单方)
│   │   │   └── Admin/      # 管理后台
│   │   ├── components/     # shadcn/ui 组件
│   │   ├── hooks/          # useOrderWebSocket
│   │   ├── stores/         # Zustand store
│   │   ├── lib/            # Axios + 拦截器
│   │   └── router/         # React Router 配置
│   └── package.json
│
└── .gitignore
```

## 功能模块

### A 端 (下单工作台)
- 📝 创建订单 (选择接收人 + 日期 + 内容)
- 📋 历史订单 (分页 + 状态跟踪)
- 📊 统计看板 (7天趋势 + 接收人分布)
- 📜 操作日志 (展开查看详情)

### B 端 (接单工作台)
- 📥 待接收订单 (实时 WebSocket 推送)
- ⚡ 订单处理 (状态机: PENDING → RECEIVED → PROCESSING → COMPLETED)
- 📊 统计看板 (7天趋势 + 平均处理时长)
- 📜 操作日志

### 管理后台
- 👥 用户管理 (创建/编辑/禁用/角色分配)
- 🔐 角色管理 (细粒度权限矩阵)
- 📊 系统统计 (状态饼图 + 30天趋势 + A/B排行榜)
- 📜 全局日志 (人员/标题/日期筛选)

## 本地开发

```bash
# 后端
cd worker
npm install
echo "JWT_SECRET=your-dev-secret" > .dev.vars
npx wrangler d1 execute order-db-production --local --file=schema.sql
npx wrangler dev --local

# 前端
cd frontend
npm install
echo "VITE_API_URL=http://127.0.0.1:8787" > .env.development
npm run dev
```

## 部署

```bash
# 后端 → Cloudflare Workers
cd worker
npx wrangler d1 create order-db-production
npx wrangler d1 execute order-db-production --remote --file=schema.sql
echo "your-jwt-secret" | npx wrangler secret put JWT_SECRET
npx wrangler deploy

# 前端 → Cloudflare Pages
cd frontend
echo "VITE_API_URL=https://your-worker.workers.dev" > .env.production
npm run build
npx wrangler pages deploy dist --project-name=department-orders-web
```

## 开发方法论

本项目遵循 [Phased Development](https://github.com/XXXoooM/phased-development-skill) 方法论 + [Karpathy Coding Guidelines](https://x.com/karpathy/status/1886192184808149383) 开发。

## License

MIT
