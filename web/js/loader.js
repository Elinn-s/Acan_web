/* 读取 web/data/books 下的书目：manifest -> info.txt + config/style.js */

const BASE = 'data/books';

export async function loadLibrary() {
  const res = await fetch(`${BASE}/manifest.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`读不到 manifest.json（${res.status}）`);
  const { books = [] } = await res.json();
  return Promise.all(books.map(loadBook));
}

async function loadBook(id) {
  const [mod, txt] = await Promise.all([
    import(`../${BASE}/${id}/config/style.js`),
    fetch(`${BASE}/${id}/info.txt`, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`${id}/info.txt 缺失`);
      return r.text();
    }),
  ]);

  const cfg = mod.default;
  const [title = '', date = '', intro = '', note = ''] = txt
    .replace(/\r/g, '')
    .split('\n')
    .map((s) => s.trim());

  return {
    id,
    cfg,
    meta: { title, date, intro, note },
    img: (n) => `${BASE}/${id}/images/${cfg.images[n] ?? cfg.images[0]}`,
  };
}
