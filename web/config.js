// =============================================
// 管理员配置文件 — 只需修改这里
// =============================================

const SITE_CONFIG = {
  // 背景图路径（替换文件名即可，图片放 data/landing/background/ 文件夹）
  backgroundImage: 'data/landing/background/86.jpg',

  // 背景遮罩不透明度（0 = 完全透明，1 = 完全不透明）
  overlayOpacity: 0.28,

  // 人物立绘路径（图片放 data/landing/figure/ 文件夹）
  characterImage: 'data/landing/figure/exm.png',
};

// =============================================
// 以下代码无需修改
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  const bgLayer = document.getElementById('bgLayer');
  if (bgLayer) {
    bgLayer.style.backgroundImage = `url('${SITE_CONFIG.backgroundImage}')`;
  }

  const overlay = document.querySelector('.bg-overlay');
  if (overlay) {
    overlay.style.opacity = SITE_CONFIG.overlayOpacity;
  }

  const charImg = document.getElementById('characterImg');
  if (charImg) {
    charImg.src = SITE_CONFIG.characterImage;
  }
});
