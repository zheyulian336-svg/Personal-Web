/**
 * 五个模块的内容页（overlay）：生成、打开/关闭、从后端拉数据渲染。
 * town.js 通过 Modules.open(id) 打开内容页，并把 Modules.onClose 设为"镜头拉回"。
 */
const Modules = (function () {
  const container = document.getElementById('overlays');
  const dataCache = {}; // 每个模块的数据本次会话只拉一次

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ===== overlay 骨架 =====
  BUILDINGS.forEach((b) => {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.dataset.for = b.id;
    ov.innerHTML = `
      <div class="sheet">
        <button class="close" aria-label="关闭">✕</button>
        <div class="sheet-head"><span class="sheet-icon">${b.icon}</span>
          <div><h2>${b.name}</h2><p>${b.sub}</p></div></div>
        <div class="sheet-body"><div class="loading">加载中…</div></div>
      </div>`;
    ov.addEventListener('click', (e) => { if (e.target === ov) close(ov); });
    ov.querySelector('.close').addEventListener('click', () => close(ov));
    container.appendChild(ov);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const o = document.querySelector('.overlay.show');
      if (o) close(o);
    }
  });

  function open(id) {
    const ov = document.querySelector(`.overlay[data-for="${id}"]`);
    ov.classList.add('show');
    void ov.offsetWidth; // 强制回流后加 reveal 触发淡入
    ov.classList.add('reveal');
    document.body.classList.add('modal-open');
    render(id, ov.querySelector('.sheet-body'));
  }

  function close(ov) {
    ov.classList.remove('reveal', 'show');
    document.body.classList.remove('modal-open');
    if (Modules.onClose) Modules.onClose();
  }

  // ===== 数据获取 =====
  async function fetchData(endpoint) {
    if (dataCache[endpoint]) return dataCache[endpoint];
    const r = await fetch(API_BASE + '/api/' + endpoint);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'HTTP ' + r.status);
    dataCache[endpoint] = data;
    return data;
  }

  async function withData(body, endpoint, renderFn) {
    body.innerHTML = '<div class="loading">加载中…</div>';
    try {
      const data = await fetchData(endpoint);
      body.innerHTML = renderFn(data);
    } catch (err) {
      body.innerHTML = `<div class="error-note">数据加载失败：${esc(err.message)}<br>
        <small>请确认后端已启动（backend/ 目录下 npm start）</small></div>`;
    }
  }

  // ===== 各模块渲染 =====
  const renderers = {
    statue(body) {
      const avatar = PROFILE.avatar.includes('/') || PROFILE.avatar.includes('.')
        ? `<img src="${esc(PROFILE.avatar)}" alt="头像">` : esc(PROFILE.avatar);
      body.innerHTML = `
        <div class="profile">
          <div class="avatar-ph">${avatar}</div>
          <div>
            <h3 class="ph-name">${esc(PROFILE.name)}</h3>
            <p class="ph-title">${esc(PROFILE.title)}</p>
            <p class="ph-bio">${esc(PROFILE.bio)}</p>
            <div class="chips">${PROFILE.links.map((l) =>
              `<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>
          </div>
        </div>`;
    },

    library(body) {
      withData(body, 'articles', (data) => {
        if (data.placeholder) return `<p class="note">还没配置博客地址：把 <b>config/articles.json</b> 里的
          YOUR_BLOG 换成你的 Blogger 博客名即可自动同步文章。</p>`;
        if (!data.items.length) return '<div class="loading">书架还空着，去 Blogger 写第一篇吧 ✍️</div>';
        return `<ul class="art-list">${data.items.map((a) => `
          <li>${a.pinned ? '<span class="pin">📌</span>' : ''}
            <a href="${esc(a.link)}" target="_blank" rel="noopener" title="${esc(a.summary)}">${esc(a.title)}</a>
            <span class="date">${esc((a.date || '').slice(0, 10))}</span></li>`).join('')}</ul>
          <p class="hint">发博客即自动同步 · 置顶/隐藏由 config/articles.json 控制</p>`;
      });
    },

    lab(body) {
      withData(body, 'projects', (data) => {
        if (data.placeholder) return `<p class="note">还没配置 GitHub 用户名：把 <b>config/projects.json</b> 里的
          YOUR_GITHUB 换成你的用户名即可自动同步仓库。</p>`;
        if (!data.items.length) return '<div class="loading">实验室还空着，去 GitHub 推第一个仓库吧 🔧</div>';
        return `<div class="repo-grid">${data.items.map((p) => `
          <div class="repo">
            <h4>${p.pinned ? '📌 ' : ''}<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.name)}</a></h4>
            <p>${esc(p.description) || '（暂无描述）'}</p>
            ${p.language ? `<span class="lang">● ${esc(p.language)}</span>` : ''}
            <span class="star">★ ${p.stars}</span>
          </div>`).join('')}</div>
          <p class="hint">推代码即自动同步 · 置顶/隐藏由 config/projects.json 控制</p>`;
      });
    },

    museum(body) {
      withData(body, 'experience', (data) => `
        <div class="timeline">${data.items.map((t) => `
          <div class="tl-item">
            <span class="tl-date">${esc(t.date)}</span>${t.tag ? `<span class="tl-tag">${esc(t.tag)}</span>` : ''}
            <h4>${esc(t.title)}</h4><p>${esc(t.desc)}</p>
          </div>`).join('')}</div>
        <p class="hint">内容来自 config/experience.json，按时间倒序陈列</p>`);
    },

    university(body) {
      withData(body, 'cards', (data) => `
        <div class="cards">${data.items.map((c) => `
          <div class="flip" onclick="this.classList.toggle('flipped')">
            <div class="flip-in">
              <div class="flip-f">${esc(c.front)}${c.category ? `<span class="cat">${esc(c.category)}</span>` : ''}</div>
              <div class="flip-b">${esc(c.back)}</div>
            </div>
          </div>`).join('')}</div>
        <p class="hint">点击卡片翻面 · 内容来自 config/cards.json</p>`);
    },
  };

  function render(id, body) {
    renderers[id](body);
  }

  return { open, onClose: null };
})();
