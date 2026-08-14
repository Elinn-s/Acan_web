import { esc } from './templates.js';
import { imageSource } from './loader.js';

export function renderShelf(root, books, onOpen) {
  root.innerHTML = books.map((book, index) => {
    const cover = book.covers[0];
    return `<button class="book-card" type="button" role="listitem"
      data-id="${esc(book.id)}" aria-label="打开《${esc(book.title)}》"
      style="--delay:${index * 45}ms">
      <span class="book-card__cover image-frame">
        <img src="${imageSource(cover)}" data-source="${esc(cover?.source || '')}"
          alt="${esc(book.title)}封面占位图" loading="lazy">
        <span class="image-placeholder" aria-hidden="true"></span>
      </span>
      <span class="book-card__title">${esc(book.title)}</span>
      <time class="book-card__date">${esc(book.date)}</time>
    </button>`;
  }).join('');

  root.addEventListener('click', (event) => {
    const card = event.target.closest('.book-card');
    if (!card) return;
    const book = books.find((item) => item.id === card.dataset.id);
    if (book) onOpen(book);
  });
}
