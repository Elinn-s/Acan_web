/* 读取 web/data/magazines：manifest -> 每本的 meta.json（由 web/tools/build-magazines.js 生成） */

const BASE = 'data/magazines';

export async function loadLibrary() {
  const res = await fetch(`${BASE}/manifest.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`读不到 manifest.json（${res.status}）`);
  const { magazines = [] } = await res.json();
  return Promise.all(magazines.map(load));
}

async function load(id) {
  const dir = `${BASE}/${id}`;
  const res = await fetch(`${dir}/meta.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${id}/meta.json 缺失（${res.status}）`);
  const m = await res.json();

  const covers = (m.covers || []).map((c) => ({ ...c, src: `${dir}/${c.src}` }));
  const pages = (m.pages || []).map((p) => ({ ...p, src: `${dir}/${p.src}` }));

  return {
    id,
    cover: covers[0],
    shelfCover: `${dir}/shelf.webp`,
    // masthead 是 txt 里「标题：」那行的刊名+期号；title 取的是 txt 文件名
    meta: {
      title: m.title,
      masthead: m.masthead || '',
      date: m.date,
      intro: m.intro,
      note: m.note || '',
    },
    cfg: {
      form: m.form,
      spineMode: spineMode(m.title),
      theme: m.theme || {},
      pages: layout(covers, pages),
    },
  };
}

/** 书脊上拉丁字母占多数时，竖着一个个立起来太难认，整行躺倒 */
function spineMode(title = '') {
  const letters = title.replace(/[\s·|]/g, '');
  const latin = (letters.match(/[A-Za-z0-9]/g) || []).length;
  return latin / Math.max(1, letters.length) > 0.75 ? 'rotate' : 'vertical';
}

/**
 * 图片序列 -> 内页版式。
 *
 * 顺序：正片 → 另一版封面（尾页）→ 完结页 → 花絮。
 *
 * 横图跨中缝铺满整个对开，但一张图跨两页的前提是它得落在左页上，
 * 所以一边排一边数页码：落在左页就跨页，落在右页就退回单页居中放，
 * 两种都不裁图。这样也不会为了对齐而插空白页。
 */
function layout(covers, pages) {
  const main = pages.filter((p) => !p.group);
  const extra = pages.filter((p) => p.group);

  const out = [];
  let n = 0;                                   // 已排页数；偶数说明下一页落在左页
  const put = (page, span = 1) => { out.push(page); n += span; };

  const photo = (p) => {
    if (p.o !== 'l') put({ t: 'full', src: p.src });
    else if (n % 2 === 0) put({ t: 'spread', src: p.src }, 2);
    else put({ t: 'wide', src: p.src });
  };

  for (const p of main) photo(p);
  for (let i = 1; i < covers.length; i++) put({ t: 'full', src: covers[i].src });
  put({ t: 'colophon' });

  if (extra.length) {
    put({ t: 'section', label: '花絮' });
    for (const p of extra) photo(p);
  }

  if (n % 2) put({ t: 'endpaper' });            // 凑成偶数，最后一叶才配得整齐
  return out;
}
