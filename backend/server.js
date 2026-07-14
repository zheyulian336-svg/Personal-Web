/**
 * 手绘城镇个人网站 — 后端
 *
 * 职责：
 *   1. 代理 Blogger RSS（解决浏览器跨域），带缓存
 *   2. 代理 GitHub API（避免前端直连触发速率限制），带缓存
 *   3. 提供经历 / 知识卡片的配置数据接口（读 config/*.json，改文件即生效）
 *   4. 顺便托管 frontend/ 静态文件 —— 整个项目一条命令跑起来
 *
 * 日常维护只需要改 ../config/ 里的 JSON 文件，不用碰这里的代码。
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const CACHE_TTL = 10 * 60 * 1000; // 外部数据源缓存 10 分钟

app.use(cors()); // 放行跨域，前端单独部署（如 GitHub Pages）时也能调通

// ---------- 工具 ----------

function readConfig(name) {
  const raw = fs.readFileSync(path.join(CONFIG_DIR, name), 'utf8');
  return JSON.parse(raw);
}

// 极简内存缓存：cache.get(key) 十分钟内直接复用，避免频繁请求外部 API
const cache = new Map();
async function cached(key, fetcher) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  const data = await fetcher();
  cache.set(key, { ts: Date.now(), data });
  return data;
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/** 置顶/隐藏规则：去掉 hidden → pinned 按数组顺序排最前 → 其余按 date 倒序 */
function applyPinHide(items, pinned, hidden, keyOf) {
  const visible = items.filter((it) => !hidden.includes(keyOf(it)));
  const pinnedItems = pinned
    .map((key) => visible.find((it) => keyOf(it) === key))
    .filter(Boolean)
    .map((it) => ({ ...it, pinned: true }));
  const rest = visible
    .filter((it) => !pinned.includes(keyOf(it)))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return [...pinnedItems, ...rest];
}

// ---------- 文章：Blogger RSS 代理 ----------

app.get('/api/articles', async (req, res) => {
  try {
    const conf = readConfig('articles.json');
    if (conf.bloggerFeedUrl.includes('YOUR_BLOG')) {
      return res.json({ placeholder: true, items: [] }); // 还没填博客名，前端会提示
    }
    const items = await cached('articles', async () => {
      const url = conf.bloggerFeedUrl + '?alt=json&max-results=100';
      const r = await fetch(url);
      if (!r.ok) throw new Error('Blogger feed HTTP ' + r.status);
      const feed = (await r.json()).feed;
      return (feed.entry || []).map((e) => ({
        title: e.title.$t,
        link: (e.link.find((l) => l.rel === 'alternate') || e.link[0]).href,
        date: e.published.$t,
        summary: stripHtml((e.summary || e.content || {}).$t).slice(0, 120),
      }));
    });
    res.json({ items: applyPinHide(items, conf.pinned, conf.hidden, (a) => a.link) });
  } catch (err) {
    res.status(502).json({ error: '拉取 Blogger 文章失败：' + err.message });
  }
});

// ---------- 项目：GitHub API 代理 ----------

app.get('/api/projects', async (req, res) => {
  try {
    const conf = readConfig('projects.json');
    if (conf.githubUser === 'YOUR_GITHUB') {
      return res.json({ placeholder: true, items: [] });
    }
    const items = await cached('projects', async () => {
      const url = `https://api.github.com/users/${conf.githubUser}/repos?sort=updated&per_page=100`;
      const r = await fetch(url, { headers: { 'User-Agent': 'hand-drawn-town' } });
      if (!r.ok) throw new Error('GitHub API HTTP ' + r.status);
      return (await r.json()).map((repo) => ({
        name: repo.name,
        description: repo.description || '',
        language: repo.language || '',
        stars: repo.stargazers_count,
        link: repo.html_url,
        date: repo.pushed_at,
      }));
    });
    res.json({ items: applyPinHide(items, conf.pinned, conf.hidden, (p) => p.name) });
  } catch (err) {
    res.status(502).json({ error: '拉取 GitHub 项目失败：' + err.message });
  }
});

// ---------- 经历 / 知识卡片：每次现读文件，改完保存即生效 ----------

app.get('/api/experience', (req, res) => {
  try {
    const items = readConfig('experience.json');
    items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: '读取 experience.json 失败：' + err.message });
  }
});

app.get('/api/cards', (req, res) => {
  try {
    res.json({ items: readConfig('cards.json') });
  } catch (err) {
    res.status(500).json({ error: '读取 cards.json 失败：' + err.message });
  }
});

// ---------- 静态托管前端 ----------

// 显式设置 MIME 类型，解决 Render 代理层可能返回错误 Content-Type 的问题
app.use(express.static(FRONTEND_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    }
  },
}));

// SPA 回退：所有未匹配路由返回 index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API not found' });
  }
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`手绘城镇已开门营业 → http://localhost:${PORT}`);
});
