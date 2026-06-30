import { escapeHtml, getModuleData } from "../../shared/js/content-service.js";

const titleEl = document.getElementById("stage-title");
const descEl = document.getElementById("stage-description");
const gridEl = document.getElementById("stage-grid");

bootstrap();

async function bootstrap() {
  try {
    const data = await getModuleData("text");
    titleEl.textContent = data.title;
    descEl.textContent = data.description;
    gridEl.innerHTML = "";
    data.items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "item-card";
      card.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.content)}</p>
      `;
      gridEl.appendChild(card);
    });
  } catch (error) {
    titleEl.textContent = "文字模块";
    descEl.textContent = error.message;
  }
}
