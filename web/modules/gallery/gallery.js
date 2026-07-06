// =====================================================
// 图片资料站配置 — 管理员修改区（只需改这个文件）
// =====================================================

const GALLERY_CONFIG = {

  // ---- 页面标题 ----
  // 同时用作浏览器标签标题和页面内的大标题，改这一处两边都会跟着改
  title: '🌋欢迎来到火山口^_^',

  // ---- 分类列表 ----
  // 添加新分类：在末尾追加一行，格式：
  //   { id: '唯一英文id', name: '显示名称', folder: '文件夹名称' }
  // 对应文件夹需在 ../../data/gallery/ 目录下提前创建
  categories: [
    {
      id: 'meizhaos', name: '百变小灿', folder: 'photos', calendar: true,
      // ---- 专栏筛选 ----
      // 文件名里带 keyword 的图片会被划进对应专栏；点专栏按钮只显示匹配的图片
      // （类似 Excel 筛选，隐藏不匹配的，不会删掉），仍按日期分组排布
      filters: [
        { id: 'chengfeng2026', name: '乘风2026', keyword: '乘风' },
        // ↓ 在此行下面添加新专栏
      ],
    },
    { id: 'chuandas', name: '同款穿搭', folder: 'outfits' },
    // ↓ 在此行下面添加新分类
  ],
};

const CATEGORY_BY_FOLDER = {};
GALLERY_CONFIG.categories.forEach(cat => { CATEGORY_BY_FOLDER[cat.folder] = cat; });

// 图片文件名列表不用再手动填 —— 把图片放进 ../../data/gallery/<分类>/ 后，
// 跑一下 `node modules/gallery/gen-manifest.js` 自动生成 manifest.json

// =====================================================
// 以下代码无需修改
// =====================================================

let MANIFEST          = {};  // folder -> [{file, date}]数组，来自 manifest.json
let activeCategoryId = GALLERY_CONFIG.categories[0]?.id ?? '';
let currentImages    = [];   // 当前分类（筛选后）：[{src, date}]
let lightboxIndex    = 0;
let currentFolder    = null; // 当前分类的文件夹名，专栏按钮点击后要重新渲染同一个分类
let activeFilterId   = null; // 当前生效的专栏筛选 id，null 表示"全部"

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
      activeFilterId   = null; // 切换分类时重置专栏筛选
      renderImages(btn.dataset.folder);
    });
  });
}

// ---- 渲染图片（有日历的分类按日期分组成时间线，其它分类保持单一网格） ----
function renderImages(folder) {
  currentFolder = folder;

  const cat     = CATEGORY_BY_FOLDER[folder];
  const grouped = !!(cat && cat.calendar);
  const grid    = document.getElementById('imageGrid');

  let imgs = MANIFEST[folder] ?? [];

  const activeFilter = cat?.filters?.find(f => f.id === activeFilterId);
  if (activeFilter) {
    imgs = imgs.filter(item => item.file.includes(activeFilter.keyword));
  }

  currentImages = imgs.map(item => ({
    src:  `../../data/gallery/${folder}/${item.file}`,
    date: item.date,
  }));

  if (grouped) {
    // 倒序：日期晚的分组排在上面
    currentImages.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }

  renderFilterSidebar(cat);
  renderCalendarForCategory(folder);

  if (currentImages.length === 0) {
    grid.innerHTML = '<p class="empty-tip">这里还没有图片，敬请期待～ 🌸</p>';
    return;
  }

  const cardHtml = (img, i) => `
    <div class="image-card" data-index="${i}" tabindex="0" role="button" aria-label="查看第${i + 1}张图片">
      <img src="${img.src}" alt="图片 ${i + 1}" loading="lazy">
      <div class="image-overlay"><span class="zoom-icon">🔍</span></div>
    </div>
  `;

  if (grouped) {
    let html = '';
    let groupStart = 0;
    for (let i = 1; i <= currentImages.length; i++) {
      const groupEnded = i === currentImages.length || currentImages[i].date !== currentImages[groupStart].date;
      if (!groupEnded) continue;

      const groupItems = currentImages.slice(groupStart, i);
      html += `
        <div class="date-group">
          <p class="date-label">${formatDateLabel(currentImages[groupStart].date)}</p>
          <div class="image-grid">
            ${groupItems.map((img, gi) => cardHtml(img, groupStart + gi)).join('')}
          </div>
        </div>
      `;
      groupStart = i;
    }
    grid.innerHTML = html;
  } else {
    grid.innerHTML = `<div class="image-grid">${currentImages.map(cardHtml).join('')}</div>`;
  }

  grid.querySelectorAll('.image-card').forEach(card => {
    card.addEventListener('click', () => openLightbox(+card.dataset.index));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openLightbox(+card.dataset.index);
    });
  });
}

function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

// ---- 左侧专栏筛选（类似 Excel 筛选，只隐藏不匹配的图片，不影响原本的日期分组） ----
function renderFilterSidebar(cat) {
  const sidebar = document.getElementById('filterSidebar');
  const filters = cat?.filters ?? [];

  if (filters.length === 0) {
    sidebar.hidden = true;
    sidebar.innerHTML = '';
    return;
  }

  sidebar.hidden = false;

  const buttons = [{ id: null, name: '全部' }, ...filters];
  sidebar.innerHTML = buttons.map(f => `
    <button type="button" class="filter-btn ${activeFilterId === f.id ? 'active' : ''}" data-filter-id="${f.id ?? ''}">
      ${f.name}
    </button>
  `).join('');

  sidebar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilterId = btn.dataset.filterId || null;
      renderImages(currentFolder);
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
  document.getElementById('lightboxImg').src         = currentImages[lightboxIndex].src;
  document.getElementById('lightboxCaption').textContent =
    `${lightboxIndex + 1} / ${currentImages.length}`;
  resetZoom();
}

// ---- 滚轮缩放 + 拖拽平移 ----
const ZOOM_MIN  = 1;
const ZOOM_MAX  = 4;
const ZOOM_STEP = 0.15;

let zoomScale = 1;
let panX = 0;
let panY = 0;
let isPanning  = false;
let panStartX  = 0;
let panStartY  = 0;
let panOriginX = 0;
let panOriginY = 0;

function resetZoom() {
  zoomScale = 1;
  panX = 0;
  panY = 0;
  applyZoomTransform();
}

// 拖拽范围限制在图片本身大小内，避免放大后把图完全拖出视野
function clampPan(img) {
  const maxX = (img.offsetWidth  * (zoomScale - 1)) / 2;
  const maxY = (img.offsetHeight * (zoomScale - 1)) / 2;
  panX = Math.min(maxX, Math.max(-maxX, panX));
  panY = Math.min(maxY, Math.max(-maxY, panY));
}

function applyZoomTransform() {
  const img = document.getElementById('lightboxImg');
  if (!img) return;
  clampPan(img);
  img.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
  img.classList.toggle('zoomed', zoomScale > 1);
}

function bindZoomAndPan() {
  const img = document.getElementById('lightboxImg');

  img.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    zoomScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomScale + delta));
    if (zoomScale === ZOOM_MIN) { panX = 0; panY = 0; }
    applyZoomTransform();
  }, { passive: false });

  img.addEventListener('mousedown', e => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    isPanning  = true;
    panStartX  = e.clientX;
    panStartY  = e.clientY;
    panOriginX = panX;
    panOriginY = panY;
    img.classList.add('panning');
  });

  document.addEventListener('mousemove', e => {
    if (!isPanning) return;
    panX = panOriginX + (e.clientX - panStartX);
    panY = panOriginY + (e.clientY - panStartY);
    applyZoomTransform();
  });

  document.addEventListener('mouseup', () => {
    isPanning = false;
    img.classList.remove('panning');
  });
}

// ---- 日历（按日期跳转，年/月/日级联下拉，类似注册账号选生日；
//      只在配置了 calendar: true 的分类显示） ----
let calendarDateMap = {};  // 'YYYY-MM-DD' -> currentImages 里第一个匹配的下标
let dateTree = {};         // 年 -> 月 -> Set(日)，供下拉框级联使用

function renderCalendarForCategory(folder) {
  const widget = document.getElementById('calendarWidget');
  const cat = CATEGORY_BY_FOLDER[folder];

  if (!cat || !cat.calendar) {
    widget.hidden = true;
    return;
  }

  calendarDateMap = {};
  currentImages.forEach((img, i) => {
    if (img.date && !(img.date in calendarDateMap)) calendarDateMap[img.date] = i;
  });

  widget.hidden = false;
  populateYearSelect();
}

function buildDateTree() {
  const tree = {};
  Object.keys(calendarDateMap).forEach(dateStr => {
    const [y, m, d] = dateStr.split('-');
    tree[y] = tree[y] || {};
    tree[y][m] = tree[y][m] || new Set();
    tree[y][m].add(d);
  });
  return tree;
}

function populateYearSelect() {
  dateTree = buildDateTree();
  const years = Object.keys(dateTree).sort();
  const yearSelect = document.getElementById('calendarYearSelect');

  yearSelect.innerHTML = years.map(y => `<option value="${y}">${y}年</option>`).join('');
  const defaultYear = years[years.length - 1];
  if (defaultYear) yearSelect.value = defaultYear;
  populateMonthSelect(defaultYear);
}

function populateMonthSelect(year) {
  const months = Object.keys(dateTree[year] || {}).sort();
  const monthSelect = document.getElementById('calendarMonthSelect');

  monthSelect.innerHTML = months.map(m => `<option value="${m}">${parseInt(m, 10)}月</option>`).join('');
  const defaultMonth = months[months.length - 1];
  if (defaultMonth) monthSelect.value = defaultMonth;
  populateDaySelect(year, defaultMonth);
}

function populateDaySelect(year, month) {
  const days = Array.from(dateTree[year]?.[month] ?? []).sort();
  const daySelect = document.getElementById('calendarDaySelect');

  daySelect.innerHTML = days.map(d => `<option value="${d}">${parseInt(d, 10)}日</option>`).join('');
  const defaultDay = days[days.length - 1];
  if (defaultDay) daySelect.value = defaultDay;
}

function jumpToDate(dateStr) {
  const idx = calendarDateMap[dateStr];
  if (idx === undefined) return;
  const card = document.querySelector(`.image-card[data-index="${idx}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('jump-highlight');
  setTimeout(() => card.classList.remove('jump-highlight'), 1200);
}

function jumpFromSelectors() {
  const y = document.getElementById('calendarYearSelect').value;
  const m = document.getElementById('calendarMonthSelect').value;
  const d = document.getElementById('calendarDaySelect').value;
  if (!y || !m || !d) return;
  jumpToDate(`${y}-${m}-${d}`);
}

function bindCalendarControls() {
  const widget = document.getElementById('calendarWidget');
  const toggle = document.getElementById('calendarToggle');
  const panel  = document.getElementById('calendarPanel');

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.classList.toggle('open', !expanded);
    panel.hidden = expanded;
  });

  // 点面板外部收起
  document.addEventListener('click', e => {
    if (widget.hidden || panel.hidden) return;
    if (widget.contains(e.target)) return;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('open');
  });

  const yearSelect  = document.getElementById('calendarYearSelect');
  const monthSelect = document.getElementById('calendarMonthSelect');
  const daySelect   = document.getElementById('calendarDaySelect');

  yearSelect.addEventListener('change', () => {
    populateMonthSelect(yearSelect.value);
    jumpFromSelectors();
  });
  monthSelect.addEventListener('change', () => {
    populateDaySelect(yearSelect.value, monthSelect.value);
    jumpFromSelectors();
  });
  daySelect.addEventListener('change', jumpFromSelectors);
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

  bindZoomAndPan();
}

// ---- 入口 ----
document.addEventListener('DOMContentLoaded', async () => {
  document.title = GALLERY_CONFIG.title;
  document.getElementById('galleryTitle').textContent = GALLERY_CONFIG.title;

  try {
    const res = await fetch('manifest.json');
    MANIFEST = await res.json();
  } catch (err) {
    console.error('加载 manifest.json 失败，请先运行 node modules/gallery/gen-manifest.js', err);
  }

  const firstCat = GALLERY_CONFIG.categories[0];
  renderCategories();
  if (firstCat) renderImages(firstCat.folder);
  bindLightboxButtons();
  bindCalendarControls();
});
