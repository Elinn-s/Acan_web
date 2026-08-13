/** 《铁与誓约》造型配置 —— 黑铁、暗红、烛金，重压纹与硬边框 */
export default {
  id: '02-iron-oath',
  images: ['01.svg', '02.svg', '03.svg', '04.svg', '05.svg'],

  form: { height: 1.0, thickness: 0.205, width: 0.70 },
  spineMode: 'vertical',

  theme: {
    '--cover': 'linear-gradient(160deg, #2a1015 0%, #16090c 55%, #0d0507 100%)',
    '--cover-ink': '#e9d9b4',
    '--spine': 'linear-gradient(90deg, #0a0405 0%, #2e1015 26%, #38131a 50%, #2e1015 74%, #0a0405 100%)',
    '--spine-ink': '#d9c27a',
    '--edge': '#d8c9a6',
    '--edge-line': 'rgba(58,16,22,.4)',
    '--top-edge': '#b9a87d',
    '--glow': 'rgba(255,214,150,.95)',
    '--accent': '#b3121f',
    '--paper': '#efe6d3',
    '--paper-ink': '#241012',
    '--paper-muted': '#7a5c4a',
    '--rule': 'rgba(36,16,18,.22)',
    '--title-font': '"Songti SC", "STSong", "SimSun", serif',
    '--body-font': '"Songti SC", "STSong", "SimSun", serif',
    '--title-tracking': '0.3em',
    '--spine-tracking': '0.4em',
  },

  spineArt: () => `
    <svg viewBox="0 0 40 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      ${[20, 24, 376, 380].map((y) => `<rect x="0" y="${y}" width="40" height="1.6" fill="#d9c27a" opacity=".7"/>`).join('')}
      <rect x="0" y="34" width="40" height="0.8" fill="#b3121f" opacity=".8"/>
      <rect x="0" y="366" width="40" height="0.8" fill="#b3121f" opacity=".8"/>
      ${[46, 340].map((y) => `<path d="M20 ${y} l8 6 l-8 6 l-8 -6 z" fill="none" stroke="#d9c27a" stroke-width="1" opacity=".75"/>`).join('')}
    </svg>`,

  coverArt: () => `
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 400 L300 120 L300 400 Z" fill="#b3121f" opacity=".14"/>
      <rect x="14" y="14" width="272" height="372" fill="none" stroke="#d9c27a" stroke-width="1.6" opacity=".6"/>
      <rect x="21" y="21" width="258" height="358" fill="none" stroke="#d9c27a" stroke-width="0.6" opacity=".4"/>
      <g transform="translate(150 214)" opacity=".85">
        <path d="M0 -74 L58 -50 L58 6 Q58 56 0 82 Q-58 56 -58 6 L-58 -50 Z"
              fill="none" stroke="#d9c27a" stroke-width="2"/>
        <path d="M0 -74 L58 -50 L58 6 Q58 56 0 82 Q-58 56 -58 6 L-58 -50 Z"
              fill="#b3121f" opacity=".2"/>
        <path d="M-34 -34 L34 46 M34 -34 L-34 46" stroke="#d9c27a" stroke-width="1.4" opacity=".8"/>
        <circle cx="0" cy="4" r="10" fill="#0d0507" stroke="#d9c27a" stroke-width="1.4"/>
      </g>
    </svg>`,

  pages: [
    { t: 'plate', img: 0, no: 'I', cap: '披甲 · 起手式' },
    { t: 'quote', text: '铁是冷的，\n握住它的手不是。', by: '拍摄札记' },
    { t: 'full', img: 1, cap: '烛火，唯一光源' },
    { t: 'caption', img: 2, head: '硬光 · 单灯', body: '一支裸灯从四十五度打下来，甲片的每一道划痕都被翻出来。阴影里什么都不补，让它黑到底。' },
    { t: 'duo', imgs: [3, 4], cap: '誓约的两个瞬间：跪下，与起身' },
    { t: 'colophon' },
  ],
};
