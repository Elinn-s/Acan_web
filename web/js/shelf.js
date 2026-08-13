/* 书架：布局、悬停抬起、点击取书 */

import { esc, coverHtml } from './templates.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export class Shelf {
  constructor({ inner, row, books, onOpen }) {
    this.inner = inner;
    this.row = row;
    this.books = books;
    this.onOpen = onOpen;
    this.els = [];
  }

  render() {
    this.row.innerHTML = '';
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
            <span class="art">${book.cfg.spineArt()}</span>
            <span class="spine__title">${esc(book.meta.title)}</span>
            <span class="spine__no">${String(i + 1).padStart(2, '0')}</span>
            <span class="spine__glow"></span>
          </span>
          <span class="face face--fore"></span>
          <span class="face face--front">${coverHtml(book)}</span>
          <span class="face face--back"></span>
          <span class="face face--top"></span>
          <span class="book__shadow"></span>
          <span class="book__pool"></span>
        </span>`;

      el.addEventListener('click', (e) => this.onClick(e, book, el));
      this.row.appendChild(el);
      return el;
    });

    this.layout();
    addEventListener('resize', () => this.layout(), { passive: true });

    // 点空处收回抬起的书
    this.inner.addEventListener('click', (e) => {
      if (!e.target.closest('.book')) this.lift(null);
    });
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
      el.style.setProperty('--h', `${Math.round(d.h)}px`);
      el.style.setProperty('--t', `${Math.max(16, Math.round(d.t * k))}px`);
      el.style.setProperty('--w', `${Math.round(d.w)}px`);
    });
  }
}
