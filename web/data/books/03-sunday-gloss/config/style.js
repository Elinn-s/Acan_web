/** 《SUNDAY GLOSS》造型配置 —— 奶油底、陶土色块、极简无衬线，留白比内容多 */
export default {
  id: '03-sunday-gloss',
  images: ['01.svg', '02.svg', '03.svg', '04.svg', '05.svg'],

  form: { height: 0.82, thickness: 0.105, width: 0.78 },
  spineMode: 'rotate',

  theme: {
    '--cover': 'linear-gradient(180deg, #faf6f1 0%, #f2e9df 100%)',
    '--cover-ink': '#2b2724',
    '--spine': 'linear-gradient(90deg, #e2d6c9 0%, #faf6f1 30%, #fffdfa 50%, #faf6f1 70%, #e2d6c9 100%)',
    '--spine-ink': '#2b2724',
    '--edge': '#ffffff',
    '--edge-line': 'rgba(43,39,36,.14)',
    '--top-edge': '#f0e8de',
    '--glow': 'rgba(255,255,255,1)',
    '--accent': '#d98b6a',
    '--paper': '#fffdfa',
    '--paper-ink': '#2b2724',
    '--paper-muted': '#9a8f86',
    '--rule': 'rgba(43,39,36,.12)',
    '--title-font': '"Helvetica Neue", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    '--body-font': '"Helvetica Neue", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    '--title-tracking': '0.4em',
    '--spine-tracking': '0.5em',
  },

  spineArt: () => `
    <svg viewBox="0 0 40 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="18" width="40" height="0.7" fill="#2b2724" opacity=".45"/>
      <rect x="0" y="382" width="40" height="0.7" fill="#2b2724" opacity=".45"/>
      <rect x="0" y="352" width="40" height="18" fill="#d98b6a" opacity=".9"/>
    </svg>`,

  coverArt: () => `
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect x="196" y="0" width="104" height="400" fill="#d98b6a" opacity=".9"/>
      <rect x="196" y="0" width="104" height="400" fill="#f0c9c0" opacity=".25"/>
      <circle cx="248" cy="300" r="40" fill="#faf6f1" opacity=".55"/>
      <rect x="26" y="352" width="140" height="1" fill="#2b2724" opacity=".55"/>
      <text x="26" y="378" font-family="Helvetica, Arial, sans-serif" font-size="9"
            letter-spacing="4" fill="#2b2724" opacity=".6">ISSUE 03 — SUNDAY</text>
    </svg>`,

  pages: [
    { t: 'caption', img: 0, head: 'Slow Morning', body: '十点半才拉开窗帘。光斜着爬上墙面，把奶油色照成另一种奶油色——这一页什么都没发生。' },
    { t: 'plate', img: 1, no: '02', cap: 'Knitwear, terracotta' },
    { t: 'full', img: 2, cap: 'Iced Americano, backlit' },
    { t: 'quote', text: 'Nothing to do\nand a whole day to do it in.', by: 'Editor’s note' },
    { t: 'duo', imgs: [3, 4], cap: 'Off-duty: 同一件外套的两种穿法' },
    { t: 'colophon' },
  ],
};
