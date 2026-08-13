/** 《午后显影》造型配置 —— 暖棕胶片、齿孔纹样、打字机字形 */
export default {
  id: '05-afternoon',
  images: ['01.svg', '02.svg', '03.svg', '04.svg', '05.svg'],

  form: { height: 0.86, thickness: 0.185, width: 0.80 },
  spineMode: 'vertical',

  theme: {
    '--cover': 'linear-gradient(170deg, #5a3d24 0%, #3b2715 55%, #241709 100%)',
    '--cover-ink': '#efe3cd',
    '--spine': 'linear-gradient(90deg, #1a1008 0%, #4a3220 25%, #573b25 50%, #4a3220 75%, #1a1008 100%)',
    '--spine-ink': '#efe3cd',
    '--edge': '#e6d7ba',
    '--edge-line': 'rgba(58,39,21,.35)',
    '--top-edge': '#cbb894',
    '--glow': 'rgba(255,224,170,.95)',
    '--accent': '#d9a05b',
    '--paper': '#f6eddc',
    '--paper-ink': '#3a2715',
    '--paper-muted': '#8a6f52',
    '--rule': 'rgba(58,39,21,.2)',
    '--title-font': '"Songti SC", "STSong", "SimSun", serif',
    '--body-font': '"Consolas", "Courier New", "PingFang SC", "Microsoft YaHei", monospace',
    '--title-tracking': '0.28em',
    '--spine-tracking': '0.38em',
  },

  spineArt: () => `
    <svg viewBox="0 0 40 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      ${Array.from({ length: 16 }, (_, i) => {
        const y = 30 + i * 22.5;
        return `<rect x="4" y="${y}" width="6" height="11" rx="1.5" fill="#efe3cd" opacity=".35"/>
                <rect x="30" y="${y}" width="6" height="11" rx="1.5" fill="#efe3cd" opacity=".35"/>`;
      }).join('')}
      <rect x="0" y="18" width="40" height="0.9" fill="#d9a05b" opacity=".7"/>
      <rect x="0" y="382" width="40" height="0.9" fill="#d9a05b" opacity=".7"/>
    </svg>`,

  coverArt: () => `
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      ${Array.from({ length: 13 }, (_, i) => {
        const y = 14 + i * 30;
        return `<rect x="8" y="${y}" width="14" height="18" rx="3" fill="#efe3cd" opacity=".28"/>
                <rect x="278" y="${y}" width="14" height="18" rx="3" fill="#efe3cd" opacity=".28"/>`;
      }).join('')}
      <g transform="translate(150 232)">
        <circle r="62" fill="none" stroke="#d9a05b" stroke-width="1.6" opacity=".8"/>
        <circle r="50" fill="#d9a05b" opacity=".12"/>
        <path d="M-78 0 H-66 M66 0 H78 M0 -78 V-66 M0 66 V78" stroke="#efe3cd" stroke-width="1.4" opacity=".7"/>
        <path d="M-14 0 H14 M0 -14 V14" stroke="#efe3cd" stroke-width="1" opacity=".55"/>
      </g>
      <rect x="34" y="24" width="232" height="352" fill="none" stroke="#efe3cd" stroke-width="0.7" opacity=".3"/>
    </svg>`,

  pages: [
    { t: 'duo', imgs: [0, 1], cap: '第一卷，第 7 和第 8 张' },
    { t: 'quote', text: '过期五年的意思是，\n它替我决定了颜色。', by: '冲扫当晚' },
    { t: 'full', img: 2, cap: '下午四点十七分' },
    { t: 'caption', img: 3, head: '偏色 · 不修', body: '青色压不住，整卷都往洋红里跑。试着校了两张，越校越不像那天，于是全部原样。' },
    { t: 'plate', img: 4, no: '36', cap: '最后一张，光刚好没了' },
    { t: 'colophon' },
  ],
};
