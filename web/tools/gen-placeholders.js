/**
 * 占位图生成器
 *
 * 为 web/data/books/<id>/images/ 生成 5 张主题化的 SVG 占位图。
 * 真实照片就位后直接替换同名文件即可（或改 config/style.js 里的 images 列表）。
 *
 *   node web/tools/gen-placeholders.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'data', 'books');

/** 每本书一套调色板：bg0 深底 / bg1 中调 / a 主色 / b 亮色 / c 点缀 */
const BOOKS = [
  {
    id: '01-ocean-tide',
    label: 'TIDE',
    pal: { bg0: '#03192b', bg1: '#0b4468', a: '#5ec2f0', b: '#b9ecff', c: '#e8d9b0' },
  },
  {
    id: '02-iron-oath',
    label: 'OATH',
    pal: { bg0: '#120a0c', bg1: '#3a1016', a: '#b3121f', b: '#e0574f', c: '#d9c27a' },
  },
  {
    id: '03-sunday-gloss',
    label: 'GLOSS',
    pal: { bg0: '#efe6dd', bg1: '#f7f2ec', a: '#d98b6a', b: '#f0c9c0', c: '#2b2724' },
  },
  {
    id: '04-glasshouse',
    label: 'GLASS',
    pal: { bg0: '#0d2118', bg1: '#22513a', a: '#6fbf8f', b: '#c8dba0', c: '#f2efe0' },
  },
  {
    id: '05-afternoon',
    label: 'DEV',
    pal: { bg0: '#241709', bg1: '#4d3520', a: '#d9a05b', b: '#efe3cd', c: '#a35a35' },
  },
];

/** 五种画幅，模拟写真集里混排的比例 */
const SIZES = [
  [1200, 1600],
  [1600, 1200],
  [1200, 1200],
  [1000, 1500],
  [1600, 900],
];

/* ---------------------------------------------------------------- 构图 */

function sceneHorizon(w, h, p) {
  return `
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <circle cx="${r(w * .66)}" cy="${r(h * .33)}" r="${r(h * .105)}" fill="${p.c}" opacity=".8" filter="url(#soft)"/>
  <rect x="0" y="${r(h * .58)}" width="${w}" height="${r(h * .42)}" fill="url(#deep)"/>
  ${[.63, .71, .8, .9].map((t, i) => `<rect x="${r(w * (.06 + i * .11))}" y="${r(h * t)}" width="${r(w * (.5 - i * .08))}" height="${r(h * .006)}" rx="${r(h * .003)}" fill="${p.b}" opacity="${(.4 - i * .07).toFixed(2)}"/>`).join('')}
  <ellipse cx="${r(w * .66)}" cy="${r(h * .58)}" rx="${r(w * .1)}" ry="${r(h * .015)}" fill="${p.c}" opacity=".35" filter="url(#soft)"/>`;
}

function scenePortrait(w, h, p) {
  const cx = w * .5, top = h * .18;
  return `
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <circle cx="${r(w * .24)}" cy="${r(h * .22)}" r="${r(h * .3)}" fill="${p.a}" opacity=".3" filter="url(#soft)"/>
  <circle cx="${r(w * .82)}" cy="${r(h * .78)}" r="${r(h * .26)}" fill="${p.b}" opacity=".2" filter="url(#soft)"/>
  <g filter="url(#soft2)" opacity=".92">
    <ellipse cx="${r(cx)}" cy="${r(top + h * .12)}" rx="${r(w * .13)}" ry="${r(h * .13)}" fill="${p.bg0}"/>
    <path d="M${r(cx - w * .3)} ${r(h * 1.02)} Q${r(cx)} ${r(top + h * .2)} ${r(cx + w * .3)} ${r(h * 1.02)} Z" fill="${p.bg0}"/>
  </g>
  <ellipse cx="${r(cx - w * .06)}" cy="${r(top + h * .1)}" rx="${r(w * .05)}" ry="${r(h * .07)}" fill="${p.b}" opacity=".18" filter="url(#soft)"/>`;
}

function sceneArcs(w, h, p) {
  const cx = w * .5, cy = h * .52, base = Math.min(w, h);
  return `
  <rect width="${w}" height="${h}" fill="${p.bg1}"/>
  <circle cx="${r(cx)}" cy="${r(cy)}" r="${r(base * .42)}" fill="${p.bg0}" opacity=".55"/>
  ${[.42, .32, .22, .12].map((k, i) => `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(base * k)}" fill="none" stroke="${i % 2 ? p.b : p.a}" stroke-width="${r(base * .012)}" opacity="${(.85 - i * .13).toFixed(2)}"/>`).join('')}
  <circle cx="${r(cx)}" cy="${r(cy)}" r="${r(base * .06)}" fill="${p.c}"/>
  <rect x="0" y="${r(cy)}" width="${w}" height="${r(base * .006)}" fill="${p.c}" opacity=".3"/>`;
}

function sceneTexture(w, h, p) {
  return `
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <rect width="${w}" height="${h}" fill="${p.a}" opacity=".5" filter="url(#weave)" style="mix-blend-mode:overlay"/>
  <rect x="${r(w * .12)}" y="${r(h * .12)}" width="${r(w * .76)}" height="${r(h * .76)}" fill="none" stroke="${p.c}" stroke-width="${r(Math.min(w, h) * .004)}" opacity=".5"/>
  <circle cx="${r(w * .3)}" cy="${r(h * .38)}" r="${r(Math.min(w, h) * .2)}" fill="${p.b}" opacity=".22" filter="url(#soft)"/>`;
}

function sceneStill(w, h, p) {
  const base = Math.min(w, h);
  return `
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <rect x="0" y="${r(h * .68)}" width="${w}" height="${r(h * .32)}" fill="${p.bg0}" opacity=".6"/>
  <rect x="${r(w * .16)}" y="${r(h * .3)}" width="${r(base * .2)}" height="${r(h * .38)}" rx="${r(base * .02)}" fill="${p.a}" opacity=".9"/>
  <ellipse cx="${r(w * .56)}" cy="${r(h * .55)}" rx="${r(base * .17)}" ry="${r(base * .17)}" fill="${p.b}" opacity=".85"/>
  <rect x="${r(w * .72)}" y="${r(h * .44)}" width="${r(base * .12)}" height="${r(h * .24)}" rx="${r(base * .06)}" fill="${p.c}" opacity=".8"/>
  <ellipse cx="${r(w * .5)}" cy="${r(h * .7)}" rx="${r(w * .4)}" ry="${r(h * .04)}" fill="${p.bg0}" opacity=".45" filter="url(#soft)"/>`;
}

const SCENES = [sceneHorizon, scenePortrait, sceneArcs, sceneTexture, sceneStill];

/* ---------------------------------------------------------------- 组装 */

const r = (n) => Math.round(n);

function svg(book, index) {
  const [w, h] = SIZES[index % SIZES.length];
  const p = book.pal;
  const body = SCENES[index % SCENES.length](w, h, p);
  const blur = Math.min(w, h) * .06;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${book.label} placeholder ${index + 1}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="${p.bg1}"/>
      <stop offset="1" stop-color="${p.bg0}"/>
    </linearGradient>
    <linearGradient id="deep" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.a}" stop-opacity=".5"/>
      <stop offset="1" stop-color="${p.bg0}"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.42"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="${r(blur)}"/></filter>
    <filter id="soft2"><feGaussianBlur stdDeviation="${r(blur * .28)}"/></filter>
    <filter id="weave">
      <feTurbulence type="turbulence" baseFrequency="0.012 0.05" numOctaves="3" seed="${index * 7 + 3}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${index * 13 + 1}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  ${body}
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity=".14" style="mix-blend-mode:overlay"/>
  <text x="${r(w * .045)}" y="${h - r(Math.min(w, h) * .045)}" font-family="Helvetica, Arial, sans-serif"
        font-size="${r(Math.min(w, h) * .032)}" letter-spacing="${r(Math.min(w, h) * .012)}"
        fill="${p.c}" opacity=".5">${book.label} / ${String(index + 1).padStart(2, '0')}</text>
</svg>
`;
}

let count = 0;
for (const book of BOOKS) {
  const dir = path.join(ROOT, book.id, 'images');
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < 5; i++) {
    const file = path.join(dir, `${String(i + 1).padStart(2, '0')}.svg`);
    fs.writeFileSync(file, svg(book, i), 'utf8');
    count++;
  }
  console.log(`  ${book.id}  ->  5 张`);
}
console.log(`\n共生成 ${count} 张占位图。`);
