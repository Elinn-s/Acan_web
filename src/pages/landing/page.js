const landing = document.querySelector(".landing");
const stage = document.querySelector(".hero-stage");
const links = document.querySelector(".entry-links");

if (landing && stage && links) {
  const activate = () => landing.classList.add("is-active");
  const deactivate = () => landing.classList.remove("is-active");

  stage.addEventListener("mouseenter", activate);
  stage.addEventListener("mouseleave", () => {
    if (!links.matches(":hover")) deactivate();
  });
  links.addEventListener("mouseenter", activate);
  links.addEventListener("mouseleave", () => {
    if (!stage.matches(":hover")) deactivate();
  });

  stage.addEventListener("focusin", activate);
  stage.addEventListener("focusout", () => {
    if (!links.contains(document.activeElement)) deactivate();
  });
  links.addEventListener("focusin", activate);
  links.addEventListener("focusout", () => {
    if (!stage.contains(document.activeElement)) deactivate();
  });
}
