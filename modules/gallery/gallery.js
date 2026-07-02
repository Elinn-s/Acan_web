// =====================================================
// 图片资料站配置 — 管理员修改区（只需改这个文件）
// =====================================================

const GALLERY_CONFIG = {

  // ---- 分类列表 ----
  // 添加新分类：在末尾追加一行，格式：
  //   { id: '唯一英文id', name: '显示名称', folder: '文件夹名称' }
  // 对应文件夹需在 images/ 目录下提前创建
  categories: [
    { id: 'meizhaos', name: '美照',     folder: '美照'     },
    { id: 'chuandas', name: '同款穿搭', folder: '同款穿搭' },
    // ↓ 在此行下面添加新分类
  ],

  // ---- 各分类图片文件名列表 ----
  // key 与上方 folder 字段完全一致
  // 图片文件放入 images/<folder>/ 文件夹后，在此填写文件名
  images: {
    '美照':     [
      // 示例（删掉注释、填入真实文件名）：
      // '001.jpg',
      // '002.jpg',
    ],
    '同款穿搭': [
      // '001.jpg',
    ],
    // ↓ 新增分类时在此处添加同名 key 和图片数组
  },
};

// =====================================================
// 以下代码无需修改
// =====================================================

let activeCategoryId = GALLERY_CONFIG.categories[0]?.id ?? '';
let currentImages    = [];   // 当前分类的完整路径数组
let lightboxIndex    = 0;

// ---- 渲染分类标签 ----
function renderCategories() {
  const nav = document.getElementById('categoryNav');
  nav.innerHTML = GALLERY_CONFIG.categories.map(cat => `
    <button
      class="category-btn ${cat.id === activeCategoryId ? 'active' : ''}"
      data-id="${cat.id}"
      data-folder="${cat.folder}">
      ${cat.name}
    </button>
  `).join('');

  nav.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategoryId = btn.dataset.id;
      renderImages(btn.dataset.folder);
    });
  });
}

// ---- 渲染图片网格 ----
function renderImages(folder) {
  const imgs  = GALLERY_CONFIG.images[folder] ?? [];
  const grid  = document.getElementById('imageGrid');

  currentImages = imgs.map(f => `images/${folder}/${f}`);

  if (imgs.length === 0) {
    grid.innerHTML = '<p class="empty-tip">这里还没有图片，敬请期待～ 🌸</p>';
    return;
  }

  grid.innerHTML = imgs.map((f, i) => `
    <div class="image-card" data-index="${i}" tabindex="0" role="button" aria-label="查看第${i+1}张图片">
      <img src="images/${folder}/${f}" alt="${f}" loading="lazy">
      <div class="image-overlay"><span class="zoom-icon">🔍</span></div>
    </div>
  `).join('');

  grid.querySelectorAll('.image-card').forEach(card => {
    card.addEventListener('click', () => openLightbox(+card.dataset.index));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openLightbox(+card.dataset.index);
    });
  });
}

// ---- 灯箱 ----
function openLightbox(index) {
  lightboxIndex = index;
  const lb = document.getElementById('lightbox');
  lb.classList.add('active');
  lb.setAttribute('aria-hidden', 'false');
  updateLightboxImage();
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('active');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function stepLightbox(delta) {
  lightboxIndex = (lightboxIndex + delta + currentImages.length) % currentImages.length;
  updateLightboxImage();
}

function updateLightboxImage() {
  document.getElementById('lightboxImg').src         = currentImages[lightboxIndex];
  document.getElementById('lightboxCaption').textContent =
    `${lightboxIndex + 1} / ${currentImages.length}`;
}

// ---- 键盘导航 ----
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('active')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  stepLightbox(-1);
  if (e.key === 'ArrowRight') stepLightbox(+1);
});

// ---- 触摸滑动（移动端） ----
let touchStartX = 0;
document.getElementById('lightboxImg')?.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });
document.getElementById('lightboxImg')?.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) stepLightbox(dx > 0 ? -1 : 1);
}, { passive: true });

// ---- 绑定灯箱按钮 ----
function bindLightboxButtons() {
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxOverlay').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => stepLightbox(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => stepLightbox(+1));

  // 触摸事件重新绑定（元素此时已存在）
  const img = document.getElementById('lightboxImg');
  img.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  img.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) stepLightbox(dx > 0 ? -1 : 1);
  }, { passive: true });
}

// ---- 入口 ----
document.addEventListener('DOMContentLoaded', () => {
  const firstCat = GALLERY_CONFIG.categories[0];
  renderCategories();
  if (firstCat) renderImages(firstCat.folder);
  bindLightboxButtons();
});
