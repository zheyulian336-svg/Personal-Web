/**
 * ===== 站点配置（日常维护改这里，不用碰 town.js / modules.js）=====
 */

/** 后端地址：由 Express 一起托管时留空（同源）；前端单独部署时改成后端完整地址，
 *  如 "https://your-app.onrender.com" */
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

/** 个人信息（雕像模块，纯静态） */
const PROFILE = {
  name: '连哲语 Leon Lian',
  title: '懂技术的 AI 产品经理 · Forward Deployed Engineer',
  bio: '悉尼大学软件工程科班出身，专注企业级 AI Agent 的落地。曾在 OpenAI × AP+ 项目中作为 Forward Deployed Engineer 常驻客户侧，主导多 Agent 动态路由系统的架构设计与交付（项目被 OpenAI 收录为官方客户案例）。数据驱动、结果导向，习惯用可量化指标验证方案价值。',
  avatar: 'assets_pack/avatar.png', // 可以填 emoji，或图片地址如 "assets_pack/avatar.png"
  links: [
    { label: 'GitHub', url: 'https://github.com/zheyulian336-svg' },
    { label: 'Blog', url: 'https://zheyulian.blogspot.com' },
    { label: 'Website', url: 'https://zheyulian.com' },
    { label: 'Email', url: 'mailto:zheyulian336@gmail.com' },
    { label: 'Phone', url: 'tel:+8615904642518' },
  ],
};

/**
 * 建筑布局表（已调试好的精确坐标，单位都是相对画布的百分比）。
 *  x,y   — 锚点要对齐到的画布坐标
 *  w     — 建筑显示宽度（%画布宽）
 *  px,py — 图片上的锚点位置（默认底部中心 50,100；大学用右侧墙贴地角）
 */
const BUILDINGS = [
  { id: 'statue',     x: 50.0, y: 46.5, w: 13.5, px: 50,   py: 100,  name: '个人信息', sub: '中央广场 · 人物雕像', icon: '☉' },
  { id: 'library',    x: 31.0, y: 37.0, w: 24,   px: 50,   py: 100,  name: '文章阅读', sub: '图书馆',             icon: '📚' },
  { id: 'lab',        x: 71.0, y: 35.0, w: 26,   px: 50,   py: 100,  name: '项目展示', sub: '实验室',             icon: '🔬' },
  { id: 'museum',     x: 26.5, y: 73.5, w: 24,   px: 50,   py: 100,  name: '个人经历', sub: '博物馆',             icon: '🏛' },
  { id: 'university', x: 88.2, y: 59.5, w: 23,   px: 97.3, py: 78.9, name: '知识卡片', sub: '大学',               icon: '🎓' },
];

/** 小人：闭合路径（画布百分比坐标）、速度、起始相位、显示宽度 */
const WALKERS = [
  { path: [[50,46],[57,43],[60,38],[56,34],[50,32],[44,34],[40,39],[43,44],[50,46]], speed: 0.005,  start: 0.0,  scale: 3.6 },
  { path: [[46,40],[42,44],[38,48],[42,45],[46,41],[48,38],[46,40]],                 speed: 0.006,  start: 0.4,  scale: 3.4 },
  { path: [[54,48],[58,53],[62,58],[58,54],[54,49],[52,46],[54,48]],                 speed: 0.0045, start: 0.7,  scale: 3.8 },
  { path: [[47,50],[43,55],[40,60],[44,56],[48,51],[49,48],[47,50]],                 speed: 0.0055, start: 0.2,  scale: 3.5 },
  { path: [[53,40],[58,37],[62,34],[57,37],[53,41],[51,44],[53,40]],                 speed: 0.005,  start: 0.55, scale: 3.6 },
];
