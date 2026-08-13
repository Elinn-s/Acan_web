/**
 * 《潮汐纪事》造型配置
 *
 * form   书本体量。height 相对书架内高；thickness / width 相对书本自身高度。
 * theme  CSS 变量，会同时作用在书架上的书本和翻开后的阅读器上。
 * spineArt / coverArt  返回 SVG 字符串，作为书脊、封面的装饰层（标题文字由 DOM 叠加）。
 * pages  扉页之后的内容页序列，模板见 web/js/templates.js。
 */
export default {
  id: '01-ocean-tide',
  images: ['01.svg', '02.svg', '03.svg', '04.svg', '05.svg'],

  form: { height: 0.96, thickness: 0.165, width: 0.72 },
  spineMode: 'vertical',

  theme: {
    '--cover': 'linear-gradient(155deg, #0b4468 0%, #062f4c 45%, #03192b 100%)',
    '--cover-ink': '#eaf7ff',
    '--spine': 'linear-gradient(90deg, #021423 0%, #0a3a5c 22%, #0d4d78 50%, #0a3a5c 78%, #021423 100%)',
    '--spine-ink': '#dff2ff',
    '--edge': '#e7f1f6',
    '--edge-line': 'rgba(11,68,104,.35)',
    '--top-edge': '#cfe2ec',
    '--glow': 'rgba(170,225,255,.95)',
    '--accent': '#5ec2f0',
    '--paper': '#f2f8fb',
    '--paper-ink': '#12384f',
    '--paper-muted': '#5c8098',
    '--rule': 'rgba(18,56,79,.16)',
    '--title-font': '"Songti SC", "STSong", "SimSun", serif',
    '--body-font': '"PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
    '--title-tracking': '0.22em',
    '--spine-tracking': '0.34em',
  },

  spineArt: () => `
    <svg viewBox="0 0 40 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="26" width="40" height="1.4" fill="#5ec2f0" opacity=".55"/>
      <rect x="0" y="31" width="40" height="0.7" fill="#e8d9b0" opacity=".5"/>
      <rect x="0" y="368" width="40" height="0.7" fill="#e8d9b0" opacity=".5"/>
      <rect x="0" y="372" width="40" height="1.4" fill="#5ec2f0" opacity=".55"/>
      ${[344, 350, 356].map((y, i) => `<rect x="10" y="${y}" width="20" height="1" fill="#b9ecff" opacity="${.5 - i * .12}"/>`).join('')}
    </svg>`,

  coverArt: () => `
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <circle cx="222" cy="78" r="34" fill="none" stroke="#e8d9b0" stroke-width="1" opacity=".65"/>
      <circle cx="222" cy="78" r="34" fill="#e8d9b0" opacity=".1"/>
      <path d="M204 78a18 18 0 0 0 36 0a18 18 0 0 0 -36 0" fill="#b9ecff" opacity=".22"/>
      <g opacity=".5">
        ${Array.from({ length: 9 }, (_, i) => {
          const y = 250 + i * 15;
          const a = (0.55 - i * 0.045).toFixed(2);
          return `<path d="M-10 ${y} q 40 -${9 - i * .6} 80 0 t 80 0 t 80 0 t 80 0" fill="none" stroke="#5ec2f0" stroke-width="1.1" opacity="${a}"/>`;
        }).join('')}
      </g>
      <rect x="16" y="16" width="268" height="368" fill="none" stroke="#b9ecff" stroke-width="0.8" opacity=".3"/>
    </svg>`,

  pages: [
    { t: 'full', img: 0, cap: '退潮后的第四十分钟' },
    { t: 'caption', img: 1, head: '正午 · 过曝', body: '光在浪尖上碎成一片白，快门再快也追不上。索性让它曝掉，只留一个形状。' },
    { t: 'quote', text: '海不记得任何一次涨落，\n所以每一次都是第一次。', by: '拍摄手记 · 第三周' },
    { t: 'full', img: 2, cap: '浅滩，风起之前' },
    { t: 'duo', imgs: [3, 4], cap: '黄昏两连拍：同一处礁石，相隔十一分钟' },
    { t: 'colophon' },
  ],
};
