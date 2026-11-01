import { rub, rateText, totalFor, setFees } from './rate.js';

const nf = new Intl.NumberFormat('ru-RU');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function initGallery() {
  const g = document.querySelector('[data-gallery]');
  if (!g) return;
  const track = g.querySelector('[data-gallery-track]');
  const slides = [...track.children];
  const thumbs = [...g.querySelectorAll('[data-gallery-thumb]')];
  const indexEl = g.querySelector('[data-gallery-index]');
  let current = 0;

  const go = (i) => {
    current = (i + slides.length) % slides.length;
    track.scrollTo({ left: slides[current].offsetLeft - track.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const mark = (i) => {
    current = i;
    if (indexEl) indexEl.textContent = i + 1;
    thumbs.forEach((t, k) => t.classList.toggle('is-active', k === i));
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.isIntersecting && en.intersectionRatio > 0.6 && mark(slides.indexOf(en.target)));
  }, { root: track, threshold: [0.6] });
  slides.forEach((s) => io.observe(s));

  g.querySelector('[data-gallery-prev]')?.addEventListener('click', () => go(current - 1));
  g.querySelector('[data-gallery-next]')?.addEventListener('click', () => go(current + 1));
  thumbs.forEach((t, i) => t.addEventListener('click', () => go(i)));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
  });
}

export function initConfig() {
  const root = document.querySelector('[data-config]');
  if (!root) return;
  const data = JSON.parse(root.querySelector('[data-car-json]').textContent);
  setFees(data.feesTotal);
  let rate = data.rate;
  let active = 0;
  const trims = [...root.querySelectorAll('[data-trim]')];
  const out = {
    trim: root.querySelector('[data-calc-trim]'),
    cny: root.querySelector('[data-calc-cny]'),
    car: root.querySelector('[data-calc-car]'),
    total: root.querySelector('[data-calc-total]'),
    specs: root.querySelector('[data-calc-specs]'),
  };

  function render() {
    const cny = data.cny[active];
    out.trim.textContent = trims[active].querySelector('.trim-title').textContent;
    out.cny.innerHTML = cny > 0 ? `${nf.format(cny)} ¥ × <span data-rate-value>${rateText(rate)}</span> ₽` : 'по запросу';
    out.car.textContent = cny > 0 ? rub(cny * rate) : '—';
    out.total.textContent = cny > 0 ? rub(totalFor(cny, rate)) : 'По запросу';
    out.specs.innerHTML = data.specs[active].map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  }

  trims.forEach((btn, i) =>
    btn.addEventListener('click', () => {
      trims[active].classList.remove('is-active');
      trims[active].setAttribute('aria-pressed', 'false');
      active = i;
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      render();
      if (matchMedia('(max-width: 960px)').matches) root.querySelector('.calc').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }),
  );

  document.addEventListener('limee:rate', (e) => {
    rate = e.detail.rate;
    render();
  });
}
