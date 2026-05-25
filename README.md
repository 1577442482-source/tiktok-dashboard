# TK运营看板 (TikTok Dashboard)

TikTok Shop 电商运营数据分析仪表盘。支持 CSV/Excel 导入、多维度数据可视化、达人建联管理、售后退货分析。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 6 |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 图表 | Recharts |
| 状态管理 | Zustand |
| 路由 | React Router DOM 7 |
| 本地存储 | IndexedDB (idb) |
| 数据处理 | xlsx, dayjs |
| 导出 | jsPDF + html2canvas |
| 部署 | Vercel (Node.js Serverless) |

## 快速开始

```bash
npm install
npm run dev        # 开发 → http://localhost:5173
npm run build      # 构建生产版本
npm run preview    # 预览构建结果
```

## 项目结构

```
src/
├── pages/                  # 页面
│   ├── DashboardPage.tsx   # 首页仪表盘
│   ├── UploadPage.tsx      # 数据导入
│   ├── DataManagePage.tsx  # 数据管理
│   ├── AnalysisPage.tsx    # 数据分析
│   ├── ComparePage.tsx     # 周期对比
│   ├── RecordsPage.tsx     # 历史记录
│   ├── InfluencerPage.tsx  # 达人建联
│   └── AfterSalesPage.tsx  # 售后/退货
├── components/
│   ├── dashboard/          # 仪表盘组件 (KPI卡片、趋势图、热力图、漏斗图等)
│   ├── influencer/         # 达人建联组件 (表单、追踪、Pipeline、提醒)
│   ├── analysis/           # 分析组件 (归因面板、指标表)
│   ├── upload/             # 文件上传组件
│   ├── records/            # 记录卡片组件
│   ├── common/             # 通用组件 (周期选择器)
│   └── layout/             # 布局组件
├── services/               # 业务逻辑
│   ├── excelParser.ts      # Excel/CSV 解析
│   ├── analysisEngine.ts   # 数据分析引擎
│   ├── weekAggregator.ts   # 周聚合计算
│   ├── refundParser.ts     # 退货数据解析
│   ├── refundStats.ts      # 退货统计
│   ├── refundStorage.ts    # 退货数据存储
│   ├── alertEngine.ts      # 智能预警引擎
│   ├── exportService.ts    # PDF/图片导出
│   ├── storageService.ts   # IndexedDB 存储
│   ├── influencerStorage.ts # 达人数据存储
│   └── campaignCalendar.ts # 营销日历
├── store/                  # Zustand 状态
│   ├── dataStore.ts        # 核心数据状态
│   ├── influencerStore.ts  # 达人数据状态
│   └── uiStore.ts          # UI 状态
├── types/                  # TypeScript 类型定义
└── utils/                  # 工具函数
api/
└── tracking.ts             # Vercel Serverless API (追踪端点)
```

## 核心功能

1. **数据导入** — 支持 TikTok Shop 导出的 CSV/Excel，自动解析广告、订单、退货数据
2. **仪表盘** — KPI 概览、日趋势、来源分布、CTR/CVR、周模式、漏斗图、智能预警
3. **数据分析** — 多维指标对比、归因分析、周期对比
4. **达人建联** — 达人信息管理、样品追踪、履约提醒、Pipeline 看板
5. **售后分析** — 退货原因统计、退货率趋势、售后指标
6. **数据导出** — 支持 PDF、图片导出

## 数据流

```
CSV/Excel 导入 → excelParser 解析 → Zustand Store → IndexedDB 持久化
                                              ↓
                                    analysisEngine 计算指标
                                              ↓
                                    Recharts 渲染图表 → 导出 PDF/图片
```

## 部署 (Vercel)

项目通过 Vercel 部署，`api/tracking.ts` 为 Serverless Function 处理追踪数据。

```bash
npx vercel login
npx vercel link
npx vercel --prod
```
