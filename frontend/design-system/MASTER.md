# 小蛋糕店后厨屏 · 设计系统（MASTER）

适用范围：后厨屏（kitchen）入口。admin 入口可参考色彩/字体，但布局按 PC 后台另行设计。

## 一、设计前提（不可妥协的物理约束）

| 约束 | 含义 |
|---|---|
| 墙上 10-15 寸平板横屏 | 主用例分辨率 1280×800 ~ 2160×1440，常亮 |
| 后厨嘈杂 | 听不清细节，提示音只用 1-2 秒短促「叮」、屏幕高亮 30 秒兜底 |
| 油污、水溅、单手操作 | 触控目标必须 ≥48×48px、间距 ≥8px、按钮带状态色块而非仅靠图标 |
| 远距离观看（50-100cm） | 正文 ≥18px、订单号/时间 ≥24px、列头 ≥20px |
| 颠勺间隙扫一眼 | 关键信息（订单号、取货时间、商品、备注）必须前 1/3 区域可见 |

## 二、色彩系统

### 2.1 品牌主色（温暖烘焙感）

```css
--brand-50:  #FFF7ED;  /* 最浅，背景色调 */
--brand-100: #FFEDD5;
--brand-300: #FDBA74;
--brand-500: #F97316;  /* 主色：活力橙 */
--brand-600: #EA580C;  /* 主色按压 */
--brand-700: #C2410C;  /* 主色深沉，标题 */
--brand-900: #7C2D12;  /* 主色最深，文字 hover */
```

### 2.2 状态色（五列编码 + 警示）

五列严格对应详细设计 §2.1 订单状态机。颜色选择遵循「暖→冷」渐次，暗示「待开始 → 已发出」的时间感。**每列同时使用色块 + 文字标签，不只靠颜色**（色盲安全）。

```css
/* 五状态：列头色块 + 卡片头色条 + 主按钮填色 */
--status-pending:            #F59E0B;  /* 待制作：琥珀黄 — 提醒注意、未开始 */
--status-pending-bg:         #FEF3C7;
--status-pending-fg:         #78350F;

--status-cooking:            #EA580C;  /* 制作中：橙红 — 火热、进行中 */
--status-cooking-bg:         #FFEDD5;
--status-cooking-fg:         #7C2D12;

--status-ready-pickup:       #16A34A;  /* 待取：草绿 — 就绪、可交付 */
--status-ready-pickup-bg:    #DCFCE7;
--status-ready-pickup-fg:    #14532D;

--status-ready-delivery:     #0891B2;  /* 待配送：青 — 待流转 */
--status-ready-delivery-bg:  #CFFAFE;
--status-ready-delivery-fg:  #164E63;

--status-delivering:         #2563EB;  /* 配送中：蓝 — 途中 */
--status-delivering-bg:      #DBEAFE;
--status-delivering-fg:      #1E3A8A;
```

### 2.3 功能色

```css
--bg-page:        #FFFBEB;  /* 页面背景：温暖米白（烘焙工坊感）*/
--bg-card:        #FFFFFF;  /* 卡片背景 */
--bg-elevated:    #FFFFFF;  /* 弹窗、悬浮元素 */
--bg-muted:       #FEF3C7;  /* 次级区块 */

--fg-primary:     #1C1917;  /* 主文字：近黑暖色（notmonid #000）*/
--fg-secondary:   #57534E;  /* 次文字 */
--fg-disabled:    #A8A29E;

--border:         #E7E5E4;
--border-strong:  #D6D3D1;

--danger:         #DC2626;  /* 警示：过敏、断网、报损 */
--danger-bg:      #FEE2E2;
--danger-fg:      #7F1D1D;

--success:        #16A34A;  /* 操作成功 toast */
--warning:        #F59E0B;  /* 中性警告 */
--info:           #2563EB;
```

### 2.4 对比度（必须 WCAG AA）

- 正文 `--fg-primary #1C1917` on `--bg-card #FFFFFF` = 16.5:1 ✓ AAA
- 次文字 `--fg-secondary #57534E` on `--bg-card` = 8.0:1 ✓ AAA
- 状态色文字 on 状态色 bg：均 ≥7:1（见上 2.2 各 fg/bg 对）

## 三、字体系统

### 3.1 字族

```css
--font-sans: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Consolas, monospace;
```

- 中文：Noto Sans SC（Google Fonts，开源、字形完整）
- 数字/订单号/时间：等宽字体 + `font-variant-numeric: tabular-nums`，防止跳动

### 3.2 字号阶梯（后厨屏特调，比常规 web 大一档）

| Token | px | 用途 |
|---|---|---|
| `--text-xs` | 14 | 标签、辅助 |
| `--text-sm` | 16 | 次要正文（最低Readable）|
| `--text-base` | 18 | 卡片正文（远距离可读基线）|
| `--text-lg` | 20 | 列头 |
| `--text-xl` | 24 | 订单号、取货时间 |
| `--text-2xl` | 32 | 弹窗标题 |
| `--text-3xl` | 48 | 看板空状态、登录页标题 |

行高：正文 1.5、标题 1.25。

字重：regular 400 / medium 500 / semibold 600 / bold 700。标题用 600-700，按钮用 500。

## 四、间距 / 圆角 / 阴影

### 4.1 间距（8dp 系统）

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
```

### 4.2 圆角

```css
--radius-sm: 8px;   /* 按钮、输入框 */
--radius-md: 12px;  /* 小卡片、tag */
--radius-lg: 16px;  /* 订单卡片、弹窗 */
--radius-xl: 24px;  /* 大型容器 */
--radius-pill: 9999px;
```

### 4.3 阴影（柔和多层，强调触感）

```css
/* 卡片默认 */
--shadow-card: 0 1px 2px rgba(124,45,18,0.04), 0 2px 8px rgba(124,45,18,0.06);
/* 新订单高亮脉冲 */
--shadow-glow-pending: 0 0 0 4px rgba(245,158,11,0.35), 0 0 24px rgba(245,158,11,0.45);
/* 弹窗 */
--shadow-modal: 0 24px 48px -12px rgba(124,45,18,0.25), 0 8px 16px -4px rgba(124,45,18,0.1);
/* 状态条嵌入 */
--shadow-status-bar: inset 0 -2px 0 rgba(0,0,0,0.04);
```

## 五、动效

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);       /* 进入 */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);   /* 状态切换 */
--dur-fast: 150ms;       /* hover、press */
--dur-base: 250ms;       /* 卡片横滑、状态切换 */
--dur-slow: 400ms;       /* 弹窗进入 */
```

### 关键动画

**新单脉冲**（30 秒，每 1.6s 一次脉冲，过时不亮）：
```css
@keyframes pulse-new-order {
  0%, 100% { box-shadow: var(--shadow-card); transform: scale(1); }
  50%      { box-shadow: var(--shadow-glow-pending); transform: scale(1.015); }
}
```

**卡片横滑入下一列**（≤300ms）：
```css
transition: transform var(--dur-base) var(--ease-in-out), opacity var(--dur-base);
```

**所有动画都包 `@media (prefers-reduced-motion: reduce)` 兜底。**

## 六、布局

### 6.1 看板五列

- 容器 `display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-3);`
- 平板横屏 ≥1280px：完整五列
- 窄屏 <1280px：横向滚动 `overflow-x: auto`，列宽固定 `minmax(280px, 1fr)`
- 列高 `height: calc(100dvh - header-height)`，每列内独立滚动

### 6.2 卡片

- 最小宽度 260px、内边距 16px
- 头部状态色条 6px 高（全宽）
- 内部纵向：订单号+时间 → 商品+数量 → 取货方式/地址 → 备注高亮（如有）→ 主操作按钮（占满底部，高 56px）

### 6.3 触控目标

| 元素 | 最小尺寸 |
|---|---|
| 主操作按钮（卡片底部）| 全宽 × 56px |
| 次按钮（弹窗）| 120px × 48px |
| 图标按钮（顶部）| 48×48px |
| PIN 输入框 | 64×72px |
| 列内卡片间距 | 12px |

## 七、关键组件规范

### 7.1 订单卡片

```
┌─────────────────────────────────────┐  ← 6px 状态色条（全宽）
│ 0629-005         18:00 ⚠           │  ← 订单号 + 取货时间（橙色高亮 if 紧急）
├─────────────────────────────────────┤
│ 草莓蛋糕(8寸) × 1                   │  ← 商品 + 数量（大字号，点商品名开配方）
│ 自取                                │  ← 取货方式 / "配送 → 槐树街 12 号"
│                                     │
│ ┌─────────────────────────────────┐ │  ← 备注高亮（仅含过敏等关键词时出现）
│ │ ⚠ 不要坚果（过敏）              │ │     红底白字、图标前置
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       开始制作                   │ │  ← 主按钮（触控 ≥56px，状态色填）
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 7.2 备注关键词（`shared/constants/noteKeywords.ts`）

详细设计 §4.1.10 + §4.2.2 共享列表。**不入库**（`customer_note` 无 priority 字段），纯前端按 content 派生。

```ts
export const ALLERGY_KEYWORDS = ['过敏', '忌口', '不能吃', '不吃', '不要放'];
export const URGENT_KEYWORDS = ['加急', '急', ' ASAP'];
```

### 7.3 断网降级横幅

固定顶部、红色背景、白字、含「WebSocket 已断开，正在重连…第 N 次」+ 操作建议「请人工留意微信群接单消息」。

### 7.4 PIN 输入（登录页）

- 6 格分离输入框，每格 64×72px、字号 32px
- 自动 focus 第一格、输完自动跳下一格、输满自动提交
- 删除键回跳、粘贴自动分发
- 错误时整组震动动画 + 红色边框

## 八、Element Plus 主题定制要点

通过 SCSS 变量覆盖（vite.config.ts 中 `css.preprocessorOptions` 注入）：

```scss
$colors: (
  'primary': ('base': #EA580C),
  'success': ('base': #16A34A),
  'warning': ('base': #F59E0B),
  'danger':  ('base': #DC2626),
);
$border-radius: ('base': 12px, 'small': 8px);
$button-font-weight: 500;
$font-size-base: 18px;
$font-family: 'Noto Sans SC', system-ui, sans-serif;
```

EP 的 `el-button`、`el-dialog`、`el-input` 等会自动跟随；自定义组件直接用 `var(--brand-600)` 等 token。

## 九、可访问性兜底

- 所有图标按钮配 `aria-label`
- 状态切换按钮的可用性由 `disabled` 表达，同时 `aria-disabled="true"` + tooltip 说明原因（参照详细设计 §2.4 矩阵）
- 焦点环可见：`outline: 3px solid var(--brand-500); outline-offset: 2px;`
- `prefers-reduced-motion: reduce` 时所有动画降为瞬切
- 实色对比度全部 ≥4.5:1

## 十、避免的陷阱（参考 ui-ux-pro-max 反模式）

- 不要用 emoji 做功能性图标（用 SVG，lucide-vue-next）
- 不要靠颜色单独表达状态（每列同时色块 + 文字标签「待制作」「制作中」）
- 不要用 `<div onclick>`（用 `<button>` 语义）
- 不要 0ms 状态切换（最低 150ms）
- 不要 hover-only 交互（平板无 hover）
- 不要用 `width/height/top/left` 做动画（用 `transform`/`opacity`）
