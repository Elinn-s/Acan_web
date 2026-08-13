import { loadLibrary } from './loader.js';
import { Shelf } from './shelf.js';
import { Reader } from './reader.js';
import { Zoom } from './zoom.js';

const $ = (id) => document.getElementById(id);

try {
  const books = await loadLibrary();
  if (!books.length) throw new Error('manifest.json 里一本书都没有');

  const zoom = new Zoom({
    root: $('zoom'),
    view: $('zoom-view'),
    img: $('zoom-img'),
    counter: $('zoom-count'),
    prevBtn: $('zoom-prev'),
    nextBtn: $('zoom-next'),
    closeBtn: $('zoom-close'),
  });

  const reader = new Reader({
    stage: $('stage'),
    pers: document.querySelector('.stage__pers'),
    flip: $('flip'),
    box: $('box'),
    reader: $('reader'),
    host: $('reader-book'),
    hud: $('hud'),
    prevBtn: $('prev'),
    nextBtn: $('next'),
    folioEl: $('folio'),
    closeBtn: $('close'),
    onZoom: (src, list) => zoom.open(src, list),
  });

  const shelf = new Shelf({
    inner: $('case-inner'),
    row: $('row'),
    tags: $('tags'),
    books,
    onOpen: (book, el) => {
      $('hint').style.opacity = '0';
      reader.open(book, el);
    },
  });

  shelf.render();
} catch (err) {
  console.error(err);
  const box = $('fallback');
  box.hidden = false;
  box.innerHTML = `书架没能装起来：${err.message}<br>请用 <code>start.bat</code> 或 <code>node web/server.js</code> 启动，直接打开 index.html 不行。`;
}
