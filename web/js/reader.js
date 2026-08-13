/* 取书 → 翻开 → 翻页 → 放回 */

import { renderPage, coverHtml, esc } from './templates.js';

const raf = () => new Promise((r) => requestAnimationFrame(r));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const FLY = 900;   // 飞出书架 + 转到正面
const FADE = 200;  // 3D 书本与阅读器的交叉淡入

export class Reader {
  constructor(els) {
    Object.assign(this, els);
    this.isOpen = false;
    this.busy = false;
    this.index = 0;
    this.bind();
  }

  /* ------------------------------------------------------------ 几何 */

  pickMode() {
    // 摊开是两页，窄屏或竖屏放不下，退回单页
    return innerWidth >= 860 && innerWidth > innerHeight ? 'spread' : 'single';
  }

  size(book) {
    const f = book.cfg.form;
    const h = this.mode === 'spread'
      ? Math.min(innerHeight * 0.80, (innerWidth * 0.90) / (2 * f.width))
      : Math.min(innerHeight * 0.82, (innerWidth * 0.94) / f.width);
    return { h, w: h * f.width, t: h * f.thickness };
  }

  applyVars(book, s) {
    const st = this.stage.style;
    for (const [k, v] of Object.entries(book.cfg.theme)) st.setProperty(k, v);
    st.setProperty('--h', `${s.h}px`);
    st.setProperty('--w', `${s.w}px`);
    st.setProperty('--t', `${s.t}px`);
    st.setProperty('--u', `${s.h / 100}px`);
  }

  /* ------------------------------------------------------------ 构建 */

  mount(book) {
    const { cfg, meta } = book;

    this.box.dataset.spine = cfg.spineMode || 'vertical';
    this.box.innerHTML = `
      <span class="face face--spine">
        <span class="art">${cfg.spineArt()}</span>
        <span class="spine__title">${esc(meta.title)}</span>
      </span>
      <span class="face face--fore"></span>
      <span class="face face--front">${coverHtml(book)}</span>
      <span class="face face--back"></span>
      <span class="face face--top"></span>`;

    const cover = `<div class="pg pg--cover">${coverHtml(book)}</div>`;

    if (this.mode === 'spread') {
      // pages[0] 是封面内页（空白衬页），pages[1] 是扉页，之后是内容页。
      // 总数须为奇数，才能两两配成一叶。
      const pages = [{ t: 'endpaper' }, { t: 'title' }, ...cfg.pages];
      while (pages.length % 2 === 0) pages.push({ t: 'endpaper' });

      const leaves = [{ front: cover, back: renderPage(pages[0], book, 0) }];
      for (let i = 1; i < pages.length; i += 2) {
        leaves.push({
          front: renderPage(pages[i], book, i),
          back: renderPage(pages[i + 1], book, i + 1),
        });
      }

      this.host.innerHTML = `
        <div class="stack stack--left"></div>
        <div class="stack stack--right"></div>
        <div class="gutter"></div>
        ${leaves.map((L) => `
          <div class="leaf">
            <div class="leaf__face leaf__face--front">${L.front}</div>
            <div class="leaf__face leaf__face--back">${L.back}</div>
          </div>`).join('')}`;

      this.leaves = [...this.host.querySelectorAll('.leaf')];
      this.max = this.leaves.length - 1;
    } else {
      // 单页模式跳过空白衬页，翻开即扉页
      const pages = [{ t: 'title' }, ...cfg.pages];
      const slides = [cover, ...pages.map((p, i) => renderPage(p, book, i + 1, 'single'))];
      this.host.innerHTML =
        `<div class="single"><div class="strip">${
          slides.map((s) => `<div class="slide">${s}</div>`).join('')
        }</div></div>`;
      this.strip = this.host.querySelector('.strip');
      this.max = slides.length - 1;
    }

    this.index = 0;
    this.paint();
  }

  /* ------------------------------------------------------------ 翻页 */

  paint() {
    if (this.mode === 'spread') {
      const n = this.leaves.length;
      this.leaves.forEach((leaf, k) => {
        const flipped = k < this.index;
        leaf.classList.toggle('is-flipped', flipped);
        leaf.style.zIndex = String((flipped ? k + 1 : n - k) + 2);
      });
      this.host.style.setProperty('--shift', this.index > 0 ? 'calc(var(--w) / 2)' : '0px');
    } else {
      this.strip.style.setProperty('--i', this.index);
    }

    this.reader.classList.toggle('is-open', this.index > 0);
    this.folioEl.textContent = `${this.index} / ${this.max}`;
    this.prevBtn.disabled = this.index <= 1;
    this.nextBtn.disabled = this.index >= this.max;
  }

  goto(i, allowClosed = false) {
    if (!this.isOpen && !allowClosed) return;
    this.index = clamp(i, allowClosed ? 0 : 1, this.max);
    this.paint();
  }

  /* ------------------------------------------------------------ 开合 */

  async open(book, bookEl) {
    if (this.busy || this.isOpen) return;
    this.busy = true;
    this.book = book;
    this.bookEl = bookEl;
    this.mode = this.pickMode();

    this.applyVars(book, this.size(book));
    this.mount(book);

    const r = bookEl.querySelector('.face--spine').getBoundingClientRect();
    const s = r.height / parseFloat(this.stage.style.getPropertyValue('--h'));

    this.stage.hidden = false;
    this.pers.style.opacity = '1';
    this.reader.hidden = false;
    this.reader.classList.remove('is-visible', 'is-open');
    bookEl.classList.add('is-away');
    document.body.classList.add('is-reading');

    this.fly(
      r.left + r.width / 2 - innerWidth / 2,
      r.top + r.height / 2 - innerHeight / 2,
      s, 0, 'none',
    );
    await raf(); await raf();

    this.stage.classList.add('is-lit');
    this.fly(0, 0, 1, -90, `transform ${FLY}ms cubic-bezier(.32,.66,.18,1)`);
    await wait(FLY + 40);

    this.reader.classList.add('is-visible');
    this.pers.style.opacity = '0';
    await wait(FADE);

    this.isOpen = true;
    this.goto(1);

    this.hud.hidden = false;
    this.closeBtn.hidden = false;
    await raf();
    this.hud.classList.add('is-visible');
    this.closeBtn.classList.add('is-visible');
    this.busy = false;
  }

  async close() {
    if (this.busy || !this.isOpen) return;
    this.busy = true;
    this.isOpen = false;

    this.hud.classList.remove('is-visible');
    this.closeBtn.classList.remove('is-visible');

    this.goto(0, true);          // 合上封面
    await wait(760);

    this.pers.style.opacity = '1';
    this.reader.classList.remove('is-visible');
    await wait(FADE);
    this.reader.hidden = true;

    const r = this.bookEl.querySelector('.face--spine').getBoundingClientRect();
    const s = r.height / parseFloat(this.stage.style.getPropertyValue('--h'));
    this.stage.classList.remove('is-lit');
    document.body.classList.remove('is-reading');
    this.fly(
      r.left + r.width / 2 - innerWidth / 2,
      r.top + r.height / 2 - innerHeight / 2,
      s, 0, 'transform 780ms cubic-bezier(.42,.02,.28,1)',
    );
    await wait(800);

    this.stage.hidden = true;
    this.hud.hidden = true;
    this.closeBtn.hidden = true;
    this.bookEl.classList.remove('is-away', 'is-lifted');
    this.bookEl.focus({ preventScroll: true });
    this.busy = false;
  }

  fly(dx, dy, scale, deg, transition) {
    this.flip.style.transition = transition;
    this.box.style.transition = transition;
    this.flip.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    this.box.style.transform = `rotateY(${deg}deg)`;
  }

  /* ------------------------------------------------------------ 交互 */

  bind() {
    this.prevBtn.addEventListener('click', () => this.goto(this.index - 1));
    this.nextBtn.addEventListener('click', () => this.goto(this.index + 1));
    this.closeBtn.addEventListener('click', () => this.close());

    addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { this.close(); }
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); this.goto(this.index + 1); }
      else if (e.key === 'ArrowLeft') { this.goto(this.index - 1); }
    });

    // 点书页左右半边翻页，点书外放回书架
    this.reader.addEventListener('click', (e) => {
      if (this.swiped) { this.swiped = false; return; }
      if (!this.isOpen || this.busy || e.target.closest('a')) return;
      const b = this.spreadBounds();
      const inside = e.clientX >= b.left && e.clientX <= b.right
        && e.clientY >= b.top && e.clientY <= b.bottom;
      if (!inside) { this.close(); return; }
      this.goto(this.index + (e.clientX < (b.left + b.right) / 2 ? -1 : 1));
    });

    // 滑动翻页
    let x0 = null;
    this.reader.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    this.reader.addEventListener('pointerup', (e) => {
      if (x0 === null || !this.isOpen) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 44) {
        this.swiped = true;
        this.goto(this.index + (dx < 0 ? 1 : -1));
      }
    });

    addEventListener('resize', () => this.onResize(), { passive: true });
  }

  spreadBounds() {
    const r = this.host.getBoundingClientRect();
    const left = this.mode === 'spread' && this.index > 0 ? r.left - r.width : r.left;
    return { left, right: r.right, top: r.top, bottom: r.bottom };
  }

  onResize() {
    if (!this.isOpen || this.busy) return;
    const next = this.pickMode();
    const keep = this.index;
    if (next !== this.mode) {
      this.mode = next;
      this.applyVars(this.book, this.size(this.book));
      this.mount(this.book);
      this.isOpen = true;
      this.goto(keep);
    } else {
      this.applyVars(this.book, this.size(this.book));
    }
  }
}
