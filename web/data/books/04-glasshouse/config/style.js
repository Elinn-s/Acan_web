/** 《温室手记》造型配置 —— 墨绿、拱形窗格、叶脉线稿，纸张带淡米绿 */
export default {
  id: '04-glasshouse',
  images: ['01.svg', '02.svg', '03.svg', '04.svg', '05.svg'],

  form: { height: 0.90, thickness: 0.15, width: 0.68 },
  spineMode: 'vertical',

  theme: {
    '--cover': 'linear-gradient(165deg, #26583f 0%, #163826 50%, #0d2118 100%)',
    '--cover-ink': '#eef6e6',
    '--spine': 'linear-gradient(90deg, #08170f 0%, #1d4530 24%, #24543a 50%, #1d4530 76%, #08170f 100%)',
    '--spine-ink': '#dcecc9',
    '--edge': '#eef1e0',
    '--edge-line': 'rgba(13,33,24,.3)',
    '--top-edge': '#d6dfc4',
    '--glow': 'rgba(205,255,215,.95)',
    '--accent': '#6fbf8f',
    '--paper': '#f5f7ec',
    '--paper-ink': '#1a3a28',
    '--paper-muted': '#61806c',
    '--rule': 'rgba(26,58,40,.18)',
    '--title-font': '"Songti SC", "STSong", "SimSun", serif',
    '--body-font': '"PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
    '--title-tracking': '0.24em',
    '--spine-tracking': '0.36em',
  },

  spineArt: () => `
    <svg viewBox="0 0 40 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="19.4" y="40" width="1.2" height="320" fill="#6fbf8f" opacity=".5"/>
      ${Array.from({ length: 7 }, (_, i) => {
        const y = 70 + i * 42;
        const dir = i % 2 ? 1 : -1;
        return `<path d="M20 ${y} q ${dir * 9} -6 ${dir * 11} -14" fill="none" stroke="#c8dba0" stroke-width="1" opacity=".55"/>`;
      }).join('')}
      <rect x="0" y="26" width="40" height="0.8" fill="#c8dba0" opacity=".55"/>
      <rect x="0" y="374" width="40" height="0.8" fill="#c8dba0" opacity=".55"/>
    </svg>`,

  coverArt: () => `
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <g opacity=".5" stroke="#6fbf8f" fill="none" stroke-width="1">
        <path d="M60 400 L60 150 Q60 96 110 96 Q160 96 160 150 L160 400"/>
        <path d="M160 400 L160 150 Q160 96 210 96 Q260 96 260 150 L260 400"/>
        <path d="M20 210 H286 M20 290 H286 M20 360 H286"/>
      </g>
      <g opacity=".75" transform="translate(150 250)">
        <path d="M0 -66 Q40 -30 0 66 Q-40 -30 0 -66 Z" fill="#0d2118" opacity=".45" stroke="#c8dba0" stroke-width="1.4"/>
        <path d="M0 -60 V60" stroke="#c8dba0" stroke-width="1.1"/>
        ${Array.from({ length: 7 }, (_, i) => {
          const y = -42 + i * 16;
          const s = (26 - Math.abs(i - 3) * 6).toFixed(0);
          return `<path d="M0 ${y} q ${s} 5 ${s} 20 M0 ${y} q -${s} 5 -${s} 20" fill="none" stroke="#c8dba0" stroke-width=".8" opacity=".8"/>`;
        }).join('')}
      </g>
      <rect x="16" y="16" width="268" height="368" fill="none" stroke="#c8dba0" stroke-width="0.8" opacity=".35"/>
    </svg>`,

  pages: [
    { t: 'full', img: 0, cap: '第一周 · 玻璃上的雾' },
    { t: 'plate', img: 1, no: '02', cap: '顶光穿过叶背' },
    { t: 'quote', text: '绿不是一种颜色，\n是二十七种颜色排队站好。', by: '第二周的笔记' },
    { t: 'caption', img: 2, head: '湿度 88%', body: '镜头一进温室就起雾，只能等。等的十分钟里光变了三次，最后拍到的是第四种光。' },
    { t: 'duo', imgs: [3, 4], cap: '同一株龟背竹，正面与背面' },
    { t: 'colophon' },
  ],
};
