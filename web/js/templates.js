/* 页面版式模板 —— config/style.js 里的 pages 序列会被翻译成这里的 HTML */

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const anchor = (url, text) =>
  `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;

/** 支持 [文字](链接) 与裸链接；先转义再替换，避免注入 */
export function linkify(raw = '') {
  return esc(raw)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => anchor(url, text))
    .replace(/(^|[\s(（])((?:https?:\/\/|mailto:)[^\s<)）]+)/g,
      (_, pre, url) => pre + anchor(url, url));
}

export function coverHtml(book) {
  return `<span class="cover">
    <span class="art">${book.cfg.coverArt()}</span>
    <span class="cover__title">${esc(book.meta.title)}</span>
    <span class="cover__rule"></span>
    <span class="cover__date">${esc(book.meta.date)}</span>
  </span>`;
}

/**
 * @param {object} p     页面描述（config.pages 里的一项）
 * @param {object} book  书对象
 * @param {number} i     在 pages 数组中的下标，决定左右页与页码
 * @param {'spread'|'single'} mode
 */
export function renderPage(p, book, i, mode = 'spread') {
  const side = mode === 'single' ? 'single' : (i % 2 === 0 ? 'left' : 'right');
  const folio = (p.t === 'endpaper' || i === 0)
    ? ''
    : `<span class="pg__folio">${String(i).padStart(2, '0')}</span>`;
  return `<div class="pg pg--${p.t} pg--${side}">${body(p, book)}${folio}</div>`;
}

const img = (book, n, alt = '') =>
  `<div class="ph"><img src="${book.img(n)}" alt="${esc(alt)}" loading="lazy" draggable="false"></div>`;

function body(p, book) {
  const m = book.meta;

  switch (p.t) {
    case 'endpaper':
      return `<div class="wash"></div>`;

    case 'title':
      return `<div class="pg__body">
        <h2 class="t-title">${esc(m.title)}</h2>
        <div class="t-rule"></div>
        <div class="t-date">${esc(m.date)}</div>
        <p class="t-intro">${esc(m.intro)}</p>
        <p class="t-note">${linkify(m.note)}</p>
      </div>`;

    case 'full':
      return `${img(book, p.img, p.cap || m.title)}
        ${p.cap ? `<div class="cap">${esc(p.cap)}</div>` : ''}`;

    case 'plate':
      return `<div class="pg__body">
        ${img(book, p.img, p.cap || '')}
        <div class="plate__foot">
          ${p.no ? `<span class="plate__no">${esc(p.no)}</span>` : ''}
          <span>${esc(p.cap || '')}</span>
        </div>
      </div>`;

    case 'caption':
      return `<div class="pg__body">
        ${img(book, p.img, p.head || '')}
        <h3 class="cap__head">${esc(p.head || '')}</h3>
        <p class="cap__body">${esc(p.body || '')}</p>
      </div>`;

    case 'quote':
      return `<div class="pg__body">
        <blockquote class="q">${esc(p.text || '')}</blockquote>
        ${p.by ? `<div class="q__by">${esc(p.by)}</div>` : ''}
      </div>`;

    case 'duo':
      return `<div class="pg__body">
        ${p.imgs.map((n) => img(book, n)).join('')}
        ${p.cap ? `<div class="cap">${esc(p.cap)}</div>` : ''}
      </div>`;

    case 'grid3':
      return `<div class="pg__body"><div class="grid3">
        ${img(book, p.imgs[0])}
        <div class="grid3__row">${img(book, p.imgs[1])}${img(book, p.imgs[2])}</div>
      </div></div>`;

    case 'colophon':
      return `<div class="pg__body">
        <div class="col__end">完</div>
        <dl>
          <dt>${esc(m.title)}</dt>
          <dd>${esc(m.date)}</dd>
          <dd>${linkify(m.note)}</dd>
        </dl>
      </div>`;

    default:
      return `<div class="pg__body"></div>`;
  }
}
