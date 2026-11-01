import { esc, icon, brandMark, carImage, products, bySlug, fees, feesTotal, total, rub, cny, carTitle, brandLabel, buildRate } from './ui.js';
import { leadSection } from './layout.js';
import { crumbs, carCard } from './catalog.js';

const chip = (t) => (t ? `<li>${esc(t)}</li>` : '');

function specRows(t) {
  return [
    ['Год', t.year],
    ['Кузов', t.body],
    ['Привод', t.drive],
    ['Коробка передач', t.gearbox],
    ['Двигатель', t.engine],
    ['Объём двигателя', t.volume],
    ['Мощность', t.kw ? `${t.kw} кВт (${t.hp} л.с.)` : t.hp ? `${t.hp} л.с.` : null],
  ].filter(([, v]) => v);
}

function trimCard(t, i) {
  const sum = t.cny > 0 ? total(t.cny) : 0;
  const tags = [t.drive, t.year, t.body, t.kw ? `${t.kw} кВт` : null].filter(Boolean);
  return `<li><button class="trim${i === 0 ? ' is-active' : ''}" type="button" aria-pressed="${i === 0}" data-trim="${i}">
    <span class="trim-title">${esc(t.title)}</span>
    <span class="trim-tags">${tags.map((x) => `<span>${esc(x)}</span>`).join('')}${t.util ? '<span class="trim-util">Льготный утильсбор</span>' : ''}</span>
    <span class="trim-price">${sum ? `<b data-price-cny="${t.cny}">${rub(sum)}</b>` : '<b>Цена по запросу</b>'}</span>
  </button></li>`;
}

export function renderCar(slug) {
  const p = bySlug.get(slug);
  const title = carTitle(p);
  const brand = brandLabel(p.brand);
  const first = p.trims[0];
  const minTotal = p.minCny > 0 ? total(p.minCny) : 0;
  const years = p.years.length > 1 ? `${p.years[0]}–${p.years.at(-1)}` : p.years[0];
  const related = products.filter((x) => x.brandSlug === p.brandSlug && x.slug !== p.slug).slice(0, 3);
  const data = { cny: p.trims.map((t) => t.cny), specs: p.trims.map(specRows), fees, feesTotal, rate: buildRate };
  const firstSum = first.cny > 0 ? total(first.cny) : 0;

  return {
    title: `${title}: цена под ключ, комплектации`,
    description: `${title} из Китая под ключ${minTotal ? ` от ${rub(minTotal).replace('\u00a0', ' ')}` : ''}. ${p.trims.length} ${p.trims.length === 1 ? 'комплектация' : 'комплектаций'}, расчёт стоимости с доставкой, оформлением и комиссией.`,
    pageClass: 'page-car',
    image: `/media/cars/${p.slug}/1-1280.webp`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://autolimee.ru/' },
        { '@type': 'ListItem', position: 2, name: 'Каталог', item: 'https://autolimee.ru/catalog/' },
        { '@type': 'ListItem', position: 3, name: brand, item: `https://autolimee.ru/brands/${p.brandSlug}/` },
        { '@type': 'ListItem', position: 4, name: title },
      ],
    },
    body: `<section class="car-hero">
  <div class="car-hero-media">${carImage(p, 1, { sizes: '100vw', eager: true, alt: '' })}</div>
  <div class="car-hero-shade" aria-hidden="true"></div>
  <div class="car-hero-content">
    ${crumbs([{ href: '/', label: 'Главная' }, { href: '/catalog/', label: 'Каталог' }, { href: `/brands/${p.brandSlug}/`, label: brand }, { label: p.model }])}
    <p class="car-hero-kicker">${brandMark(p.brandSlug, p.brand)}<span>${esc(years)}</span></p>
    <h1 class="display car-hero-title">${esc(title)}</h1>
    <ul class="chips">${chip(years)}${chip(p.engines.join(', '))}${chip(p.body)}${chip(p.drive.join(', '))}</ul>
    <p class="car-hero-price">${minTotal ? `<small>Цена под ключ от</small><b data-price-cny="${p.minCny}">${rub(minTotal)}</b>` : '<small>Стоимость</small><b>Цена по запросу</b>'}</p>
    <div class="car-hero-actions">
      <button class="btn btn-lime" type="button" data-open-lead data-model="${esc(title)}">Оформить заявку</button>
      <a class="btn btn-ghost" href="#calc">Конфигуратор и цена</a>
    </div>
  </div>
</section>

<section class="gallery" aria-label="Фотографии ${esc(title)}" data-gallery>
  <div class="gallery-track" data-gallery-track tabindex="0" aria-label="Фото, листайте стрелками">${p.photos
    .map((ph) => `<figure class="gallery-slide">${carImage(p, ph.n, { sizes: '(max-width: 900px) 100vw, 72vw', alt: `${title}, фото ${ph.n}` })}</figure>`)
    .join('')}</div>
  ${p.photos.length > 1 ? `<div class="gallery-ui">
    <button class="gallery-btn" type="button" data-gallery-prev aria-label="Предыдущее фото">${icon.chevron}</button>
    <span class="gallery-count"><span data-gallery-index>1</span> / ${p.photos.length}</span>
    <button class="gallery-btn" type="button" data-gallery-next aria-label="Следующее фото">${icon.chevron}</button>
  </div>
  <div class="gallery-thumbs">${p.photos
    .map((ph, i) => `<button type="button" class="gallery-thumb${i === 0 ? ' is-active' : ''}" data-gallery-thumb="${i}" aria-label="Фото ${ph.n}"><img src="/media/cars/${p.slug}/${ph.n}-640.webp" alt="" loading="lazy" decoding="async" width="160" height="110"></button>`)
    .join('')}</div>` : ''}
</section>

<section class="config" id="calc" aria-labelledby="config-title" data-config>
  <div class="config-trims">
    <h2 class="display section-title" id="config-title">Комплектации</h2>
    <p class="section-note">Выберите подходящую комплектацию и сравните параметры автомобиля.</p>
    <ul class="trim-list">${p.trims.map(trimCard).join('')}</ul>
  </div>
  <aside class="calc" aria-labelledby="calc-title">
    <h2 class="calc-title" id="calc-title">Расчёт стоимости</h2>
    <p class="calc-note">Цена считается от CNY. RUB обновляется автоматически по текущему курсу.</p>
    <p class="calc-trim" data-calc-trim>${esc(first.title)}</p>
    <dl class="calc-rows">
      <div><dt>Стоимость автомобиля<small data-calc-cny>${first.cny > 0 ? `${cny(first.cny)} × <span data-rate-value>${String(buildRate).replace('.', ',')}</span> ₽` : 'по запросу'}</small></dt><dd data-calc-car>${first.cny > 0 ? rub(first.cny * buildRate) : '—'}</dd></div>
      <div><dt>Таможенная пошлина</dt><dd>${rub(0)}</dd></div>
      ${fees.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${rub(f.value)}</dd></div>`).join('')}
    </dl>
    <p class="calc-total"><span>Итоговая стоимость</span><b data-calc-total>${firstSum ? rub(firstSum) : 'По запросу'}</b></p>
    <button class="btn btn-lime btn-wide" type="button" data-open-lead data-model="${esc(title)}" data-calc-lead>Оформить заявку</button>
    <p class="calc-foot">* Расчёт является предварительным и может отличаться от итоговой стоимости. Точная стоимость уточняется при оформлении договора.</p>
    <h3 class="calc-spec-title">Характеристики</h3>
    <dl class="spec-list" data-calc-specs>${specRows(first).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  </aside>
  <script type="application/json" data-car-json>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
</section>

${related.length ? `<section class="related" aria-labelledby="related-title">
  <div class="section-head-row">
    <h2 class="display section-title" id="related-title">Ещё <em>${esc(brand)}</em></h2>
    <a class="link-arrow" href="/brands/${p.brandSlug}/">Все модели марки</a>
  </div>
  <ul class="car-grid">${related.map((r) => carCard(r)).join('')}</ul>
</section>` : ''}
${leadSection({ model: title })}`,
  };
}
