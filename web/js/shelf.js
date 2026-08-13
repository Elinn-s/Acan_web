/* 书架：布局、悬停抬起、点击取书；序号做成贴在隔板上的标签 */

import { esc, coverHtml, spineFontSize } from './templates.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export class Shelf {
  constructor({ inner, row, tags, books, onOpen }) {
    this.inner = inner;
    this.row = row;
    this.tags = tags;
    this.books = books;
    this.onOpen = onOpen;
    this.els = [];
    this.tagEls = [];
  }

  render() {
    this.row.innerHTML = '';
    this.tags.innerHTML = '';

    this.els = this.books.map((book, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'book';
      el.setAttribute('role', 'listitem');
      el.dataset.spine = book.cfg.spineMode || 'vertical';
      el.setAttribute('aria-label', `${book.meta.title}，${book.meta.date}`);
      for (const [k, v] of Object.entries(book.cfg.theme)) el.style.setProperty(k, v);

      el.innerHTML = `
        <span class="book__box">
          <span class="face face--spine">
            <span class="spine__title">${esc(book.meta.title)}</span>
            <span class="spine__glow"></span>
          </span>
          <span class="face face--fore"></span>
          <span class="face face--front">${coverHtml(book, book.shelfCover)}</span>
          <span class="face face--back"></span>
          <span class="face face--top"></span>
          <span class="book__shadow"></span>
          <span class="book__pool"></span>
        </span>`;

      el.addEventListener('click', (e) => this.onClick(e, book, el));
      el.addEventListener('pointerenter', () => this.mark(i, true));
      el.addEventListener('pointerleave', () => this.mark(i, false));
      el.addEventListener('focus', () => this.mark(i, true));
      el.addEventListener('blur', () => this.mark(i, false));
      this.row.appendChild(el);
      return el;
    });

    // 隔板上的序号标签，位置在 layout() 里对着书脊贴
    this.tagEls = this.books.map((_, i) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.setAttribute('aria-hidden', 'true');
      tag.textContent = String(i + 1).padStart(2, '0');
      tag.style.setProperty('--tilt', `${((i * 37) % 9) - 4}deg`);
      this.tags.appendChild(tag);
      return tag;
    });

    this.layout();
    addEventListener('resize', () => this.layout(), { passive: true });

    // 点空处收回抬起的书
    this.inner.addEventListener('click', (e) => {
      if (!e.target.closest('.book')) this.lift(null);
    });
  }

  mark(i, on) {
    this.tagEls[i]?.classList.toggle('is-on', on);
  }

  /** 触屏：第一次点抬起，第二次点取出；鼠标：直接取出 */
  onClick(e, book, el) {
    const coarse = matchMedia('(hover: none)').matches;
    if (coarse && !el.classList.contains('is-lifted')) {
      this.lift(el);
      return;
    }
    this.onOpen(book, el);
  }

  lift(target) {
    for (const el of this.els) el.classList.toggle('is-lifted', el === target);
    this.els.forEach((el, i) => this.mark(i, el === target));
  }

  layout() {
    const boxH = this.inner.clientHeight;
    const boxW = this.inner.clientWidth;
    if (!boxH || !boxW) return;

    const gapBase = clamp(boxH * 0.022, 6, 20);
    const dims = this.books.map((b) => {
      const h = b.cfg.form.height * boxH * 0.92;
      return { h, t: b.cfg.form.thickness * h, w: b.cfg.form.width * h };
    });

    const n = dims.length;
    const natural = dims.reduce((s, d) => s + d.t, 0) + gapBase * (n - 1);
    const avail = boxW * 0.86;
    const k = natural > avail ? avail / natural : 1;

    this.row.style.setProperty('--gap', `${gapBase * k}px`);
    dims.forEach((d, i) => {
      const el = this.els[i];
      const t = Math.max(16, Math.round(d.t * k));
      el.style.setProperty('--h', `${Math.round(d.h)}px`);
      el.style.setProperty('--t', `${t}px`);
      el.style.setProperty('--w', `${Math.round(d.w)}px`);
      el.style.setProperty('--spine-fs', `${spineFontSize(this.books[i], t, d.h)}px`);
    });

    // 书脊立在 translateZ 上，透视会把它推得比平面布局更靠外，
    // 所以标签位置直接问浏览器要书脊投影后的实际位置，别自己算。
    requestAnimationFrame(() => {
      const base = this.tags.getBoundingClientRect();
      if (!base.width) return;
      this.els.forEach((el, i) => {
        const r = el.querySelector('.face--spine').getBoundingClientRect();
        this.tagEls[i].style.left = `${r.left + r.width / 2 - base.left}px`;
      });
    });
  }
}
