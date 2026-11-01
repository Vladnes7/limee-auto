import { links } from '../content/site.js';
import { esc, icon, brandMark, carImage, products, brands, brandBySlug, priceFrom, rub, carTitle, specLine, plural, brandLabel } from './ui.js';
import { brandTrack, leadSection } from './layout.js';

export function crumbs(items) {
  return `<nav class="crumbs" aria-label="Навигационная цепочка"><ol>${items
    .map((it, i) => (i < items.length - 1 ? `<li><a href="${it.href}">${esc(it.label)}</a></li>` : `<li aria-current="page">${esc(it.label)}</li>`))
    .join('')}</ol></nav>`;
}

export function carCard(p, { lazy = true, hidden = false } = {}) {
  const price = priceFrom(p);
  const searchText = `${p.brand} ${brandLabel(p.brand)} ${p.model}`.toLowerCase();
  return `<li class="car-card-wrap"${hidden ? ' hidden' : ''} data-car data-brand="${p.brandSlug}" data-body="${esc(p.body || '')}" data-engine="${esc(p.engines.join('|'))}" data-price="${price || ''}" data-year="${p.years.at(-1) || ''}" data-date="${p.date}" data-search="${esc(searchText)}">
  <a class="car-card" href="/cars/${p.slug}/">
    <span class="car-card-media">${carImage(p, 1, { sizes: '(max-width: 600px) 92vw, (max-width: 1100px) 46vw, 31vw', alt: '' })}${p.util ? '<span class="badge">Льготный утильсбор</span>' : ''}</span>
    <span class="car-card-body">
      <span class="car-card-brand">${brandMark(p.brandSlug, p.brand)}</span>
      <span class="car-card-name">${esc(carTitle(p))}</span>
      <span class="car-card-spec">${esc(specLine(p))}</span>
      <span class="car-card-foot">
        <span class="car-card-price">${price ? `<small>Под ключ от</small><b data-price-cny="${p.minCny}">${rub(price)}</b>` : '<small>Стоимость</small><b>Цена по запросу</b>'}</span>      </span>
    </span>
  </a>
</li>`;
}

// First screenful of cards; the rest ship hidden so the page lays out light (same number as js/catalog.js).
const PAGE = 24;

const unique = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));

function toolbar(list, { withBrands }) {
  const bodies = unique(list.map((p) => p.body));
  const engines = unique(list.flatMap((p) => p.engines));
  return `<div class="cat-tools" data-cat-tools>
  <div class="cat-search">
    <label class="sr-only" for="cat-q">Поиск по марке или модели</label>
    ${icon.search}<input id="cat-q" type="search" placeholder="Марка или модель" autocomplete="off" data-filter="q">
  </div>
  ${withBrands ? `<div class="cat-select"><label for="cat-brand">Марка</label><div class="select"><select id="cat-brand" data-filter="brand"><option value="">Все марки</option>${brands.map((b) => `<option value="${b.slug}">${esc(brandLabel(b.name))} (${b.count})</option>`).join('')}</select></div></div>` : ''}
  <div class="cat-select"><label for="cat-body">Кузов</label><div class="select"><select id="cat-body" data-filter="body"><option value="">Любой</option>${bodies.map((b) => `<option>${esc(b)}</option>`).join('')}</select></div></div>
  <div class="cat-select"><label for="cat-engine">Двигатель</label><div class="select"><select id="cat-engine" data-filter="engine"><option value="">Любой</option>${engines.map((b) => `<option>${esc(b)}</option>`).join('')}</select></div></div>
  <div class="cat-select"><label for="cat-sort">Сортировка</label><div class="select"><select id="cat-sort" data-filter="sort"><option value="">Новые в каталоге</option><option value="price-asc">Сначала дешевле</option><option value="price-desc">Сначала дороже</option><option value="year">Сначала новее год</option></select></div></div>
</div>`;
}

function results(list) {
  return `<div class="cat-results" data-catalog>
  <p class="cat-count" aria-live="polite"><span data-cat-count>${list.length}</span> <span data-cat-word>${plural(list.length, 'модель', 'модели', 'моделей')}</span></p>
  <ul class="car-grid" data-cat-grid>${list.map((p, i) => carCard(p, { hidden: i >= PAGE })).join('')}</ul>
  <div class="cat-empty" data-cat-empty hidden>
    <p class="cat-empty-kicker">Ничего не найдено</p>
    <h3>Попробуйте изменить параметры</h3>
    <p>Сбросьте часть фильтров или выберите другую марку.</p>
    <button class="btn btn-dark" type="button" data-cat-reset>Сбросить все фильтры</button>
  </div>
  <div class="cat-more"><button class="btn btn-ghost-dark" type="button" data-cat-more hidden>Показать ещё</button></div>
</div>`;
}

function liveBase() {
  return `<aside class="cat-live">
  <div><p class="kicker">База Tazzz</p><p class="cat-live-title">Автомобили, которые можно заказать сейчас</p><p>Реальные предложения с фотографиями, характеристиками и рассчитанной стоимостью под ключ.</p></div>
  <a class="btn btn-lime" href="${links.tazzz}" target="_blank" rel="noopener">Смотреть основной каталог</a>
</aside>`;
}

const sorted = [...products].sort((a, b) => b.date.localeCompare(a.date));

export function renderCatalog() {
  return {
    title: 'Каталог автомобилей из Китая с ценой под ключ',
    description: `Каталог Limee Auto: ${products.length} моделей ${brands.length} марок из Китая. Цена под ключ в рублях по текущему курсу ЦБ, комплектации и характеристики.`,
    pageClass: 'page-catalog',
    body: `<section class="page-hero page-hero-dark">
  <div class="page-hero-bg contours" aria-hidden="true"></div>
  ${crumbs([{ href: '/', label: 'Главная' }, { label: 'Каталог автомобилей' }])}
  <h1 class="display page-title">Каталог <em>автомобилей</em></h1>
  <p class="page-lead">Новые автомобили из Китая. Цена под ключ считается от цены в юанях, рубли обновляются автоматически по текущему курсу ЦБ.</p>
  <p class="page-meta"><span data-rate-line>Курс ЦБ: 1 ¥ = ${String(12.0557).replace('.', ',')} ₽</span></p>
</section>
${brandTrack('brand-track-catalog')}
<section class="catalog" aria-label="Автомобили">
  ${toolbar(products, { withBrands: true })}
  ${results(sorted)}
  ${liveBase()}
</section>
${leadSection()}`,
  };
}

export function renderBrand(slug) {
  const b = brandBySlug.get(slug);
  const list = sorted.filter((p) => p.brandSlug === slug);
  const label = brandLabel(b.name);
  const from = Math.min(...list.map(priceFrom).filter(Boolean));
  return {
    title: `${label} из Китая: модели и цены под ключ`,
    description: `${label} в каталоге Limee Auto: ${list.length} ${plural(list.length, 'модель', 'модели', 'моделей')} с ценой под ключ в рублях, комплектации и характеристики. Подбор и доставка из Китая.`,
    pageClass: 'page-brand',
    body: `<section class="page-hero page-hero-dark brand-hero">
  <div class="page-hero-bg contours" aria-hidden="true"></div>
  ${crumbs([{ href: '/', label: 'Главная' }, { href: '/catalog/', label: 'Каталог' }, { label }])}
  <div class="brand-hero-mark">${brandMark(slug, b.name)}</div>
  <h1 class="display page-title">${esc(label)} <em>из Китая</em></h1>
  <p class="page-lead">${list.length} ${plural(list.length, 'модель', 'модели', 'моделей')} в каталоге${Number.isFinite(from) ? `, цена под ключ от <b data-price-min>${rub(from)}</b>` : ''}.</p>
</section>
<section class="catalog" aria-label="Модели ${esc(label)}">
  ${toolbar(list, { withBrands: false })}
  ${results(list)}
</section>
<section class="other-brands" aria-labelledby="other-brands-title">
  <h2 class="display section-title" id="other-brands-title">Другие <em>марки</em></h2>
  ${brandTrack()}
</section>
${leadSection({ model: label })}`,
  };
}
