/**
 * 城镇渲染 + 小人行走 + 点击建筑的"镜头俯冲飞入"转场。
 * 布局数据全部来自 config.js 的 BUILDINGS / WALKERS，改坐标不用动这里。
 */
(function () {
  const townEl = document.getElementById('town');
  const doorFlash = document.getElementById('doorFlash');
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== 建筑：锚点定位 + 按 y 排层（越靠下越靠前，防穿模）=====
  BUILDINGS.forEach((b) => {
    const el = document.createElement('div');
    el.className = 'building';
    el.dataset.id = b.id;
    el.style.cssText = `left:${b.x}%;top:${b.y}%;width:${b.w}%;z-index:${Math.round(b.y * 10)};--px:${b.px}%;--py:${b.py}%;`;
    el.innerHTML = `
      <img src="assets_pack/buildings/${b.id}.png" alt="${b.name}" draggable="false">
      <div class="label"><b>${b.name}</b><span>${b.sub}</span></div>`;
    el.addEventListener('click', () => flyInto(b));
    townEl.appendChild(el);
  });

  // ===== 转场：镜头俯冲飞入 + 推门光晕 + 内容页淡入 =====
  let flying = false;

  function flyInto(b) {
    if (flying || document.body.classList.contains('modal-open')) return;
    if (prefersReduce) { Modules.open(b.id); return; } // 减少动态：直接显示内容页
    flying = true;
    // 以建筑锚点为原点放大推进，平移让锚点趋向画面中心，叠加透视倾斜制造绕入感
    const dx = 50 - b.x;
    const dy = 50 - b.y;
    townEl.style.transformOrigin = `${b.x}% ${b.y}%`;
    townEl.style.transform =
      `translate(${dx * 0.7}%, ${dy * 0.7}%) scale(2.6) rotateX(14deg) rotateY(-4deg)`;
    townEl.classList.add('flying');
    // 飞到一半：推门暖光
    setTimeout(() => doorFlash.classList.add('flash'), 520);
    // 飞入结束：显示内容页
    setTimeout(() => {
      Modules.open(b.id);
      doorFlash.classList.remove('flash');
      flying = false;
    }, 1050);
  }

  // 内容页关闭时由 modules.js 回调：镜头拉回总览
  Modules.onClose = function () {
    townEl.classList.remove('flying');
    townEl.style.transform = '';
  };

  // ===== 小人行走 =====
  const frames = [1, 2, 3, 4].map((i) => `assets_pack/character/walk_${i}.png`);
  frames.forEach((src) => { new Image().src = src; }); // 预载，避免切帧闪烁

  function lerp(a, b, p) { return a + (b - a) * p; }

  const agents = WALKERS.map((def, i) => {
    const el = document.createElement('div');
    el.className = 'walker';
    el.style.width = def.scale + '%';
    const im = document.createElement('img');
    im.src = frames[0];
    el.appendChild(im);
    townEl.appendChild(el);
    return {
      el, im, path: def.path, speed: def.speed,
      seg: 0, t: def.start || 0,
      frameIdx: i % frames.length, // 错开起始帧，步伐不同步
      frameTick: i * 3,            // 错开切帧节奏
    };
  });

  function place(a) {
    const p0 = a.path[a.seg], p1 = a.path[(a.seg + 1) % a.path.length];
    const x = lerp(p0[0], p1[0], a.t), y = lerp(p0[1], p1[1], a.t);
    a.el.style.left = x + '%';
    a.el.style.top = y + '%';
    // 与建筑同一套图层标准(y*10)：走到建筑前挡住建筑、走到后面被建筑挡
    a.el.style.zIndex = Math.round(y * 10) + 1;
    if (p1[0] < p0[0]) a.el.classList.add('face-left'); else a.el.classList.remove('face-left');
  }

  function step() {
    agents.forEach((a) => {
      a.t += a.speed;
      if (a.t >= 1) { a.t = 0; a.seg = (a.seg + 1) % a.path.length; }
      place(a);
      a.frameTick++;
      if (a.frameTick % 8 === 0) {
        a.frameIdx = (a.frameIdx + 1) % frames.length;
        a.im.src = frames[a.frameIdx];
      }
    });
    requestAnimationFrame(step);
  }

  agents.forEach(place);
  if (!prefersReduce) requestAnimationFrame(step);
})();
