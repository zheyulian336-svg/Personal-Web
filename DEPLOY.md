# 🚀 部署指南（Render 免费档 + 绑定 zheyulian.com）

代码已经在 GitHub：<https://github.com/zheyulian336-svg/Personal-Web>

下面每一步都可以照着点。整个流程约 15 分钟，全部免费。

---

## 第 1 步：注册 / 登录 Render

1. 打开 <https://render.com>，点右上角 **Get Started** / **Sign In**。
2. 选 **Sign in with GitHub**（用你的 GitHub 账号 `zheyulian336-svg` 登录，最省事）。
3. 授权 Render 访问你的 GitHub 仓库。

---

## 第 2 步：创建 Web Service

1. 登录后点 **New +** → **Web Service**。
2. 在仓库列表里找到 **`Personal-Web`**，点 **Connect**。
   - 如果没看到，点 **Configure account** 给 Render 授权访问该仓库。
3. 填写配置（关键的几项）：

   | 字段 | 填什么 |
   |---|---|
   | **Name** | `personal-web`（会成为默认网址 `personal-web.onrender.com`，可自定义） |
   | **Region** | 选离你近的，如 `Singapore` |
   | **Branch** | `main` |
   | **Root Directory** | `backend` ⚠️ **一定要填这个** |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | **Free** |

   > 为什么 Root Directory 填 `backend`：后端代码在 `backend/` 里，它用相对路径访问 `../config` 和 `../frontend`，整个仓库都会被拉取，所以填 `backend` 即可，无需额外设置。

4. 点 **Create Web Service**。Render 会自动构建并启动，几分钟后你会得到一个网址：
   `https://personal-web.onrender.com` —— 打开它，你的手绘城镇网站就上线了。

   > ⚠️ 免费档特性：15 分钟无访问会休眠，下次访问需等约 30 秒冷启动。个人站完全够用。

---

## 第 3 步：绑定域名 zheyulian.com

### 3.1 在 Render 添加自定义域名

1. 进入你刚创建的服务 → 左侧 **Settings** → 找到 **Custom Domains**。
2. 点 **Add Custom Domain**，输入 `zheyulian.com`，确认。
3. 建议再点一次 **Add Custom Domain**，加上 `www.zheyulian.com`（这样带不带 www 都能访问）。
4. Render 会给你一段 DNS 记录提示，通常是：
   - 对 **`zheyulian.com`（根域名）**：一条 `A` 记录或 `ALIAS/ANAME`，指向 Render 给的地址；
   - 对 **`www.zheyulian.com`**：一条 `CNAME`，指向 `personal-web.onrender.com`。

   > **把 Render 页面上显示的那几行记录值记下来**，下一步要填到你的域名 DNS 后台。以 Render 实际显示的为准（它可能给的是 A 记录 IP，也可能是 CNAME 目标）。

### 3.2 在你的域名 DNS 后台加记录

去你**买 `zheyulian.com` 的那个平台**（Cloudflare / 阿里云 / 腾讯云 / GoDaddy / Namecheap 等）的 DNS 管理页，按 Render 提示添加：

| 类型 | 主机记录 / Name | 记录值 / Target | 说明 |
|---|---|---|---|
| `CNAME` | `www` | `personal-web.onrender.com` | www 子域名 |
| `A` 或 `ALIAS` | `@`（根域名） | Render 提示的那个值 | 裸域名 |

- **如果用 Cloudflare**：加 CNAME 时把小云朵先设为「仅 DNS / DNS only」（灰色），等 Render 签好证书再看要不要开代理。
- **裸域名（@）**：如果你的 DNS 商不支持根域名 CNAME，就按 Render 给的 **A 记录 IP** 填 `A` 记录。

### 3.3 等待生效 + 自动 HTTPS

- DNS 生效通常几分钟到几十分钟（个别情况最长 24~48 小时）。
- Render 会**自动申请并配置 HTTPS 证书**（Let's Encrypt），你什么都不用做。
- 回到 Render 的 Custom Domains 页，状态变成 **Verified** 且证书 **Issued** 就成功了。
- 打开 <https://zheyulian.com> —— 大功告成。

---

## 以后怎么更新网站

- **改内容**：改 `config/*.json` 或 `frontend/js/config.js`，然后：
  ```bash
  git add . && git commit -m "update" && git push
  ```
  Render 检测到 push 会**自动重新部署**，几分钟后线上更新。
- **发文章**：直接去 Blogger 发，网站自动同步（缓存 10 分钟）。
- **加项目**：直接推 GitHub 仓库，实验室模块自动同步。

---

## 常见问题

- **打开是 404 / 报错找不到 config**：多半是 Root Directory 没填 `backend`，回 Settings 改。
- **网站打开很慢**：免费档休眠导致的冷启动，属正常；想避免可升级到付费档或用 UptimeRobot 定时唤醒。
- **域名一直没生效**：检查 DNS 记录是否填对、有没有多余的旧记录冲突；用 `dig zheyulian.com` 或在线 DNS 查询工具确认解析已指向 Render。
