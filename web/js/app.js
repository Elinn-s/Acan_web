(function () {
  'use strict';

  const PLACEHOLDER = 'assets/blank.svg';
  const PLACEMENTS = [
    [27, 37, -10, .94, 4], [43, 29, 3, 1.02, 6], [61, 35, 10, .96, 7],
    [34, 67, 7, .94, 3], [50, 62, -4, 1.02, 5], [67, 65, 11, .94, 4],
  ];

  const $ = (id) => document.getElementById(id);
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const image = (src, alt = '') => `<img class="page-image" src="${esc(src)}" alt="${esc(alt)}" draggable="false">`;

  class MagazineReader {
    constructor() {
      this.root = $('reader-stage');
      this.bookEl = $('flipbook');
      this.leavesEl = $('flipbook-leaves');
      this.curlEl = $('page-curl');
      this.curlFace = $('page-curl-face');
      this.titleEl = $('reader-title');
      this.dateEl = $('reader-date');
      this.folioEl = $('reader-folio');
      this.leftEl = $('left-pages');
      this.rightEl = $('right-pages');
      this.prev = $('page-prev');
      this.next = $('page-next');
      this.closeBtn = $('reader-close');
      this.zoomBtn = $('reader-zoom');
      this.progress = $('reader-progress');
      this.index = 0;
      this.bind();
    }

    get isOpen() { return !this.root.hidden; }
    get mobile() { return innerWidth <= 760 || innerHeight > innerWidth; }

    coverFace() { return image(this.book.cover, `${this.book.title}封面`); }
    insideFace() { return '<div class="inside-cover"></div>'; }
    blankFace() { return '<div class="page-blank"></div>'; }
    backFace() {
      if (this.book.backCover) return image(this.book.backCover, `${this.book.title}封底`);
      return `<div class="back-cover"><strong>${esc(this.book.title)}</strong><span>${esc(this.book.date)} · ACAN ARCHIVE</span></div>`;
    }

    mount() {
      this.isMobile = this.mobile;
      if (this.isMobile) {
        this.surfaces = [this.coverFace(), this.insideFace(), ...this.book.contents.map((src, i) => image(src, `${this.book.title} 第${i + 1}页`)), this.backFace()];
        this.max = this.surfaces.length - 1;
        this.leaves = [];
        this.leavesEl.innerHTML = '';
        this.singleEl = document.createElement('div');
        this.singleEl.className = 'single-sheet';
        this.bookEl.append(this.singleEl);
        return;
      }

      const leaves = [{ front: this.coverFace(), back: this.insideFace() }];
      const pages = this.book.contents.map((src, i) => image(src, `${this.book.title} 第${i + 1}页`));
      for (let i = 0; i < pages.length; i += 2) {
        const isLast = i + 2 >= pages.length;
        leaves.push({
          front: pages[i],
          back: pages[i + 1] || (isLast ? this.backFace() : this.blankFace()),
        });
      }
      if (pages.length % 2 === 0) leaves.push({ front: this.blankFace(), back: this.backFace() });
      this.leavesEl.innerHTML = leaves.map((leaf) => `<div class="leaf">
        <div class="leaf__face leaf__face--front">${leaf.front}</div>
        <div class="leaf__face leaf__face--back">${leaf.back}</div>
      </div>`).join('');
      this.leaves = [...this.leavesEl.querySelectorAll('.leaf')];
      this.max = this.leaves.length;
    }

    open(book, updateHistory = true) {
      this.book = book;
      this.resetPageCurl();
      this.returnHash = !$('archive-detail').hidden ? `#detail=${encodeURIComponent(book.id)}` : '';
      this.index = 0;
      this.titleEl.textContent = book.title;
      this.dateEl.textContent = book.date;
      this.bookEl.querySelector('.single-sheet')?.remove();
      this.mount();
      this.paint();
      this.root.hidden = false;
      document.body.classList.add('is-reading');
      requestAnimationFrame(() => this.root.classList.add('is-visible'));
      if (updateHistory) history.pushState({ book: book.id, mode: 'read' }, '', `#read=${encodeURIComponent(book.id)}`);
      this.closeBtn.focus({ preventScroll: true });
    }

    close(updateHistory = true) {
      if (!this.isOpen) return;
      this.resetPageCurl();
      this.root.classList.remove('is-visible', 'is-enlarged');
      this.zoomBtn.textContent = '放大';
      this.zoomBtn.setAttribute('aria-pressed', 'false');
      document.body.classList.remove('is-reading');
      setTimeout(() => { this.root.hidden = true; }, 350);
      if (updateHistory && location.hash) history.pushState({}, '', this.returnHash || location.pathname);
    }

    goto(next) {
      const value = clamp(next, 0, this.max);
      if (value === this.index) return;
      if (!this.isMobile && Math.abs(value - this.index) === 1) {
        const forward = value > this.index;
        const turningLeaf = this.leaves[forward ? this.index : value];
        if (turningLeaf) {
          this.playPageCurl(turningLeaf, forward);
          turningLeaf.classList.remove('is-turning', 'is-turning-back');
          void turningLeaf.offsetWidth;
          turningLeaf.classList.add(forward ? 'is-turning' : 'is-turning-back');
          setTimeout(() => turningLeaf.classList.remove('is-turning', 'is-turning-back'), 820);
        }
      }
      this.index = value;
      this.paint();
    }

    preparePageCurl(leaf, forward) {
      if (!leaf || this.isMobile) return;
      const sourceFace = leaf.querySelector(forward ? '.leaf__face--back' : '.leaf__face--front');
      this.curlFace.innerHTML = sourceFace?.innerHTML || this.blankFace();
      clearTimeout(this.curlTimer);
      this.curlEl.className = `page-curl${forward ? '' : ' is-backward'}`;
      this.curlEl.removeAttribute('style');
    }

    playPageCurl(leaf, forward) {
      this.preparePageCurl(leaf, forward);
      void this.curlEl.offsetWidth;
      this.curlEl.classList.add(forward ? 'is-peeling' : 'is-peeling-back');
      this.curlTimer = setTimeout(() => this.resetPageCurl(), 960);
    }

    dragPageCurl(progress, forward) {
      if (this.isMobile) return;
      const size = 6 + progress * 120;
      this.curlEl.style.opacity = String(.3 + progress * .7);
      if (forward) {
        this.curlEl.style.clipPath = `polygon(100% ${100 - size}%, 100% 100%, ${100 - size}% 100%)`;
        this.curlEl.style.transform = `translate(${-progress * 34}%, ${-progress * 5}%) rotate(${-progress * 14}deg)`;
      } else {
        this.curlEl.style.clipPath = `polygon(0 ${100 - size}%, ${size}% 100%, 0 100%)`;
        this.curlEl.style.transform = `translate(${progress * 34}%, ${-progress * 5}%) rotate(${progress * 14}deg)`;
      }
    }

    resetPageCurl() {
      clearTimeout(this.curlTimer);
      this.curlEl.className = 'page-curl';
      this.curlEl.removeAttribute('style');
      this.curlFace.innerHTML = '';
    }

    paint() {
      const max = Math.max(1, this.max);
      const leftRatio = this.index / max;
      const rightRatio = 1 - leftRatio;
      this.root.style.setProperty('--left-ratio', leftRatio.toFixed(3));
      this.root.style.setProperty('--right-ratio', rightRatio.toFixed(3));
      this.bookEl.classList.toggle('is-front', this.index === 0);
      this.bookEl.classList.toggle('is-back', this.index === this.max);
      this.bookEl.classList.toggle('can-turn', this.index < this.max);

      if (this.isMobile) {
        this.singleEl.innerHTML = this.surfaces[this.index] || this.blankFace();
        this.singleEl.classList.remove('page-pulse');
        requestAnimationFrame(() => this.singleEl.classList.add('page-pulse'));
      } else {
        const count = this.leaves.length;
        this.leaves.forEach((leaf, i) => {
          const flipped = i < this.index;
          leaf.classList.toggle('is-flipped', flipped);
          leaf.classList.toggle('is-current', i === this.index && this.index < this.max);
          leaf.style.zIndex = String((flipped ? i + 2 : count - i + 2));
          if (!this.dragging || this.dragging.leaf !== leaf) leaf.style.removeProperty('transform');
        });
      }

      const left = this.index;
      const right = this.max - this.index;
      this.leftEl.textContent = `左侧 ${left} 页`;
      this.rightEl.textContent = `右侧 ${right} 页`;
      this.folioEl.textContent = this.index === 0 ? '封面' : this.index === this.max ? '封底' : `${this.index} / ${this.max}`;
      this.prev.disabled = this.index <= 0;
      this.next.disabled = this.index >= this.max;
      this.progress.max = String(this.max);
      this.progress.value = String(this.index);
      this.progress.style.setProperty('--progress', `${(this.index / max) * 100}%`);
      this.progress.setAttribute('aria-valuetext', this.folioEl.textContent);
      this.root.setAttribute('aria-label', `${this.book.title}，${this.folioEl.textContent}`);
    }

    toggleZoom() {
      const enlarged = this.root.classList.toggle('is-enlarged');
      this.zoomBtn.textContent = enlarged ? '缩小' : '放大';
      this.zoomBtn.setAttribute('aria-pressed', String(enlarged));
    }

    startDrag(event) {
      if (!this.isOpen || event.button !== 0 || event.target.closest('button')) return;
      const rect = this.bookEl.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      const forward = event.clientX >= (rect.left + rect.right) / 2;
      if ((forward && this.index >= this.max) || (!forward && this.index <= 0)) return;
      this.dragging = { x: event.clientX, time: performance.now(), forward, moved: 0 };
      if (!this.isMobile) {
        this.dragging.leaf = this.leaves[forward ? this.index : this.index - 1];
        this.dragging.leaf.style.transition = 'none';
        this.dragging.leaf.classList.add(forward ? 'is-dragging' : 'is-dragging-back');
        this.preparePageCurl(this.dragging.leaf, forward);
      }
      this.bookEl.setPointerCapture(event.pointerId);
    }

    moveDrag(event) {
      if (!this.dragging) return;
      const width = this.bookEl.getBoundingClientRect().width / (this.isMobile ? 1 : 2);
      const delta = event.clientX - this.dragging.x;
      const progress = clamp((this.dragging.forward ? -delta : delta) / Math.max(width, 1), 0, 1);
      this.dragging.progress = progress;
      this.dragging.moved = Math.max(this.dragging.moved, Math.abs(delta));
      if (this.dragging.leaf) {
        const degrees = this.dragging.forward ? -180 * progress : -180 + 180 * progress;
        this.dragging.leaf.style.transform = `rotateY(${degrees}deg)`;
        this.dragging.leaf.style.setProperty('--curl-size', `${20 + progress * width * .22}px`);
        this.dragging.leaf.style.setProperty('--curl-opacity', String(.38 + progress * .62));
        this.dragPageCurl(progress, this.dragging.forward);
      }
    }

    endDrag(event) {
      if (!this.dragging) return;
      const drag = this.dragging;
      this.dragging = null;
      const velocity = drag.moved / Math.max(performance.now() - drag.time, 1);
      const complete = (drag.progress || 0) > .22 || (drag.moved > 34 && velocity > .35);
      if (drag.leaf) {
        drag.leaf.style.removeProperty('transition');
        drag.leaf.style.removeProperty('transform');
        drag.leaf.style.removeProperty('--curl-size');
        drag.leaf.style.removeProperty('--curl-opacity');
        drag.leaf.classList.remove('is-dragging', 'is-dragging-back');
      }
      this.resetPageCurl();
      if (complete) this.goto(this.index + (drag.forward ? 1 : -1));
      else this.paint();
      if (drag.moved > 6) {
        this.ignoreClick = true;
        setTimeout(() => { this.ignoreClick = false; }, 80);
      }
      try { this.bookEl.releasePointerCapture(event.pointerId); } catch (_) { /* pointer already released */ }
    }

    bind() {
      this.prev.addEventListener('click', () => this.goto(this.index - 1));
      this.next.addEventListener('click', () => this.goto(this.index + 1));
      this.closeBtn.addEventListener('click', () => this.close());
      this.zoomBtn.addEventListener('click', () => this.toggleZoom());
      this.progress.addEventListener('input', () => this.goto(Number(this.progress.value)));
      this.bookEl.addEventListener('pointerdown', (event) => this.startDrag(event));
      this.bookEl.addEventListener('pointermove', (event) => this.moveDrag(event));
      this.bookEl.addEventListener('pointerup', (event) => this.endDrag(event));
      this.bookEl.addEventListener('pointercancel', (event) => this.endDrag(event));
      this.bookEl.addEventListener('click', (event) => {
        if (this.ignoreClick || event.detail > 1) return;
        clearTimeout(this.clickTimer);
        this.clickTimer = setTimeout(() => {
          const rect = this.bookEl.getBoundingClientRect();
          this.goto(this.index + (event.clientX < (rect.left + rect.right) / 2 ? -1 : 1));
        }, 220);
      });
      this.bookEl.addEventListener('dblclick', (event) => {
        event.preventDefault();
        clearTimeout(this.clickTimer);
        this.toggleZoom();
      });
      addEventListener('keydown', (event) => {
        if (!this.isOpen) return;
        if (event.key === 'Escape') this.close();
        else if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); this.goto(this.index + 1); }
        else if (event.key === 'ArrowLeft') this.goto(this.index - 1);
      });
      addEventListener('resize', () => {
        if (!this.isOpen || this.mobile === this.isMobile) return;
        const oldRatio = this.index / Math.max(this.max, 1);
        this.bookEl.querySelector('.single-sheet')?.remove();
        this.mount();
        this.index = Math.round(oldRatio * this.max);
        this.paint();
      }, { passive: true });
    }
  }

  const books = (window.ACAN_CATALOG || []).map((book) => ({ ...book, contents: [...(book.pages || [])] }))
    .sort((a, b) => a.timestamp - b.timestamp);
  const reader = new MagazineReader();
  const grid = $('book-grid');
  const archiveDetail = $('archive-detail');
  let activeArchive = null;

  grid.innerHTML = books.map((book, index) => {
    const [x, y, rotation, scale, z] = PLACEMENTS[index % PLACEMENTS.length];
    return `<button class="book-card" type="button" role="listitem" data-id="${esc(book.id)}"
      aria-label="打开《${esc(book.title)}》" style="--x:${x}%;--y:${y}%;--r:${rotation}deg;--s:${scale};--z:${z};--delay:${index * 70}ms">
      <span class="book-card__cover">
        <img src="${esc(book.cover || PLACEHOLDER)}" alt="${esc(book.title)}封面" draggable="false">
      </span>
      <span class="book-card__label">${esc(book.title)}</span>
      <time class="book-card__date">${esc(book.date)}</time>
    </button>`;
  }).join('');
  $('library-count').textContent = `${books.length} VOLUMES · ACAN ARCHIVE`;

  const library = $('library');

  function openArchive(book, updateHistory = true) {
    activeArchive = book;
    $('archive-cover').innerHTML = image(book.cover || PLACEHOLDER, `${book.title}封面`);
    $('archive-date').textContent = book.date;
    $('archive-title').textContent = book.title;
    $('archive-intro').textContent = book.intro || '收录这期杂志的封面与完整内页。';
    const gallery = [book.cover, ...(book.pages || []), ...(book.backCover ? [book.backCover] : [])].filter(Boolean);
    $('archive-page-count').textContent = `${gallery.length} 张图片`;
    $('archive-thumbs').innerHTML = gallery.map((src, index) => `
      <figure class="archive-thumb">${image(src, `${book.title} 图片 ${index + 1}`)}</figure>`).join('');
    library.hidden = true;
    archiveDetail.hidden = false;
    scrollTo({ top: 0, behavior: 'instant' });
    if (updateHistory) history.pushState({ book: book.id, mode: 'detail' }, '', `#detail=${encodeURIComponent(book.id)}`);
    $('archive-back').focus({ preventScroll: true });
  }

  function closeArchive(updateHistory = true) {
    if (archiveDetail.hidden) return;
    archiveDetail.hidden = true;
    library.hidden = false;
    activeArchive = null;
    scrollTo({ top: 0, behavior: 'instant' });
    if (updateHistory && location.hash) history.pushState({}, '', location.pathname);
  }

  $('archive-back').addEventListener('click', () => closeArchive());
  $('archive-read').addEventListener('click', () => {
    if (activeArchive) reader.open(activeArchive);
  });
  document.querySelectorAll('[data-view-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.viewButton;
      library.dataset.view = view;
      document.querySelectorAll('[data-view-button]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item === button));
      });
    });
  });

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.book-card');
    const book = books.find((item) => item.id === card?.dataset.id);
    if (!book) return;
    if (library.dataset.view === 'room') reader.open(book);
    else openArchive(book);
  });
  document.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement && !event.target.dataset.failed) {
      event.target.dataset.failed = 'true';
      event.target.src = PLACEHOLDER;
    }
  }, true);
  document.querySelector('.wordmark').addEventListener('click', (event) => {
    if (reader.isOpen) { event.preventDefault(); reader.close(); }
    else if (!archiveDetail.hidden) { event.preventDefault(); closeArchive(); }
  });
  addEventListener('popstate', () => {
    const match = location.hash.match(/^#(read|detail)=(.+)$/);
    const book = match && books.find((item) => item.id === decodeURIComponent(match[2]));
    if (book && match[1] === 'read') reader.open(book, false);
    else if (book) { reader.close(false); openArchive(book, false); }
    else { reader.close(false); closeArchive(false); }
  });

  const initialMatch = location.hash.match(/^#(read|detail)=(.+)$/);
  const initial = initialMatch && books.find((book) => book.id === decodeURIComponent(initialMatch[2]));
  if (initial && initialMatch[1] === 'read') reader.open(initial, false);
  else if (initial) openArchive(initial, false);
}());
