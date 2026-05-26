# TK运营看板 (TikTok Operations Dashboard)

TikTok Shop 电商运营数据分析仪表盘。支持 Excel 批量导入、多维度数据可视化、达人建联管理、售后退货分析。

**Aesthetic: "Dark Neon Tech"** — emerald/teal primary palette, Geist typography, glass morphism, flowing mesh background, staggered animations. Inspired by Vercel, Linear, Stripe, OpenAI design systems.

---

## Tech Stack (Exact Versions)

| Category | Package | Version |
|----------|---------|---------|
| Framework | react / react-dom | ^19.2.6 |
| Language | typescript | ~6.0.2 |
| Build | vite | ^8.0.12 |
| CSS | tailwindcss | ^4.3.0 |
| Charts | recharts | ^3.8.1 |
| State | zustand | ^5.0.13 |
| Router | react-router-dom | ^7.15.1 |
| Storage | idb (IndexedDB) | ^8.0.3 |
| Icons | lucide-react | ^1.16.0 |
| Data | xlsx | ^0.18.5 |
| Date | dayjs | ^1.11.20 |
| Export | jspdf + html2canvas | ^4.2.1 / ^1.4.1 |
| Font | Geist + Geist Mono | Google Fonts |
| Deploy | @vercel/node | ^5.8.4 |

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # production build
npm run preview    # preview production build
```

## Design System (Complete)

### Color Palette (OKLCH-derived hex)

All colors are defined as CSS custom properties in `src/index.css:4-27`.

```
Primary (Emerald):           #10b981 → #34d399 (light) → #059669 (dark)
Accent (Teal):               #14b8a6
Accent Secondary (Cyan):     #06b6d4
Warm/Alert (Amber):          #f59e0b
Danger (Red):                #ef4444
Success (Emerald):           #10b981

Background:                  #050508 (near-black, tinted cool)
Surface:                     rgba(15, 23, 30, 0.7)
Sidebar:                     rgba(5, 8, 16, 0.92)
Text Primary:                #e8edf2
Text Secondary:              #6b7d8e
Border:                      rgba(255, 255, 255, 0.06)
```

### Typography System

- **Headings/UI**: `Geist` (variable weight 300-700) — Vercel's typeface
- **Data/Mono**: `Geist Mono` (weight 400-600) — tabular numbers for metrics
- **Base size**: 17px (`html { font-size: 17px; }`)
- **Import**: `https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400..600&display=swap`

### Glass Morphism Classes

All defined in `src/index.css:110-148`.

```css
.glass             /* Base: rgba(15,23,30,0.6) + blur(16px) */
.glass-light       /* Lighter: rgba(20,30,38,0.5) + blur(10px) */
.glass-card        /* Card: rgba(10,18,24,0.55) + blur(12px), emerald glow on hover */
.glass-sidebar     /* Sidebar: rgba(5,8,16,0.88) + blur(20px) */
```

### Card Variants

```css
.card-neon         /* Subtle emerald border glow on hover */
.card-hover-lift   /* translateY(-4px) + directional emerald shadow on hover */
.scan-line         /* Subtle horizontal scan-line overlay (CRT monitor effect) */
.glow-accent       /* Top gradient bar (emerald → teal → transparent) */
```

### Gradient Text

```css
.gradient-text       /* Emerald→Teal→Cyan, 4s shift animation */
.gradient-text-warm  /* Amber→Orange→Red, 4s shift animation */
```

### Animation Keyframes (all in `src/index.css:246-328`)

| Keyframe | Duration | Purpose |
|----------|----------|---------|
| `fade-in-up` | 0.5s | Page load stagger, cards slide up |
| `fade-in` | 0.35s | Simple opacity in |
| `scale-in` | 0.3s | Modal/dialog entrance |
| `slide-in-right` | 0.35s | Slide from right edge |
| `glow-pulse` | 3s | Emerald glow breathing (cards, indicators) |
| `gradient-shift` | 4s | Background-position shift for gradient text |
| `border-glow-neon` | 3s | Neon border color cycling |
| `mesh-drift-1/2/3` | 30-35s | Background orbs slow drift + scale |
| `data-pulse` | 2s | Live data indicator blink |
| `text-shimmer` | varies | Gradient text shine sweep |
| `float` | 4s | Gentle vertical float |
| `shimmer` | 1.8s | Skeleton loading sweep |

### Utility Animation Classes

```
.animate-fade-in-up    .animate-fade-in    .animate-scale-in
.animate-slide-in-right .animate-glow-pulse .animate-float
.animate-data-pulse    .stagger-children   .skeleton-shimmer
.btn-press             .btn-glow
```

### Dark Theme Badge Pattern (CRITICAL for consistency)

NEVER use light-mode badge colors. Always use dark-theme translucency:

```
CORRECT:   bg-{color}-500/15 text-{color}-300 border-{color}-500/30
WRONG:     bg-{color}-100 text-{color}-600/700 border-{color}-200
```

For text highlights without badge backgrounds:
```
CORRECT:   text-emerald-400 / text-red-400 / text-amber-400
WRONG:     text-emerald-600 / text-red-500 / text-amber-600
```

### Recharts Theme

Chart grid lines: `rgba(255,255,255,0.04)`. Labels: `#6b7d8e`, 12px Geist. Tooltip: semi-transparent dark glass `rgba(10,18,24,0.95)` with emerald border.

### Scrollbar

Width 6px. Thumb: `rgba(16,185,129,0.15)` → hover to `0.25`. Track: transparent.

### Reduced Motion

All animations disabled via `prefers-reduced-motion: reduce` media query (0.01ms override).

---

## Project Structure (Complete)

```
tiktok-dashboard/
├── index.html                     # Geist font preconnect, root mount
├── package.json                   # Dependencies (see table above)
├── vite.config.ts                 # React + Tailwind CSS 4 + bulkImportPlugin
├── vite-plugin-bulk-import.ts     # Dev server POST /api/bulk-import
├── tsconfig.json                  # TypeScript config
├── skills-lock.json               # Agent skill dependency lock
├── .gitignore
├── .claude/skills/                # Claude Code project skills
│   └── auto-upload.md             # Bulk Excel upload skill
├── .agents/skills/                # Agent skills (symlinked)
│   ├── find-skills/
│   └── web-design-guidelines/
├── public/
│   ├── favicon.svg                # App icon
│   └── icons.svg                  # SVG sprite sheet
├── api/
│   └── tracking.ts                # Vercel Serverless Function
└── src/
    ├── main.tsx                   # Entry point, RouterProvider
    ├── index.css                  # ALL design tokens, glass, animations, utilities
    ├── App.tsx                    # Root layout + routes
    │
    ├── pages/
    │   ├── DashboardPage.tsx      # KPI cards, trend charts, funnel, heatmap, alerts
    │   ├── UploadPage.tsx         # File upload (CSV/Excel), data preview
    │   ├── DataManagePage.tsx     # Manage/delete imported data
    │   ├── AnalysisPage.tsx       # Multi-metric analysis, attribution
    │   ├── ComparePage.tsx        # Period-over-period comparison
    │   ├── RecordsPage.tsx        # Historical record export (PDF/image)
    │   ├── InfluencerPage.tsx     # Influencer CRM pipeline board
    │   └── AfterSalesPage.tsx     # Refund/return analytics
    │
    ├── components/
    │   ├── dashboard/
    │   │   ├── KpiCard.tsx        # Animated KPI card with trend icon
    │   │   ├── TrendChart.tsx     # Daily GMV/orders combo chart
    │   │   ├── CtrCvrTrend.tsx    # CTR bars + CVR line dual-axis
    │   │   ├── FunnelChart.tsx    # Conversion funnel (impressions→orders)
    │   │   ├── SourceChart.tsx    # Traffic source pie chart
    │   │   ├── WeekPattern.tsx    # Weekly pattern heatmap
    │   │   ├── SmartAlertPanel.tsx # Anomaly alerts panel
    │   │   └── DailyAnomalyPanel.tsx # Daily anomaly spike/dip list
    │   ├── influencer/
    │   │   ├── InfluencerForm.tsx   # Add/edit influencer details
    │   │   ├── InfluencerList.tsx   # Sortable/filterable influencer table
    │   │   ├── InfluencerStats.tsx  # Pipeline stage counts + shipment stats
    │   │   ├── PipelineBoard.tsx    # Kanban board by pipeline stage
    │   │   ├── TrackingInput.tsx    # Add tracking number (auto-detect carrier)
    │   │   ├── TrackingTable.tsx    # Shipment tracking table
    │   │   ├── DeliveryAlerts.tsx   # Delivered-but-unacknowledged alerts
    │   │   └── CommunicationLog.tsx # Communication history log
    │   ├── analysis/
    │   │   ├── AttributionPanel.tsx # Attribution analysis display
    │   │   └── MetricTable.tsx      # Multi-metric comparison table
    │   ├── upload/
    │   │   └── FileDropzone.tsx     # File drag-and-drop zone
    │   ├── records/
    │   │   └── PeriodCard.tsx       # Period summary card with export
    │   ├── common/
    │   │   ├── PeriodSelector.tsx   # Date range picker
    │   │   ├── AnimatedNumber.tsx   # Smooth counter animation hook
    │   │   ├── Skeleton.tsx         # Skeleton loading placeholders
    │   │   └── PageTransition.tsx   # Route transition wrapper
    │   ├── layout/
    │   │   └── Layout.tsx           # Sidebar + brand + nav + mesh background
    │   └── ui/
    │       └── ParticleBackground.tsx # Canvas particle system (optional)
    │
    ├── store/
    │   ├── dataStore.ts            # Core analytics data (Zustand + IndexedDB)
    │   ├── influencerStore.ts      # Influencer CRM state (Zustand + IndexedDB)
    │   └── uiStore.ts             # UI state (sidebar, theme, selections)
    │
    ├── services/
    │   ├── excelParser.ts          # Excel/CSV parsing orchestrator
    │   ├── excelParserCore.ts      # Core parsing logic (shared server+browser)
    │   ├── analysisEngine.ts       # Metric computation engine
    │   ├── weekAggregator.ts       # Weekly rollup aggregation
    │   ├── refundParser.ts         # Refund/return data parser
    │   ├── refundStats.ts          # Refund statistics computation
    │   ├── refundStorage.ts        # Refund IndexedDB storage
    │   ├── alertEngine.ts          # Smart alert detection rules
    │   ├── exportService.ts        # PDF/Image export service
    │   ├── storageService.ts       # Generic IndexedDB wrapper
    │   ├── influencerStorage.ts    # Influencer IndexedDB storage
    │   └── campaignCalendar.ts     # TikTok campaign calendar data
    │
    ├── types/
    │   ├── index.ts                # Core data types (DataPeriod, KPI, etc.)
    │   └── influencer.ts           # Influencer types + constants (CARRIERS, etc.)
    │
    └── utils/
        ├── formatters.ts           # formatCurrency, formatPercent, formatNumber
        └── useCountUp.ts           # Count-up animation hook
```

## Data Flow Architecture

```
CSV/Excel Import → excelParser.ts → DataPeriod[] → Zustand Store → IndexedDB
                                                            ↓
                                                  analysisEngine.ts
                                                  (computes KPIs, deltas, trends)
                                                            ↓
                                                  Recharts components
                                                  (render charts from computed data)
                                                            ↓
                                                  exportService.ts
                                                  (PDF/Image capture via html2canvas + jsPDF)
```

## API Endpoints

### POST /api/bulk-import (Dev Only)
Vite plugin in `vite-plugin-bulk-import.ts`. Accepts `{ directory: string }`, reads all `.xlsx` files server-side, returns `{ success, count, periods, errors, total }`.

### api/tracking.ts (Vercel Serverless)
Production API endpoint for tracking number lookup. Deployed as Vercel Function.

## Agent Skills

This project includes Claude Code agent skills for automation:

- **auto-upload** (`.claude/skills/auto-upload.md`): Bulk import Excel files from a folder. Triggers on "上传文件夹", "批量导入", "auto upload".
- **web-design-guidelines**: Design quality standards from Vercel.
- **find-skills**: Skill discovery helper.

Skill lock file at `skills-lock.json` tracks exact versions.

## Design Philosophy (for AI Reproduction)

This section is intentionally detailed so an AI agent can reconstruct the exact aesthetic.

### Anti-patterns Blocked
- No purple/indigo gradients (generic AI aesthetic)
- No Inter/Arial font family (generic, replace with Geist)
- No pure black (#000) or pure white (#fff) — always tint toward emerald hue
- No rounded-square icon tiles with colored backgrounds
- No gray text on colored backgrounds
- No light-mode badge patterns (`bg-*-100 text-*-600`) — always use `bg-*-500/15 text-*-300`

### Color Commitment
Emerald/teal carries 30-40% of accent surface area. Amber exclusively for warnings/alerts. Cyan sparingly for variety. Red for danger/negative trends only.

### Motion Principles
- High-impact page load stagger (stagger-children)
- Card hover: lift + directional emerald-tinted shadow
- Flowing mesh background: 3 large blurred orbs, 30-35s animation cycles
- Subtle scan-line overlay on key surfaces
- Number transitions via useCountUp hook
- No scattered micro-interactions — motion concentrated at page load

### Typography Rules
- Geist for ALL UI text (headings, labels, body)
- Geist Mono for ALL data/numbers (tabular-nums enabled)
- Root font-size: 17px (not browser default 16px)
- Chinese + English mixed text: Geist handles both

### Card Design
Every card/dashboard panel uses `glass-card` + either `card-neon` or `card-hover-lift`:
```html
<div class="glass-card rounded-xl p-5 card-hover-lift animate-fade-in-up">
  <!-- content -->
</div>
```

### Form Input Convention
```html
<input class="w-full px-3 py-2 border border-white/5 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
```

### Modal Convention
```html
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
     onClick={onClose}>
  <div class="glass-card rounded-2xl shadow-xl w-full max-w-md mx-4 animate-scale-in"
       onClick={e => e.stopPropagation()}>
    <div class="px-6 py-5 border-b border-white/5 flex items-center justify-between">
      <h3 class="text-lg font-bold text-slate-200">Title</h3>
      <button onClick={onClose} class="text-slate-400 hover:text-slate-400 text-xl">&times;</button>
    </div>
    <div class="p-6 space-y-4"><!-- body --></div>
    <div class="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
      <button onClick={onClose} class="px-4 py-2 text-sm text-slate-400 hover:bg-white/5 rounded-lg">Cancel</button>
      <button onClick={onSubmit} class="px-6 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg btn-press">Save</button>
    </div>
  </div>
</div>
```

### Sidebar Layout
```html
<div class="flex h-screen overflow-hidden bg-mesh-flow">
  <!-- Mesh orbs -->
  <div class="mesh-orb-1" style="top:10%;left:5%;"></div>
  <div class="mesh-orb-2" style="top:50%;right:10%;"></div>
  <div class="mesh-orb-3" style="bottom:10%;left:40%;"></div>
  <!-- Sidebar -->
  <aside class="glass-sidebar w-60 shrink-0 flex flex-col"></aside>
  <!-- Content -->
  <main class="flex-1 overflow-y-auto p-6 relative z-[1]"></main>
</div>
```

## Deployment (Vercel)

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

The `api/tracking.ts` file is deployed as a Vercel Serverless Function. No other backend required — all data is client-side IndexedDB.

## License

Private project.
