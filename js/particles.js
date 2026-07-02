// 标题粒子特效 — 粒子从标题文字区飘散消失
(function () {
  const canvas  = document.getElementById('particleCanvas');
  const ctx     = canvas.getContext('2d');
  const COLORS  = ['#FF6B9D', '#C77DFF', '#FFD93D', '#4FC3F7', '#43E97B', '#FF9F43'];
  const MAX_PARTICLES = 38;

  let particles  = [];
  let titleRect  = null;
  let rafId      = null;

  // ---- 尺寸同步 ----
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function cacheTitle() {
    const el = document.getElementById('siteTitle');
    if (el) titleRect = el.getBoundingClientRect();
  }

  // ---- 粒子类 ----
  function Particle() {
    this.reset(true);
  }

  Particle.prototype.reset = function (stagger) {
    const rect = titleRect || { left: 0, top: 0, width: canvas.width, height: 120 };
    // 随机落在标题文字包围盒内
    this.x      = rect.left + Math.random() * rect.width;
    this.y      = rect.top  + Math.random() * rect.height;
    this.r      = Math.random() * 4.5 + 1.5;
    this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.vx     = (Math.random() - 0.5) * 1.4;
    this.vy     = -(Math.random() * 1.6 + 0.5);
    this.alpha  = stagger ? Math.random() : 1;       // 初始错开透明度
    this.decay  = Math.random() * 0.007 + 0.003;
  };

  Particle.prototype.update = function () {
    this.x    += this.vx;
    this.y    += this.vy;
    this.r    *= 0.998;
    this.alpha -= this.decay;
  };

  Particle.prototype.draw = function () {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle   = this.color;
    ctx.shadowBlur  = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // ---- 动画主循环 ----
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 补充粒子
    while (particles.length < MAX_PARTICLES) {
      particles.push(new Particle());
    }

    // 更新 & 绘制
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => { p.update(); p.draw(); });

    // 死亡粒子替换
    while (particles.length < MAX_PARTICLES) {
      const p = new Particle();
      p.alpha = 0;    // 下帧才开始可见，避免闪现
      particles.push(p);
    }

    rafId = requestAnimationFrame(tick);
  }

  // ---- 初始化 ----
  function init() {
    resize();
    // 等字体渲染后再取包围盒
    setTimeout(() => {
      cacheTitle();
      for (let i = 0; i < MAX_PARTICLES; i++) {
        particles.push(new Particle());
      }
      tick();
    }, 120);
  }

  window.addEventListener('resize', () => {
    resize();
    cacheTitle();
  });

  // DOMContentLoaded 可能已触发（script 在底部）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
