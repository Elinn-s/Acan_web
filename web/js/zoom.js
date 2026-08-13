/*
 * 点开内页里的照片，看原图。
 *
 * 电脑：滚轮缩放（以光标为中心）、按住拖动看边缘、双击在贴合与放大之间切换。
 * 触屏：双指捏合缩放、单指拖动；贴合状态下横向一甩就翻到下一张。
 *
 * 变换写成 translate 再 scale，scale 以图片中心为原点，
 * 所以「显示尺寸 = 原始尺寸 × base × scale」，平移范围也就好算了。
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const MAX = 8;        // 最多放到贴合尺寸的 8 倍
const TAP = 6;        // 位移小于这么多像素才算「点」而不是「拖」
const FLICK = 60;     // 贴合状态下横向甩过这么多像素就翻页

export class Zoom {
  constructor(els) {
    Object.assign(this, els);
    this.list = [];
    this.i = 0;
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this.base = 1;
    this.pts = new Map();
    this.bind();
  }

  get isOpen() { return !this.root.hidden; }

  /* ------------------------------------------------------------ 开合 */

  open(src, list = [src]) {
    this.list = list.length ? list : [src];
    this.i = Math.max(0, this.list.indexOf(src));
    this.root.hidden = false;
    document.body.classList.add('is-zoomed');
    requestAnimationFrame(() => this.root.classList.add('is-visible'));
    this.show();
    this.closeBtn.focus({ preventScroll: true });
  }

  close() {
    if (!this.isOpen) return;
    this.root.classList.remove('is-visible');
    document.body.classList.remove('is-zoomed');
    this.pts.clear();
    setTimeout(() => {
      this.root.hidden = true;
      this.img.removeAttribute('src');
    }, 200);
  }

  step(d) {
    const next = clamp(this.i + d, 0, this.list.length - 1);
    if (next === this.i) return;
    this.i = next;
    this.show();
  }

  async show() {
    const src = this.list[this.i];
    this.reset();
    this.img.src = src;
    this.counter.textContent = `${this.i + 1} / ${this.list.length}`;
    this.prevBtn.disabled = this.i <= 0;
    this.nextBtn.disabled = this.i >= this.list.length - 1;

    if (!this.img.complete) {
      await new Promise((r) => { this.img.onload = r; this.img.onerror = r; });
      if (this.img.src !== new URL(src, location.href).href) return;   // 期间又翻了一张
    }
    this.measure();
    this.apply();
  }

  /* ------------------------------------------------------------ 几何 */

  measure() {
    const r = this.view.getBoundingClientRect();
    this.vw = r.width;
    this.vh = r.height;
    this.iw = this.img.naturalWidth || 1;
    this.ih = this.img.naturalHeight || 1;
    this.base = Math.min(this.vw / this.iw, this.vh / this.ih);
  }

  reset() { this.scale = 1; this.tx = 0; this.ty = 0; }

  apply(animate = false) {
    const s = this.base * this.scale;
    const maxX = Math.max(0, (this.iw * s - this.vw) / 2);
    const maxY = Math.max(0, (this.ih * s - this.vh) / 2);
    this.tx = clamp(this.tx, -maxX, maxX);
    this.ty = clamp(this.ty, -maxY, maxY);
    this.img.style.transition = animate ? 'transform .3s cubic-bezier(.2,.72,.2,1)' : 'none';
    this.img.style.transform =
      `translate(calc(-50% + ${this.tx}px), calc(-50% + ${this.ty}px)) scale(${s})`;
    this.root.classList.toggle('is-zoomed-in', this.scale > 1.01);
  }

  /** 缩放到 next 倍，并让 (cx, cy) 这个点在屏幕上保持不动 */
  zoomAt(next, cx, cy, animate = false) {
    const from = this.scale;
    this.scale = clamp(next, 1, MAX);
    const k = this.scale / from;
    this.tx = cx - (cx - this.tx) * k;
    this.ty = cy - (cy - this.ty) * k;
    if (this.scale <= 1.001) { this.tx = 0; this.ty = 0; }
    this.apply(animate);
  }

  /** 事件坐标 -> 相对视口中心的偏移 */
  local(x, y) {
    const r = this.view.getBoundingClientRect();
    return [x - r.left - r.width / 2, y - r.top - r.height / 2];
  }

  pinchSpread() {
    const [a, b] = [...this.pts.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }

  pinchMid() {
    const [a, b] = [...this.pts.values()];
    return this.local((a.x + b.x) / 2, (a.y + b.y) / 2);
  }

  /* ------------------------------------------------------------ 交互 */

  bind() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.prevBtn.addEventListener('click', () => this.step(-1));
    this.nextBtn.addEventListener('click', () => this.step(1));

    this.view.addEventListener('wheel', (e) => {
      e.preventDefault();
      const [cx, cy] = this.local(e.clientX, e.clientY);
      this.zoomAt(this.scale * Math.exp(-e.deltaY * 0.0016), cx, cy);
    }, { passive: false });

    this.view.addEventListener('dblclick', (e) => {
      const [cx, cy] = this.local(e.clientX, e.clientY);
      this.zoomAt(this.scale > 1.05 ? 1 : 2.6, cx, cy, true);
    });

    this.view.addEventListener('pointerdown', (e) => {
      this.view.setPointerCapture(e.pointerId);
      this.pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      this.moved = 0;
      if (this.pts.size === 2) this.spread0 = this.pinchSpread();
    });

    this.view.addEventListener('pointermove', (e) => {
      const p = this.pts.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      this.moved += Math.abs(dx) + Math.abs(dy);

      if (this.pts.size >= 2) {
        const d = this.pinchSpread();
        const [cx, cy] = this.pinchMid();
        this.zoomAt(this.scale * (d / this.spread0), cx, cy);
        this.spread0 = d;
      } else {
        this.tx += dx;
        this.ty += dy;
        this.apply();
      }
    });

    const release = (e) => {
      const p = this.pts.get(e.pointerId);
      this.pts.delete(e.pointerId);
      if (this.pts.size < 2) this.spread0 = null;
      if (!p || this.pts.size) return;

      const fit = this.scale <= 1.01;
      if (fit && Math.abs(e.clientX - p.sx) > FLICK) {
        this.step(e.clientX < p.sx ? 1 : -1);
      } else if (this.moved < TAP && !e.target.closest('.zoom__img')) {
        this.close();                       // 点图片以外的地方 = 收起来
      }
    };
    this.view.addEventListener('pointerup', release);
    this.view.addEventListener('pointercancel', release);

    addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      const k = e.key;
      if (k === 'Escape') { this.close(); }
      else if (k === 'ArrowRight' || k === ' ') { this.step(1); }
      else if (k === 'ArrowLeft') { this.step(-1); }
      else if (k === '+' || k === '=') { this.zoomAt(this.scale * 1.4, 0, 0, true); }
      else if (k === '-' || k === '_') { this.zoomAt(this.scale / 1.4, 0, 0, true); }
      else if (k === '0') { this.reset(); this.apply(true); }
      else return;
      e.preventDefault();
      e.stopPropagation();
    }, true);   // 捕获阶段先拦下来，别让翻页也跟着动

    addEventListener('resize', () => {
      if (!this.isOpen) return;
      this.measure();
      this.apply();
    }, { passive: true });
  }
}
