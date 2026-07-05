// 泡泡悬停控制 —— 用延迟缓冲代替纯 CSS :hover，
// 避免鼠标经过人物与泡泡之间的空隙时提前收起导致点不到
(function () {
  const wrapper = document.querySelector('.character-wrapper');
  if (!wrapper) return;

  const HIDE_DELAY = 250; // ms
  let hideTimer = null;

  function activate() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    wrapper.classList.add('bubbles-active');
  }

  function scheduleDeactivate() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      wrapper.classList.remove('bubbles-active');
      hideTimer = null;
    }, HIDE_DELAY);
  }

  const targets = [wrapper, ...wrapper.querySelectorAll('.bubble')];
  targets.forEach((el) => {
    el.addEventListener('mouseenter', activate);
    el.addEventListener('mouseleave', scheduleDeactivate);
  });
})();
