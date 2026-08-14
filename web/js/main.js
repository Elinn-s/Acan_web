import { loadLibrary } from './loader.js';
import { renderShelf } from './shelf.js';
import { Reader } from './reader.js';
import { Zoom } from './zoom.js';

const $ = (id) => document.getElementById(id);

try {
  const books = await loadLibrary();
  if (!books.length) throw new Error('manifest.json 里没有书目');

  const zoom = new Zoom({
    root: $('zoom'), view: $('zoom-view'), img: $('zoom-img'), counter: $('zoom-count'),
    prevBtn: $('zoom-prev'), nextBtn: $('zoom-next'), closeBtn: $('zoom-close'),
  });
  const reader = new Reader({
    root: $('detail'), cover: $('detail-cover'), meta: $('detail-meta'), grid: $('thumb-grid'),
    count: $('gallery-count'), back: $('back'), onZoom: (src, list) => zoom.open(src, list),
  });

  renderShelf($('book-grid'), books, (book) => reader.open(book));
  $('library-count').textContent = `${books.length} 本 · 按日期从早到晚`;

  const initialId = decodeURIComponent(location.hash.slice(1));
  const initialBook = books.find((book) => book.id === initialId);
  if (initialBook) reader.open(initialBook);
} catch (error) {
  console.error(error);
  $('fallback').hidden = false;
  $('fallback').innerHTML = `书柜加载失败：${error.message}<br>请通过 <code>start.bat</code> 或 <code>node web/server.js</code> 启动。`;
}
