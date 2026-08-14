import { esc, linkify } from './templates.js';
import { imageSource } from './loader.js';

export class Reader {
  constructor({ root, cover, meta, grid, count, back, onZoom }) {
    Object.assign(this, { root, cover, meta, grid, count, back, onZoom });
    this.back.addEventListener('click', () => this.close());
    this.root.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-image-index]');
      if (!trigger || !this.book) return;
      const index = Number(trigger.dataset.imageIndex);
      const sources = this.book.images.map(imageSource);
      this.onZoom(sources[index], sources);
    });
    addEventListener('popstate', () => this.close(false));
  }

  open(book) {
    this.book = book;
    const cover = book.covers[0];
    this.cover.innerHTML = imageButton(cover, 0, `${book.title}封面`);
    this.meta.innerHTML = `
      <p class="eyebrow">${esc(book.date)}</p>
      <h2 id="detail-title">${esc(book.title)}</h2>
      ${book.masthead ? `<p class="meta__masthead">${linkify(book.masthead)}</p>` : ''}
      ${book.intro ? `<p class="meta__intro">${linkify(book.intro)}</p>` : ''}
      ${book.note ? `<div class="meta__note"><span>备注</span><p>${linkify(book.note)}</p></div>` : ''}`;
    this.grid.innerHTML = book.images.map((image, index) => imageButton(
      image, index, `${book.title} · ${image.label}`, 'thumb',
    )).join('');
    this.count.textContent = `${book.images.length} 张`;
    document.getElementById('library').hidden = true;
    this.root.hidden = false;
    document.body.classList.add('is-detail');
    scrollTo({ top: 0, behavior: 'instant' });
    history.pushState({ book: book.id }, '', `#${encodeURIComponent(book.id)}`);
    this.back.focus({ preventScroll: true });
  }

  close(updateHistory = true) {
    if (this.root.hidden) return;
    this.root.hidden = true;
    document.getElementById('library').hidden = false;
    document.body.classList.remove('is-detail');
    this.book = null;
    scrollTo({ top: 0, behavior: 'instant' });
    if (updateHistory && location.hash) history.pushState({}, '', location.pathname);
    document.querySelector('.book-card')?.focus({ preventScroll: true });
  }
}

function imageButton(image, index, alt, className = 'cover-large') {
  return `<button class="image-button ${className}" type="button" data-image-index="${index}"
    aria-label="查看${esc(alt)}大图">
    <span class="image-frame">
      <img src="${imageSource(image)}" data-source="${esc(image?.source || '')}"
        alt="${esc(alt)}占位图" loading="lazy">
      <span class="image-placeholder" aria-hidden="true"></span>
    </span>
    ${className === 'thumb' ? `<span class="thumb__label">${esc(image.label)}</span>` : ''}
  </button>`;
}
