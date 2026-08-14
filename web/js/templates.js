export const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function safeUrl(value) {
  try {
    const url = new URL(value, location.href);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

const anchor = (rawUrl, text) => {
  const url = safeUrl(rawUrl);
  return url
    ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`
    : esc(text);
};

/** 支持 Markdown 链接和裸 http(s) 链接。 */
export function linkify(raw = '') {
  const tokens = [];
  let text = String(raw).replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (_, label, url) => {
    tokens.push(anchor(url, label));
    return `\u0000${tokens.length - 1}\u0000`;
  });
  text = esc(text).replace(/(?:https?:\/\/)[^\s<)）]+/g, (url) => anchor(url, url));
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
}
