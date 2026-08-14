/* 只读取 manifest/meta JSON，不读取任何 magazine 图片。 */

const BASE = 'data/magazines';
const PLACEHOLDER = 'assets/blank.svg';

/**
 * 图片源的唯一入口。当前统一使用空白占位图。
 * 需要接入图片时，将返回值改为 `file.source` 即可，不必改组件代码。
 */
export function imageSource(file) {
  // URL 片段让每张占位图拥有独立标识，查看器仍能正确定位上一/下一张。
  return `${PLACEHOLDER}#${encodeURIComponent(file?.source || 'blank')}`;
  // return file.source;
}

export async function loadLibrary() {
  const res = await fetch(`${BASE}/manifest.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`读不到 manifest.json（${res.status}）`);
  const { magazines = [] } = await res.json();
  const books = await Promise.all(magazines.map(loadBook));
  return books.sort((a, b) => a.timestamp - b.timestamp);
}

async function loadBook(id) {
  const dir = `${BASE}/${id}`;
  const res = await fetch(`${dir}/meta.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${id}/meta.json 缺失（${res.status}）`);
  const meta = await res.json();

  const covers = (meta.covers || []).map((file, index) => ({
    ...file,
    kind: 'cover',
    label: index === 0 ? '封面' : `封面 ${index + 1}`,
    source: `${dir}/${file.src}`,
  }));
  const pages = (meta.pages || []).map((file, index) => ({
    ...file,
    kind: file.group ? 'extra' : 'page',
    label: file.group || `正片 ${index + 1}`,
    source: `${dir}/${file.src}`,
  }));

  return {
    id,
    timestamp: Number(meta.ts) || dateNumber(meta.date),
    title: meta.title || id,
    masthead: meta.masthead || '',
    date: meta.date || '',
    intro: meta.intro || '',
    note: meta.note || '',
    covers,
    images: [...covers, ...pages],
  };
}

function dateNumber(value = '') {
  return Number(String(value).replace(/\D/g, '')) || 0;
}
