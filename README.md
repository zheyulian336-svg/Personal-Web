# 🏠 手绘城镇个人网站

一张斜俯视（2.5D）手绘城镇地图就是主页：点击建筑触发"镜头俯冲飞入 + 推门入内"的电影感转场，进入对应模块——个人信息（雕像）、文章（图书馆，自动同步 Blogger）、项目（实验室，自动同步 GitHub）、经历（博物馆）、知识卡片（大学）。

前后端分离：前端纯静态（HTML + CSS + 原生 JS，无框架），后端 Node.js + Express（代理 Blogger RSS / GitHub API 解决跨域并缓存，提供配置数据接口）。

## 目录结构

```
├── frontend/                 # 纯静态前端，任何静态服务器可托管
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js         # ★ 个人信息 + 建筑坐标表 + 小人路径（改这里）
│   │   ├── town.js           # 城镇渲染 / 小人行走 / 飞入转场
│   │   └── modules.js        # 五个模块内容页的渲染
│   └── assets_pack/          # 全部美术素材（地面 / 建筑 / 小人帧）
├── backend/
│   ├── server.js             # Express：4 个 API + 静态托管前端
│   └── package.json
└── config/                   # ★ 内容数据（改这些 JSON 即可更新网站）
    ├── articles.json         # Blogger 博客名 + 文章置顶/隐藏
    ├── projects.json         # GitHub 用户名 + 仓库置顶/隐藏
    ├── experience.json       # 经历时间轴
    └── cards.json            # 知识卡片
```

## 快速开始

需要 Node.js ≥ 18（用到内置 fetch）。

```bash
cd backend
npm install
npm start
```

打开 http://localhost:3000 —— 后端同时托管了前端，一条命令跑起整个网站。

前端也可以单独用任何静态服务器跑 `frontend/`（比如 `npx serve frontend`），此时把 `frontend/js/config.js` 里的 `API_BASE` 改成后端地址（如 `http://localhost:3000`）。

## 首次配置（两处占位符）

1. **Blogger**：编辑 `config/articles.json`，把 `YOUR_BLOG` 换成你的博客名
   （feed 地址形如 `https://你的博客名.blogspot.com/feeds/posts/default`）。
2. **GitHub**：编辑 `config/projects.json`，把 `YOUR_GITHUB` 换成你的 GitHub 用户名。
3. **个人信息**：编辑 `frontend/js/config.js` 里的 `PROFILE` 对象（名字、头衔、简介、头像、社交链接）。

## 日常维护（只动这些，不用碰代码逻辑）

| 想改什么 | 改哪里 |
|---|---|
| 个人信息 | `frontend/js/config.js` 的 `PROFILE` |
| 文章 | 去 Blogger 发文即自动同步；置顶/隐藏改 `config/articles.json` 的 `pinned` / `hidden`（填文章链接） |
| 项目 | 推 GitHub 即自动同步；置顶/隐藏改 `config/projects.json` 的 `pinned` / `hidden`（填仓库名） |
| 经历 | `config/experience.json`（date / title / desc / tag） |
| 知识卡片 | `config/cards.json`（front / back / category） |
| 建筑位置/大小 | `frontend/js/config.js` 的 `BUILDINGS` 表（x,y 画布坐标%，w 宽度%，px,py 图片锚点%） |
| 小人路径/速度 | `frontend/js/config.js` 的 `WALKERS` |
| 换建筑图 | 替换 `frontend/assets_pack/` 里对应 PNG（保持透明背景、内容贴边） |

改 `config/*.json` 保存即生效（经历/卡片立即生效；文章/项目缓存 10 分钟后刷新，或重启后端）。

### 建筑定位机制

每座建筑用"锚点"定位：`px,py` 指定图片上的一个点（默认 50,100 即底部中心），对齐到画布坐标 `x,y`。大学是特例（`px:97.3, py:78.9`，用右侧墙贴地角对齐），因为斜俯视菱形建筑的图片几何角可能是透明空区。图层按"越靠下越靠前"排（z-index = y×10），小人同标准，防止穿模。

## 部署（GitHub 开源 + 私人域名）

推荐路线：**整个仓库推到 GitHub 开源，部署到 Render（免费档）绑定域名**。

1. 推到 GitHub：
   ```bash
   git init && git add . && git commit -m "hand-drawn town site"
   # 在 GitHub 建仓库后：
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```
2. [Render](https://render.com) → New → Web Service → 连接该仓库：
   - Root Directory: `backend`（Render 会在此目录执行命令，代码里用相对路径访问 `../config` 和 `../frontend`，仓库整体都会被拉取，无需额外设置）
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Render 服务的 Settings → Custom Domains 里添加你的域名，按提示在你的域名 DNS 加一条 CNAME 记录即可（Render 自动配 HTTPS）。

替代方案：前端放 GitHub Pages（把 `frontend/` 设为 Pages 源，域名绑在 Pages 上），后端单独部署到 Render/Railway，再把 `config.js` 的 `API_BASE` 指向后端地址。适合想要"域名指向纯静态、后端随便放"的玩法。

> GitHub Pages 只能托管静态文件，跑不了后端——所以后端一定要有个地方跑（Render 免费档足够）。

## 视觉规范

牛皮纸米底 `#EFE7D3` · 墨线 `#2B2119` · 点缀色克制（淡赭 `#C8A671`、雾蓝 `#8FA9AD`、暗红 `#B5654A`）。内容页是手账风纸张（墨线边框 + `8px 8px 0` 硬阴影）。不要引入塑料渐变、发光、科技蓝。尊重 `prefers-reduced-motion`（小人静止、转场跳过）。
