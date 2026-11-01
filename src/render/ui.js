import catalog from '../data/catalog.json' with { type: 'json' };
import marks from '../data/brand-marks.json' with { type: 'json' };

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const fees = catalog.fees;
export const feesTotal = fees.reduce((s, f) => s + f.value, 0);
export const buildRate = catalog.rate.cny;

const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
export const rub = (n) => `${nf.format(Math.round(n))} ₽`;
export const cny = (n) => `${nf.format(n)} ¥`;
export const total = (yuan, rate = buildRate) => (yuan > 0 ? yuan * rate + feesTotal : 0);

export const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

const titleBrand = (name) =>
  name.length <= 4 && name !== 'ROX' && name !== 'MINI' ? name : name.split(/([ -])/).map((w) => (w.length > 1 ? w[0] + w.slice(1).toLowerCase() : w)).join('');
export const brandLabel = (name) => ({ BMW: 'BMW', BYD: 'BYD', AITO: 'AITO', KIA: 'Kia', MINI: 'MINI', ROX: 'ROX', 'MERCEDES-BENZ': 'Mercedes-Benz', 'LAND ROVER': 'Land Rover' })[name] || titleBrand(name);

export const carTitle = (p) => `${brandLabel(p.brand)} ${p.model}`;

// Logo rendered as a CSS mask so it takes the current text colour.
export function brandMark(slug, name, cls = '') {
  const m = marks[slug] || { ratio: 2 };
  return `<span class="brand-mark ${cls}" style="--logo:url(/media/brands/${slug}.png);--ratio:${m.ratio}" role="img" aria-label="${esc(name)}"></span>`;
}

export function carImage(p, n = 1, { sizes = '(max-width: 760px) 100vw, 50vw', cls = '', eager = false, alt } = {}) {
  const base = `/media/cars/${p.slug}/${n}`;
  const ph = p.photos.find((x) => x.n === n) || p.photos[0];
  const big = n === 1 && ph.w >= 1920 ? `, ${base}-1920.webp 1920w` : '';
  const ratio = ph.w && ph.h ? `width="${ph.w > 1280 ? 1280 : ph.w}" height="${Math.round((ph.h / ph.w) * (ph.w > 1280 ? 1280 : ph.w))}"` : '';
  return `<img class="${cls}" src="${base}-1280.webp" srcset="${base}-640.webp 640w, ${base}-1280.webp 1280w${big}" sizes="${sizes}" ${ratio} alt="${esc(alt ?? carTitle(p))}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

export const products = catalog.products;
export const brands = catalog.brands;
export const bySlug = new Map(products.map((p) => [p.slug, p]));
export const brandBySlug = new Map(brands.map((b) => [b.slug, b]));

export function priceFrom(p) {
  return p.minCny > 0 ? total(p.minCny) : 0;
}

export function specLine(p) {
  const years = p.years.length > 1 ? `${p.years[0]}–${p.years.at(-1)}` : p.years[0];
  return [years, p.engine, p.body].filter(Boolean).join(' · ');
}

// Icons: simple strokes, inherit colour.
export const icon = {
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 16 8M9 8h7v7"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.8 9 3.3l1.6 3.9-1.9 1.5a11 11 0 0 0 6.6 6.6l1.5-1.9 3.9 1.6-.5 2.4a2 2 0 0 1-2 1.6C10.6 19 5 13.4 5 5.8a2 2 0 0 1 1.6-2Z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
};

export const socialIcon = {
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-3.6A8 8 0 1 1 8 19.1Z"/><path d="M9.2 8.6c.3 2.6 2.4 4.9 5 5.6l1.1-1.2 1.8.9-.3 1.5c-.2.6-1 1-1.7.9-3.6-.6-6.4-3.4-6.9-7 0-.7.4-1.4 1-1.6l1.5-.2.8 1.9Z"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 4.5 3.6 11.1c-.8.3-.8 1.4 0 1.7l4.1 1.4 1.6 5c.2.6 1 .8 1.5.3l2.3-2.2 4.3 3.1c.6.4 1.4.1 1.6-.6l2.6-13.2c.2-.8-.6-1.4-1.1-1.1Z"/><path d="m7.7 14.2 9.3-6.4-6.9 8"/></svg>',
  rutube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V5h9.2a3.6 3.6 0 0 1 0 7.2H8.4L15 19"/><circle cx="19" cy="5" r="1.6"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".9"/></svg>',
  vk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5h3.2c.5 3.1 1.9 5 3.3 5.4V7.5h3v3c1.3-.2 2.7-1.6 3.2-3h3c-.4 2-2.1 3.6-3.2 4.3 1.2.5 3 2 3.6 4.7h-3.3c-.5-1.6-1.8-2.9-3.3-3.1v3.1H12c-4.8 0-8.1-3.3-8.5-9Z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.4 2.6 2.2 4.3 5 4.5"/></svg>',
};
