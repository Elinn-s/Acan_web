/*
 * 可直接双击 index.html 运行的单文件入口。
 * 只内置 meta.json 的文字与图片路径，不读取任何 magazine 图片；
 * 所有图片仍由 imageSource() 统一替换为空白 SVG。
 */
(function () {
  'use strict';

  const PLACEHOLDER = 'assets/blank.svg';
  const CATALOG = [
    ['2023-01-29', 20230129, '孚世兔年', '孚世TRANSFORM | 兔年开年刊', '2023.01.29',
      '我们无时不刻在期待自己的高光时刻，认为自己达到某个高度人生才是完美。而当下的努力与成长的旖旎才是最值得回味的', '杂志内页', 1, 15, 0],
    ['2026-05-15', 20260515, '一寸清欢', '孚世 TRANSFORM 五月刊 | 一寸清欢', '2026.05.15',
      '在古朴静谧的氛围里，寻得一份不被俗世打扰的松弛，这便是藏在烟火古巷里，最妥帖的一寸清欢', '', 2, 16, 0],
    ['2026-05-19-tops', 20260519, 'Tops', 'Tops时尚人物520封面 | 灿若千面', '2026.05.19',
      '她以千禧百变造型，在粉色柔软与金属硬核的临界点上，自如游弋', '无实体杂志（可恶）', 1, 18, 0],
    ['2026-07-10-ellemen', 20260710, 'ELLEMEN七月', 'ELLEMEN七月刊', '2026.07.10',
      '镜头之外，她仍在继续书写自己的答案', '杂志内页', 1, 10, 0],
    ['2026-07-15-trendmo', 20260715, 'Mermaid', 'Trendmo趋势 | Mermaid', '2026.07.15',
      '她不必与鲛珠争辉，月光落在深海，从来不需要被照亮。', '无实体刊，有采访 https://weibo.com/6530289599/R8OoUpSJZ', 1, 16, 0],
    ['2026-08-11-chic', 20260811, 'CHIC八月', 'CHIC八月大片', '2026.08.12',
      '这个夏天，她想带着“悠长假期”中积攒的勇气和信心，去把那些“不可能”，一件一件地变成“可能”。', '实体刊，AB封，6张小卡', 2, 19, 3],
  ];

  const $ = (id) => document.getElementById(id);
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function imageSource(file) {
    return file?.source || PLACEHOLDER;
  }

  function makeBook(row) {
    const [id, timestamp, title, masthead, date, intro, note, coverCount, pageCount, extraCount] = row;
    const dir = `data/magazines/${id}`;
    const covers = Array.from({ length: coverCount }, (_, index) => ({
      source: `${dir}/cover-${String.fromCharCode(97 + index)}.webp`,
      label: index === 0 ? '封面' : `封面 ${index + 1}`,
    }));
    const pages = Array.from({ length: pageCount }, (_, index) => {
      const isExtra = extraCount > 0 && index >= pageCount - extraCount;
      return {
        source: `${dir}/pages/${String(index + 1).padStart(2, '0')}.webp`,
        label: isExtra ? `花絮 ${index - pageCount + extraCount + 1}` : `正片 ${index + 1}`,
      };
    });
    return { id, timestamp, title, masthead, date, intro, note, covers, images: [...covers, ...pages] };
  }

  function safeUrl(value) {
    try {
      const url = new URL(value, location.href);
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  }

  function linkify(raw = '') {
    const tokens = [];
    let text = String(raw).replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (_, label, url) => {
      const safe = safeUrl(url);
      tokens.push(safe ? `<a href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : esc(label));
      return `\u0000${tokens.length - 1}\u0000`;
    });
    text = esc(text).replace(/https?:\/\/[^\s<)）]+/g, (url) => {
      const safe = safeUrl(url);
      return safe ? `<a href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${url}</a>` : url;
    });
    return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
  }

  function imageButton(image, index, alt, className = 'cover-large') {
    return `<button class="image-button ${className}" type="button" data-image-index="${index}"
      aria-label="查看${esc(alt)}大图"><span class="image-frame">
        <img src="${imageSource(image)}" data-source="${esc(image?.source || '')}" alt="${esc(alt)}" loading="lazy">
      </span>${className === 'thumb' ? `<span class="thumb__label">${esc(image.label)}</span>` : ''}</button>`;
  }

  class Zoom {
    constructor() {
      this.root = $('zoom'); this.view = $('zoom-view'); this.img = $('zoom-img');
      this.counter = $('zoom-count'); this.prev = $('zoom-prev'); this.next = $('zoom-next'); this.closeButton = $('zoom-close');
      this.list = []; this.index = 0; this.scale = 1; this.tx = 0; this.ty = 0; this.points = new Map();
      this.bind();
    }
    get openState() { return !this.root.hidden; }
    open(src, list) {
      this.list = list; this.index = Math.max(0, list.indexOf(src)); this.root.hidden = false;
      document.body.classList.add('is-zoomed'); requestAnimationFrame(() => this.root.classList.add('is-visible'));
      this.show(); this.closeButton.focus({ preventScroll: true });
    }
    close() {
      if (!this.openState) return; this.root.classList.remove('is-visible'); document.body.classList.remove('is-zoomed');
      setTimeout(() => { this.root.hidden = true; this.img.removeAttribute('src'); }, 200);
    }
    step(delta) { const next = clamp(this.index + delta, 0, this.list.length - 1); if (next !== this.index) { this.index = next; this.show(); } }
    show() {
      this.reset(); this.img.src = this.list[this.index]; this.counter.textContent = `${this.index + 1} / ${this.list.length}`;
      this.prev.disabled = this.index === 0; this.next.disabled = this.index === this.list.length - 1;
      const ready = () => { this.measure(); this.apply(); };
      if (this.img.complete) ready(); else { this.img.onload = ready; this.img.onerror = ready; }
    }
    measure() {
      const box = this.view.getBoundingClientRect(); this.vw = box.width; this.vh = box.height;
      this.iw = this.img.naturalWidth || 3; this.ih = this.img.naturalHeight || 4;
      this.base = Math.min(this.vw / this.iw, this.vh / this.ih);
    }
    reset() { this.scale = 1; this.tx = 0; this.ty = 0; }
    apply(animate = false) {
      const size = this.base * this.scale;
      this.tx = clamp(this.tx, -Math.max(0, (this.iw * size - this.vw) / 2), Math.max(0, (this.iw * size - this.vw) / 2));
      this.ty = clamp(this.ty, -Math.max(0, (this.ih * size - this.vh) / 2), Math.max(0, (this.ih * size - this.vh) / 2));
      this.img.style.transition = animate ? 'transform .3s ease' : 'none';
      this.img.style.transform = `translate(calc(-50% + ${this.tx}px), calc(-50% + ${this.ty}px)) scale(${size})`;
      this.root.classList.toggle('is-zoomed-in', this.scale > 1.01);
    }
    local(x, y) { const box = this.view.getBoundingClientRect(); return [x - box.left - box.width / 2, y - box.top - box.height / 2]; }
    zoomAt(next, cx, cy, animate = false) {
      const previous = this.scale; this.scale = clamp(next, 1, 8); const ratio = this.scale / previous;
      this.tx = cx - (cx - this.tx) * ratio; this.ty = cy - (cy - this.ty) * ratio;
      if (this.scale <= 1.001) this.reset(); this.apply(animate);
    }
    bind() {
      this.closeButton.addEventListener('click', () => this.close()); this.prev.addEventListener('click', () => this.step(-1)); this.next.addEventListener('click', () => this.step(1));
      this.view.addEventListener('wheel', (event) => { event.preventDefault(); const [x, y] = this.local(event.clientX, event.clientY); this.zoomAt(this.scale * Math.exp(-event.deltaY * .0016), x, y); }, { passive: false });
      this.view.addEventListener('dblclick', (event) => { const [x, y] = this.local(event.clientX, event.clientY); this.zoomAt(this.scale > 1.05 ? 1 : 2.6, x, y, true); });
      this.view.addEventListener('pointerdown', (event) => {
        this.view.setPointerCapture(event.pointerId); this.points.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.points.size === 2) { const [a, b] = [...this.points.values()]; this.spread = Math.hypot(a.x - b.x, a.y - b.y) || 1; }
      });
      this.view.addEventListener('pointermove', (event) => {
        const point = this.points.get(event.pointerId); if (!point) return;
        const dx = event.clientX - point.x; const dy = event.clientY - point.y; point.x = event.clientX; point.y = event.clientY;
        if (this.points.size === 2) {
          const [a, b] = [...this.points.values()]; const nextSpread = Math.hypot(a.x - b.x, a.y - b.y) || 1;
          const [x, y] = this.local((a.x + b.x) / 2, (a.y + b.y) / 2); this.zoomAt(this.scale * (nextSpread / this.spread), x, y); this.spread = nextSpread;
        } else { this.tx += dx; this.ty += dy; this.apply(); }
      });
      const release = (event) => { this.points.delete(event.pointerId); if (this.points.size < 2) this.spread = null; };
      this.view.addEventListener('pointerup', release); this.view.addEventListener('pointercancel', release);
      addEventListener('keydown', (event) => { if (!this.openState) return; if (event.key === 'Escape') this.close(); else if (event.key === 'ArrowRight') this.step(1); else if (event.key === 'ArrowLeft') this.step(-1); });
      addEventListener('resize', () => { if (this.openState) { this.measure(); this.apply(); } });
    }
  }

  const books = CATALOG.map(makeBook).sort((a, b) => a.timestamp - b.timestamp);
  const zoom = new Zoom();
  let activeBook = null;

  function renderShelf() {
    $('book-grid').innerHTML = books.map((book, index) => `<button class="book-card" type="button" role="listitem"
      data-id="${esc(book.id)}" aria-label="打开《${esc(book.title)}》" style="--delay:${index * 45}ms">
      <span class="book-card__cover image-frame"><img src="${imageSource(book.covers[0])}"
        data-source="${esc(book.covers[0].source)}" alt="${esc(book.title)}封面" loading="lazy"></span>
      <span class="book-card__title">${esc(book.title)}</span><time class="book-card__date">${esc(book.date)}</time></button>`).join('');
    $('library-count').textContent = `${books.length} 本 · 按日期从早到晚`;
  }

  function openBook(book, updateHistory = true) {
    activeBook = book; $('detail-cover').innerHTML = imageButton(book.covers[0], 0, `${book.title}封面`);
    $('detail-meta').innerHTML = `<p class="eyebrow">${esc(book.date)}</p><h2 id="detail-title">${esc(book.title)}</h2>
      ${book.masthead ? `<p class="meta__masthead">${linkify(book.masthead)}</p>` : ''}
      ${book.intro ? `<p class="meta__intro">${linkify(book.intro)}</p>` : ''}
      ${book.note ? `<div class="meta__note"><span>备注</span><p>${linkify(book.note)}</p></div>` : ''}`;
    $('thumb-grid').innerHTML = book.images.map((image, index) => imageButton(image, index, `${book.title} · ${image.label}`, 'thumb')).join('');
    $('gallery-count').textContent = `${book.images.length} 张`; $('library').hidden = true; $('detail').hidden = false;
    scrollTo(0, 0); if (updateHistory) history.pushState({ book: book.id }, '', `#${encodeURIComponent(book.id)}`);
  }
  function closeBook(updateHistory = true) {
    if ($('detail').hidden) return; $('detail').hidden = true; $('library').hidden = false; activeBook = null; scrollTo(0, 0);
    if (updateHistory && location.hash) history.pushState({}, '', location.pathname);
  }

  $('book-grid').addEventListener('click', (event) => { const card = event.target.closest('.book-card'); const book = books.find((item) => item.id === card?.dataset.id); if (book) openBook(book); });
  $('detail').addEventListener('click', (event) => { const button = event.target.closest('[data-image-index]'); if (!button || !activeBook) return; const sources = activeBook.images.map(imageSource); const index = Number(button.dataset.imageIndex); zoom.open(sources[index], sources); });
  $('back').addEventListener('click', () => closeBook());
  addEventListener('popstate', () => { const book = books.find((item) => item.id === decodeURIComponent(location.hash.slice(1))); if (book) openBook(book, false); else closeBook(false); });

  renderShelf();
  const initial = books.find((book) => book.id === decodeURIComponent(location.hash.slice(1)));
  if (initial) openBook(initial, false);
}());
