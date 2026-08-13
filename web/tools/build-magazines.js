/**
 * 把原始杂志素材压成站点能用的图集。
 *
 *   cd web/tools && npm install && node build-magazines.js
 *   node build-magazines.js CHIC        只重建名字里带 CHIC 的那本
 *
 * 输入  web/data/magazine/<YYYYMMDD 名称>/    原图（几百 MB，不进 git）
 *        ├─ 1.jpg 2.jpg          纯数字文件名 = 封面（A 封 / B 封）
 *        ├─ 名称 (1).jpg …        带序号 = 内页，按序号排
 *        ├─ 幕后1.jpg 预告.jpg     其余按文件名排在内页之后
 *        └─ 说明.txt              标题 / 时间 / 简介 / 备注 四行
 *
 * 输出  web/data/magazines/<id>/  webp 图 + meta.json（进 git，十几 MB）
 *        web/data/magazines/manifest.json  按日期从早到晚
 *
 * 版式（哪张图用哪种页面）交给前端 js/loader.js 决定，这里只出图和尺寸，
 * 所以调版式不用重新构建。
 */

'use strict';

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('缺 sharp。请先在 web/tools 里执行：npm install');
  process.exit(1);
}

const WEB = path.resolve(__dirname, '..');
const SRC = path.join(WEB, 'data', 'magazine');
const OUT = path.join(WEB, 'data', 'magazines');

/** 长边像素上限 */
const SIZE = { page: 1800, cover: 1600, shelf: 480 };
const Q = { page: 76, cover: 80, shelf: 82 };

/** 需要手调的书，按 id 覆盖自动值；先留空，等定风格时再填 */
const OVERRIDES = {
  // '2026-08-11-chic': { form: { height: 1.0 }, theme: { '--accent': '#c8a06a' } },
};

/* ------------------------------------------------------------------ 工具 */

const pad2 = (n) => String(n).padStart(2, '0');

const isImage = (f) => /\.(jpe?g|png|webp|heic|heif)$/i.test(f);

/** 20260811CHIC -> { id: '2026-08-11-chic', ts: 20260811 } */
function folderId(name) {
  const m = /^(\d{4})(\d{2})(\d{2})(.*)$/.exec(name);
  if (!m) throw new Error(`文件夹名要以 YYYYMMDD 开头：${name}`);
  const [, y, mo, d, rest] = m;
  const ascii = rest.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  return {
    id: `${y}-${mo}-${d}${ascii ? `-${ascii}` : ''}`,
    ts: Number(`${y}${mo}${d}`),
  };
}

/**
 * 分拣一个文件夹里的图：封面 / 内页 / 其余。
 * 其余那批（幕后1.jpg、预告.jpg…）按去掉尾号的名字分组，前端可以单独排版。
 */
function sortFiles(files) {
  const covers = [];
  const inner = [];
  const extras = [];

  for (const f of files) {
    const base = path.basename(f, path.extname(f));
    if (/^\d+$/.test(base)) {
      covers.push({ f, n: Number(base) });
      continue;
    }
    const m = /^(.*?)\s*\((\d+)\)$/.exec(base);
    if (m) {
      inner.push({ f, n: Number(m[2]) });
      continue;
    }
    const g = /^(.*?)(\d*)$/.exec(base);
    extras.push({ f, group: g[1].trim() || base, n: Number(g[2] || 0) });
  }

  covers.sort((a, b) => a.n - b.n);
  inner.sort((a, b) => a.n - b.n);
  extras.sort((a, b) => a.group.localeCompare(b.group, 'zh') || a.n - b.n);

  return {
    covers: covers.map((x) => x.f),
    pages: [
      ...inner.map((x) => ({ f: x.f, group: null })),
      ...extras.map((x) => ({ f: x.f, group: x.group })),
    ],
  };
}

/**
 * 标题取 txt 的文件名（书脊和扉页大字用它）；
 * txt 里的「标题：」是刊名+期号，放到扉页和结尾页的落款位置；
 * 「备注：」暂时不呈现，但留在 meta 里，想显示改一行前端就行。
 */
function readInfo(dir, files) {
  const txt = files.find((f) => /\.txt$/i.test(f));
  if (!txt) throw new Error(`${dir} 里没有说明 txt`);
  const raw = fs.readFileSync(path.join(dir, txt), 'utf8').replace(/^﻿/, '');
  const out = {
    title: path.basename(txt, path.extname(txt)).trim(),
    masthead: '', date: '', intro: '', note: '',
  };
  const key = { 标题: 'masthead', 时间: 'date', 简介: 'intro', 备注: 'note' };
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([^：:]+)\s*[：:]\s*(.*)$/.exec(line);
    if (m && key[m[1].trim()]) out[key[m[1].trim()]] = m[2].trim();
  }
  if (!out.title) throw new Error(`${txt} 的文件名是空的，标题取不到`);
  return out;
}

/* ------------------------------------------------------------------ 配色 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const hex = (r, g, b) =>
  '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return hex((t[0] + m) * 255, (t[1] + m) * 255, (t[2] + m) * 255);
}

/**
 * 书的颜色要跟一整本图的色系对应，所以封面和内页一起采样，
 * 封面算双倍权重（它毕竟是这本的门面）。
 * 取三个代表色：均值、暗部、最艳。
 */
async function palette(samples) {
  const px = [];
  for (const { file, weight } of samples) {
    const { data, info } = await sharp(file, { unlimited: true, failOn: 'none' })
      .resize(18, 18, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let w = 0; w < weight; w++) {
      for (let i = 0; i < data.length; i += info.channels) {
        px.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  }

  const n = px.length;
  const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  const mean = (list) => list.reduce(
    (a, p) => [a[0] + p[0] / list.length, a[1] + p[1] / list.length, a[2] + p[2] / list.length],
    [0, 0, 0],
  );

  // 暗部取最暗那 12% 的平均，比单挑一个最暗像素稳得多
  const sorted = [...px].sort((a, b) => lum(a) - lum(b));
  const dark = mean(sorted.slice(0, Math.max(1, Math.round(n * 0.12))));

  // 只在中间明度里找艳色，避免抓到高光或死黑
  const mid = px.filter((p) => { const l = lum(p) / 255; return l > 0.14 && l < 0.86; });
  const sat = (p) => rgb2hsl(...p)[1];
  const vivid = (mid.length ? mid : px).reduce((a, p) => (sat(p) > sat(a) ? p : a));

  return { avg: mean(px), dark, vivid };
}

function theme({ avg, dark, vivid }) {
  const [ah, as] = rgb2hsl(...avg);
  const [vh, vs] = rgb2hsl(...vivid);
  const [dh, ds, dl] = rgb2hsl(...dark);

  const spineL = clamp(dl + 0.16, 0.16, 0.42);
  const spineS = clamp(ds * 0.9 + 0.06, 0.08, 0.55);
  const accent = hsl(vh, clamp(vs * 0.95, 0.28, 0.78), 0.56);
  const inkLight = spineL < 0.5;

  return {
    // 封面/封底底色：封面照片盖在上面，这里只负责照片没铺满时的边和封底
    '--cover': `linear-gradient(150deg, ${hsl(dh, spineS, spineL + 0.08)}, ${hsl(dh, spineS * 0.8, Math.max(0.08, spineL - 0.08))})`,
    '--cover-ink': inkLight ? '#f6f1e8' : '#1a1512',
    '--spine': [
      'linear-gradient(90deg,',
      `${hsl(dh, spineS, Math.max(0.06, spineL - 0.13))} 0%,`,
      `${hsl(dh, spineS, spineL)} 22%,`,
      `${hsl(dh, spineS, spineL + 0.07)} 50%,`,
      `${hsl(dh, spineS, spineL)} 78%,`,
      `${hsl(dh, spineS, Math.max(0.06, spineL - 0.13))} 100%)`,
    ].join(' '),
    '--spine-ink': inkLight ? '#f3ece1' : '#211a15',
    '--edge': hsl(ah, clamp(as * 0.2, 0.02, 0.14), 0.94),
    '--edge-line': `${hsl(dh, 0.2, 0.35)}59`,
    '--top-edge': hsl(ah, clamp(as * 0.22, 0.02, 0.16), 0.87),
    '--glow': hsl(vh, clamp(vs, 0.3, 0.7), 0.78),
    '--accent': accent,
    '--paper': hsl(ah, clamp(as * 0.18, 0.02, 0.12), 0.965),
    '--paper-ink': hsl(dh, clamp(ds * 0.6, 0.1, 0.4), 0.19),
    '--paper-muted': hsl(dh, clamp(ds * 0.4, 0.06, 0.3), 0.5),
    '--rule': `${hsl(dh, 0.2, 0.3)}2b`,
    '--title-font': '"Songti SC", "STSong", "SimSun", serif',
    '--body-font': '"PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
    '--title-tracking': '0.18em',
    '--spine-tracking': '0.28em',
  };
}

/* ------------------------------------------------------------------ 出图 */

async function emit(src, dest, long, quality) {
  const img = sharp(src, { unlimited: true, failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const out = await img
    .resize({ width: long, height: long, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toFile(dest);
  return { w: out.width, h: out.height, srcW: meta.width, srcH: meta.height };
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * 开本。杂志本来就薄，厚度只跟页数走，页数不同厚度就不同。
 *
 * width 是页面宽高比，取「所有图想要的宽高比」的中位数：
 * 竖图想要自己的宽高比，横图跨中缝所以只要一半，封面按整页算。
 * 这样绝大多数图能几乎正好铺满页面，不用裁。
 */
function form(pageCount, wants) {
  return {
    height: 0.95,
    thickness: Number(clamp(0.022 + pageCount * 0.0042, 0.055, 0.13).toFixed(4)),
    width: Number(clamp(median(wants), 0.6, 0.84).toFixed(4)),
  };
}

/* ------------------------------------------------------------------ 主流程 */

async function buildOne(name) {
  const dir = path.join(SRC, name);
  const { id, ts } = folderId(name);
  const all = fs.readdirSync(dir);
  const info = readInfo(dir, all);
  const skipped = all.filter((f) => !isImage(f) && !/\.txt$/i.test(f));
  const { covers, pages } = sortFiles(all.filter(isImage));

  if (!covers.length) throw new Error(`${name} 里没有 1.jpg 这样的封面图`);

  const outDir = path.join(OUT, id);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'pages'), { recursive: true });

  process.stdout.write(`  ${id}  ${info.title}  「${info.masthead}」\n    封面 ${covers.length} · 内页 ${pages.length}`);

  const coverOut = [];
  for (let i = 0; i < covers.length; i++) {
    const file = `cover-${String.fromCharCode(97 + i)}.webp`;
    const r = await emit(path.join(dir, covers[i]), path.join(outDir, file), SIZE.cover, Q.cover);
    coverOut.push({ src: file, w: r.w, h: r.h });
    process.stdout.write('.');
  }
  await emit(path.join(dir, covers[0]), path.join(outDir, 'shelf.webp'), SIZE.shelf, Q.shelf);

  const pageOut = [];
  for (const p of pages) {
    const file = `pages/${pad2(pageOut.length + 1)}.webp`;
    let r;
    try {
      r = await emit(path.join(dir, p.f), path.join(outDir, file), SIZE.page, Q.page);
    } catch (e) {
      // 解不开的图（例如相机直出的 HEIC）不该拖垮整本，记下来跳过
      fs.rmSync(path.join(outDir, file), { force: true });
      skipped.push(`${p.f}（解码失败：${String(e.message).split('\n')[0]}）`);
      process.stdout.write('x');
      continue;
    }
    pageOut.push({
      src: file,
      w: r.w,
      h: r.h,
      o: r.h >= r.w ? 'p' : 'l',
      ...(p.group ? { group: p.group } : {}),
    });
    process.stdout.write('.');
  }

  // 采样：封面双倍权重，内页每隔几张取一张
  const step = Math.max(1, Math.round(pages.length / 6));
  const pal = await palette([
    { file: path.join(dir, covers[0]), weight: 2 },
    ...pages.filter((_, i) => i % step === 0).map((p) => ({ file: path.join(dir, p.f), weight: 1 })),
  ]);

  // 每张图想要的页面宽高比：竖图按自己算，横图跨中缝所以只要一半
  const wants = [
    ...coverOut.map((c) => c.w / c.h),
    ...pageOut.map((p) => (p.o === 'l' ? p.w / p.h / 2 : p.w / p.h)),
  ];

  const meta = {
    id,
    ts,
    ...info,
    source: name,
    form: form(pageOut.length, wants),
    theme: theme(pal),
    covers: coverOut,
    pages: pageOut,
    ...(skipped.length ? { skipped } : {}),
  };
  Object.assign(meta, OVERRIDES[id] || {});
  if (OVERRIDES[id]?.form) meta.form = { ...meta.form, ...OVERRIDES[id].form };
  if (OVERRIDES[id]?.theme) meta.theme = { ...meta.theme, ...OVERRIDES[id].theme };

  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');

  // 报一下有多少图跟选定的开本差得远（差得远就会在页面上留白边）
  const off = wants.filter((w) => Math.abs(w / meta.form.width - 1) > 0.06).length;
  process.stdout.write(
    ` 完成  开本 ${meta.form.width} · 厚 ${meta.form.thickness}`
    + (off ? ` · ${off}/${wants.length} 张会留边` : '')
    + (skipped.length ? `\n    跳过 ${skipped.join('、')}` : '') + '\n',
  );
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`找不到素材目录 ${SRC}`);
    process.exit(1);
  }
  const only = process.argv.slice(2);
  const dirs = fs.readdirSync(SRC)
    .filter((f) => fs.statSync(path.join(SRC, f)).isDirectory())
    .filter((f) => !only.length || only.some((k) => f.includes(k)));

  console.log(`构建 ${dirs.length} 本：`);
  for (const d of dirs) await buildOne(d);

  // manifest 始终照 magazines/ 里现存的全部 meta.json 重排，
  // 这样只重建一本（node build-magazines.js CHIC）也不会把别人挤掉
  const metas = fs.readdirSync(OUT)
    .map((d) => path.join(OUT, d, 'meta.json'))
    .filter((p) => fs.existsSync(p))
    .map((p) => JSON.parse(fs.readFileSync(p, 'utf8')))
    .sort((a, b) => a.ts - b.ts);

  fs.writeFileSync(
    path.join(OUT, 'manifest.json'),
    JSON.stringify({ magazines: metas.map((m) => m.id) }, null, 2) + '\n',
  );

  const bytes = (function du(p) {
    const s = fs.statSync(p);
    return s.isDirectory() ? fs.readdirSync(p).reduce((n, f) => n + du(path.join(p, f)), 0) : s.size;
  })(OUT);
  console.log(`\n书架顺序：${metas.map((m) => m.id).join(' → ')}`);
  console.log(`产物 ${(bytes / 1048576).toFixed(1)} MB → web/data/magazines/`);
}

main().catch((e) => { console.error('\n构建失败：', e.message); process.exit(1); });
