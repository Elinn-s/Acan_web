export async function getModuleData(moduleKey) {
  const response = await fetch("../../data/mock.json");
  if (!response.ok) {
    throw new Error("mock 数据加载失败");
  }
  const payload = await response.json();
  if (!payload[moduleKey]) {
    throw new Error(`模块 ${moduleKey} 不存在`);
  }
  return payload[moduleKey];
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
