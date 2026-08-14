/*
 * 全站唯一刊物数据源。
 * 资料站、房间场景和翻页阅读器都读取这里，不各自维护图片路径。
 *
 * 新刊物使用相同目录规则时，只需复制一段 magazine({...}) 配置；
 * 有真实封底时填写 backCover 文件名，否则阅读器会自动生成简洁封底。
 */
(function () {
  'use strict';

  const numberedPages = (count) => Array.from(
    { length: count },
    (_, index) => `pages/${String(index + 1).padStart(2, '0')}.webp`,
  );

  function magazine({ id, title, date, timestamp, intro = '', coverCount = 1, pageCount, backCover = null }) {
    const folder = `data/magazines/${id}`;
    const extraCovers = Array.from(
      { length: Math.max(0, coverCount - 1) },
      (_, index) => `cover-${String.fromCharCode(98 + index)}.webp`,
    );
    const path = (file) => file ? `${folder}/${file}` : null;
    return {
      kind: 'magazine',
      id,
      title,
      date,
      intro,
      timestamp,
      cover: path('cover-a.webp'),
      pages: [...extraCovers, ...numberedPages(pageCount)].map(path),
      backCover: path(backCover),
    };
  }

  window.ACAN_CATALOG = [
    magazine({ id: '2023-01-29', timestamp: 20230129, title: '孚世兔年', date: '2023.01.29', intro: '我们总在期待高光时刻，而当下认真生活、努力成长的每一瞬间，同样值得被珍藏。', pageCount: 15 }),
    magazine({ id: '2026-05-15', timestamp: 20260515, title: '一寸清欢', date: '2026.05.15', intro: '在古朴静谧的氛围里，寻得一份不被俗世打扰的松弛，收藏烟火古巷中的一寸清欢。', coverCount: 2, pageCount: 16 }),
    magazine({ id: '2026-05-19-tops', timestamp: 20260519, title: 'Tops', date: '2026.05.19', intro: '以千种面貌游走于柔软与锋利之间，在镜头里记录属于她的自由表达。', pageCount: 18 }),
    magazine({ id: '2026-07-10-ellemen', timestamp: 20260710, title: 'ELLEMEN七月', date: '2026.07.10', intro: '镜头之外，她仍在继续书写自己的答案。', pageCount: 10 }),
    magazine({ id: '2026-07-15-trendmo', timestamp: 20260715, title: 'Mermaid', date: '2026.07.15', intro: '月光落进深海，安静、自由，也不必等待谁来照亮。', pageCount: 16 }),
    magazine({ id: '2026-08-11-chic', timestamp: 20260811, title: 'CHIC八月', date: '2026.08.12', intro: '这个夏天，带着漫长假期中积攒的勇气与信心，把那些不可能一件一件变成可能。', coverCount: 2, pageCount: 19 }),
  ];
}());
