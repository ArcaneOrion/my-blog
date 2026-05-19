# 博客设计方案 —— Arcane Orion's Blog

## 1. 设计哲学

**核心原则**：数学结构即视觉语言。不是"贴数学符号"，而是将数学概念（图论、粒子系统、向量场）转化为装饰性动画。

**隐喻层**：
- 首页粒子网络 = 图论/神经网络的抽象
- 分形几何 = 数学递归结构的美
- 暗色背景 + 荧光几何线 = 深夜思考的沉浸感

## 2. 技术栈

| 组件 | 版本 | 职责 |
|------|------|------|
| Astro | 5.x | 静态站点生成器，将 Markdown 转为 HTML |
| p5.js | 1.x | 2D 几何动画/粒子系统（装饰层） |
| Tailwind CSS | 3.x | 原子化样式，暗色学术风 |
| Markdown | - | 文章源格式 |
| GitHub Actions | - | CI/CD，push 即部署 |
| GitHub Pages | - | 免费静态托管 |

## 3. 视觉系统

### 3.1 配色

```
--bg-primary: #0a0a0f       (深邃暗色，接近纯黑但带微蓝)
--bg-secondary: #12121a      (卡片/区块背景)
--text-primary: #e8e8ef      (主文本，微暖白)
--text-secondary: #8a8a9a    (副文本)
--accent-math: #60a5fa       (数学主题荧光蓝)
--accent-ai: #a78bfa         (AI 主题紫罗兰)
--accent-quant: #34d399      (量化主题翡翠绿)
--border: #1e1e2e            (边框/分割线)
```

### 3.2 字体

- **标题**：JetBrains Mono 或 Geist Mono（等宽字体，代码/数学感）
- **正文**：Inter 或 Geist Sans（无衬线，屏幕可读性）
- **数学公式**：KaTeX（行内公式渲染）

### 3.3 布局

- 首页：全屏 p5.js 动画背景 + 中央标题 + 导航
- 文章列表：左侧目录/标签，右侧卡片流
- 文章页：宽屏阅读，侧边有文章元信息
- 移动端：单列，动画降级为静态几何图

## 4. 页面结构

```
/
├── 首页 (index.astro)
│   └── 全屏粒子网络动画 (p5.js)
│   └── 博客标题 + 简介
│   └── 最新文章 3 篇
│   └── 导航到分类
│
├── 文章列表 (/blog)
│   └── 标签筛选 (AI / Math / Quant / Neuro)
│   └── 卡片流
│
├── 文章页 (/blog/[slug])
│   └── 文章内容 (Markdown)
│   └── AI 生成标注 (条件显示)
│   └── 相关文章推荐
│
└── 关于 (/about)
    └── 个人简介
    └── 技术栈
    └── 联系
```

## 5. 数学装饰动画设计

### 5.1 首页：动态图网络 (Graph Network)

**概念**：平面上随机分布 N 个点（节点），距离小于阈值 R 的点对之间连线（边）。

**数学参数**：
- N = 80 (桌面) / 40 (移动端)
- R = 150px
- 节点有微小布朗运动速度
- 鼠标附近节点被轻微排斥（交互）
- 边的透明度随距离衰减：alpha = 1 - dist/R

**视觉**：
- 节点：小圆点，颜色按主题交替（蓝/紫/绿）
- 边：细线，颜色混合两端节点色
- 背景：纯黑
- 效果：像神经网络/知识图谱的抽象

### 5.2 文章页头：分形布朗运动背景

**概念**：基于噪声函数生成的缓慢变化纹理。

**参数**：
- 多层 Perlin 噪声叠加
- 色调映射到主题色
- 极低动画速度（几乎静止，仅微动）
- 半透明覆盖在背景上

### 5.3 文章卡片：几何指纹

**概念**：每篇文章根据标题生成唯一的几何图案（类似 identicon）。

**算法**：
- 标题 → SHA256 哈希
- 哈希值 → 控制点坐标
- 控制点 → 贝塞尔曲线/多边形
- 颜色：从主题色映射

## 6. AI 生成标注机制

**实现**：文章 frontmatter 控制

```markdown
---
title: "xxx"
date: 2026-05-18
tags: ["AI", "Math"]
ai_assisted: true
---
```

当 `ai_assisted: true` 时：
- 文章页顶部显示 subtle 标注："🤖 本文部分内容经 AI 辅助生成"
- 不显眼，但明确

## 7. 内容分类

| 分类 | 颜色 | 图标 | 说明 |
|------|------|------|------|
| AI | #a78bfa | 🤖 | Agent 系统、AI 安全、工程 |
| Math | #60a5fa | ∞ | 数学学习、证明、结构 |
| Quant | #34d399 | 📈 | 量化交易、金融模型 |
| Neuro | #f472b6 | 🧠 | 神经科学（预留） |

## 8. 构建与部署

### 8.1 开发工作流

```bash
# 启动开发服务器
npm run dev

# 构建静态站点
npm run build

# 预览构建结果
npm run preview
```

### 8.2 部署工作流 (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 8.3 NixOS 环境

- `flake.nix` 定义 Node.js 22 + pnpm + git 环境
- `.envrc` 通过 direnv 自动加载
- 不全局安装，通过 nix develop 进入隔离环境

## 9. 文件结构

```
my-blog/
├── flake.nix              # Nix 环境定义
├── .envrc                 # direnv 入口
├── package.json           # Node 依赖
├── astro.config.mjs       # Astro 配置
├── tailwind.config.js     # Tailwind 配置
├── public/                # 静态资源
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── BlogLayout.astro
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── GraphNetwork.jsx   # p5.js 首页动画
│   │   ├── ArticleCard.astro
│   │   ├── TagBadge.astro
│   │   └── AIAssisted.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── about.astro
│   ├── content/
│   │   └── blog/
│   │       ├── ai-introduction.md
│   │       ├── math-limit-epsilon-delta.md
│   │       └── quant-momentum-strategy.md
│   └── styles/
│       └── global.css
└── .github/
    └── workflows/
        └── deploy.yml
```

## 10. 最小可运行版本 (MVP)

### Phase 1：骨架
- [ ] 环境配置 (flake.nix + .envrc)
- [ ] Astro 基础结构 + 路由
- [ ] Tailwind 暗色主题
- [ ] 首页布局（无动画）

### Phase 2：数学装饰
- [ ] p5.js 图网络动画（首页背景）
- [ ] 响应式适配（移动端降级）

### Phase 3：内容系统
- [ ] Markdown 文章渲染
- [ ] 标签系统
- [ ] AI 生成标注

### Phase 4：部署
- [ ] GitHub Actions 自动部署
- [ ] 自定义域名（可选）

## 11. 设计决策记录

**为什么用 p5.js 不用 Three.js？**
- 2D 几何足以表达"数学的美"，Three.js 的 3D 是过度工程
- p5.js 构建产物更小，首屏加载更快
- 你的需求是"装饰性"而非"交互性 3D"

**为什么 Astro 不用 Next.js？**
- 纯内容站，不需要 SSR
- Astro 的构建产物更轻（零 JS 默认，只有用到的组件才有 JS）
- 对 Markdown 的支持是原生级别的

**为什么暗色主题？**
- 数学深夜思考的氛围
- 荧光几何线在暗色上对比度最高
- 符合"arcane"（神秘、编码）的语义场
