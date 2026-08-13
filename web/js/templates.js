/* 页面版式模板 —— loader.js 排好的 pages 序列会被翻译成这里的 HTML */

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

// 用 span 而不是 div：书架上那本书的各个面本身就是 span，div 塞进去不合法
// data-zoom 是给 zoom.js 认的，点一下就放大看原图
const img = (src, alt = '', eager = false) =>
  `<span class="ph" data-zoom="${src}"><img src="${src}" alt="${esc(alt)}"
    loading="${eager ? 'eager' : 'lazy'}" draggable="false"></span>`;

const TRACKING = 0.28;               // 与 --spine-tracking 保持一致
const CJK = /[⺀-鿿豈-﫿︰-﹏＀-￯]/;

/**
 * 书脊字号：既受书脊宽度 t 限制，也得让整个刊名在书脊长度 h 内排完。
 * 书架上的书和翻开前的那本用同一套算法，字才不会在飞出来的瞬间跳一下。
 *
 * 竖排（text-orientation: upright）每个字符都占满一个 em；
 * 横排躺倒时按字宽估，西文和空格比汉字窄不少。
 */
export function spineFontSize(book, t, h) {
  const chars = [...book.meta.title.trim()];
  const em = book.cfg.spineMode === 'rotate'
    ? chars.reduce((n, c) => n + (/\s/.test(c) ? 0.4 : CJK.test(c) ? 1 : 0.55) + TRACKING, 0)
    : chars.length * (1 + TRACKING);
  const px = Math.min(t * 0.38, (h * 0.74) / Math.max(1, em));
  return Math.min(48, Math.max(9, px));
}

/**
 * 封面就是真的封面照，刊名已经印在图上了，不再叠标题。
 * 书架上那一条斜边只需要缩略图，翻开后才换大图。
 */
export function coverHtml(book, src = book.cover.src) {
  return `<span class="cover">${img(src, `${book.meta.title} 封面`, true)}</span>`;
}

/**
 * @param {object} p     页面描述（cfg.pages 里的一项，spread 已在 reader 里拆成 bleedL/bleedR）
 * @param {object} book  书对象
 * @param {number} i     在页序列中的下标，决定左右页与页码
 * @param {'spread'|'single'} mode
 */
export function renderPage(p, book, i, mode = 'spread') {
  const side = mode === 'single' ? 'single' : (i % 2 === 0 ? 'left' : 'right');
  const folio = (p.t === 'endpaper' || i === 0)
    ? ''
    : `<span class="pg__folio">${String(i).padStart(2, '0')}</span>`;
  return `<div class="pg pg--${p.t} pg--${side}">${body(p, book)}${folio}</div>`;
}

function body(p, book) {
  const m = book.meta;

  switch (p.t) {
    case 'endpaper':
      return `<span class="wash"></span>`;

    /* 扉页：文件名做大标题，txt 里的刊名+期号落在最下面 */
    case 'title':
      return `<div class="pg__body">
        <h2 class="t-title">${esc(m.title)}</h2>
        <div class="t-rule"></div>
        <div class="t-date">${esc(m.date)}</div>
        <p class="t-intro">${esc(m.intro)}</p>
        <p class="t-mast">${linkify(m.masthead)}</p>
      </div>`;

    /* 竖图：铺满一页 */
    case 'full':
      return img(p.src, m.title);

    /* 横图落在右页时的退路：单页居中，不裁 */
    case 'wide':
      return `<div class="pg__body">${img(p.src, m.title)}</div>`;

    /* 横图跨中缝：同一张图，左页放左半、右页放右半 */
    case 'bleedL':
    case 'bleedR':
      return img(p.src, m.title);

    /* 花絮这类另起一节的隔页 */
    case 'section':
      return `<div class="pg__body">
        <div class="sec">
          <span class="sec__rule"></span>
          <span class="sec__label">${esc(p.label || '')}</span>
          <span class="sec__rule"></span>
        </div>
      </div>`;

    case 'colophon':
      return `<div class="pg__body">
        <div class="col__end">完</div>
        <dl>
          <dt>${esc(m.title)}</dt>
          <dd>${esc(m.date)}</dd>
          <dd>${linkify(m.masthead)}</dd>
        </dl>
      </div>`;

    default:
      return `<div class="pg__body"></div>`;
  }
}
