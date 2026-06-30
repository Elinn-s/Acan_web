import { escapeHtml, getModuleData } from "../../shared/js/content-service.js";

const titleEl = document.getElementById("stage-title");
const descEl = document.getElementById("stage-description");
const gridEl = document.getElementById("stage-grid");

bootstrap();

async function bootstrap() {
  try {
    const data = await getModuleData("video");
    titleEl.textContent = data.title;
    descEl.textContent = data.description;
    gridEl.innerHTML = "";
    data.items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "item-card";
      card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <video controls src="${escapeHtml(item.url)}"></video>
        <span class="item-tag">${escapeHtml(item.tag || "视频资料")}</span>
      `;
      gridEl.appendChild(card);
    });
  } catch (error) {
    titleEl.textContent = "视频模块";
    descEl.textContent = error.message;
  }
}
