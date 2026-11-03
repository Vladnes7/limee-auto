import { company, links, leadForm } from '../content/site.js';
import { esc, icon, brandMark, carImage, products, brands, bySlug, priceFrom, rub, carTitle, specLine, plural } from './ui.js';
import { brandTrack, leadSection } from './layout.js';
import map from '../data/map.json' with { type: 'json' };
import allBrands from '../data/all-brands.json' with { type: 'json' };

// Two versions of the first screen, chosen at build time: the scroll film (default) or the photo of a
// Bentley Continental used before the film (build with HERO=photo, see server/deploy-b.sh).
const PHOTO_HERO = process.env.HERO === 'photo';
const HERO = 'bentley-continental-plug-in-hybrid';

const FAN =['lotus-emira', 'xiaomi-su7-ultra', 'porsche-911', 'lixiang-ideal-l9', 'mercedes-benz-g-class-amg', 'zeekr-jikrypton-7x', 'land-rover-defender'];

// The first screen is a short film: one car travels from the choice in China to the keys at the
// client's door while the page is scrolled (see js/film.js). The five stages repeat the delivery
// stages named further down the page; no delivery method is named on purpose.
const FILM = [
  {
    chip: 'Выбор и проверка',
    title: 'Сервис безопасных<br>покупок <em>автомобилей</em><br>за границей',
    lead: 'Купите автомобиль мечты напрямую из-за рубежа без рисков переплат и скрытых комиссий с помощью безопасной сделки от Сбера',
  },
  { chip: 'Бронь и договор', title: 'Бронь, договор<br>и оплата', lead: 'Безопасная сделка вместе со Сбербанком' },
  { chip: 'Транспортировка', title: 'Доставка<br>и отслеживание', lead: 'Следите за статусом сделки' },
  { chip: 'Таможня, СБКТС и ЭПТС', title: 'Оформляем<br>всё <em>сами</em>', lead: 'Своя лаборатория: СБКТС, ЭПТС, таможенное декларирование' },
  { chip: 'Вручение автомобиля', title: 'Передаём<br><em>ключи</em>', lead: 'Проверенный автомобиль и полная прозрачность' },
];

function filmHero() {
  return `<section class="film" data-film aria-label="Путь автомобиля: от выбора до ключей">
  <div class="film-track" data-film-track>
    <div class="film-stage">
      <video class="film-video is-shown" data-film-video muted playsinline preload="auto" poster="/media/film/film-poster.jpg" aria-hidden="true" tabindex="-1" disablepictureinpicture></video>
      <video class="film-video film-rev" data-film-rev muted playsinline preload="auto" aria-hidden="true" tabindex="-1" disablepictureinpicture></video>
      <div class="film-shade" aria-hidden="true"></div>
      <p class="film-final" data-film-final><span class="film-final-tick" aria-hidden="true"></span>Автомобиль уже у вас дома</p>
      <div class="film-copy">
        <div class="film-steps">${FILM.map(
          (s, i) => `<div class="film-step${i === 0 ? ' is-active' : ''}" data-film-step>
          <p class="film-eyebrow">${s.chip}</p>
          ${i === 0 ? `<h1 class="display film-title">${s.title}</h1>` : `<h2 class="display film-title">${s.title}</h2>`}
          <p class="film-lead">${s.lead}</p>
          <div class="film-actions">
            <button class="btn btn-lime" type="button" data-open-lead>Консультация</button>
            <a class="btn btn-ghost" href="/catalog/">Каталог автомобилей</a>
          </div>
        </div>`,
        ).join('')}</div>
      </div>
      <div class="film-nav">
        <div class="film-intro">
          <p class="film-hint" data-film-hint>Листайте вниз, чтобы начать путь</p>
          <ul class="film-facts" data-film-facts>
            <li><strong>1000+</strong><span>авто под ключ</span></li>
            <li><strong>Вся Россия</strong><span>работаем по всей стране</span></li>
            <li><strong>5+ лет</strong><span>опыта</span></li>
          </ul>
          <button class="film-skip" type="button" data-film-skip>Пропустить</button>
        </div>
        <ol class="film-chips" aria-label="Этапы">${FILM.map(
          (s, i) => `<li><button class="film-chip${i === 0 ? ' is-active' : ''}" type="button" data-film-chip="${i}"><span class="film-chip-num">${i + 1}</span><span class="film-chip-text">${s.chip}</span></button></li>`,
        ).join('')}</ol>
        <div class="film-progress" aria-hidden="true"><i data-film-bar></i></div>
        <div class="film-actions film-actions-nav">
          <button class="btn btn-lime" type="button" data-open-lead>Консультация</button>
          <a class="btn btn-ghost" href="/catalog/">Каталог автомобилей</a>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function photoHero() {
  const p = bySlug.get(HERO);
  return `<section class="hero" data-hero aria-labelledby="hero-title">
  <div class="hero-media" data-hero-media>${carImage(p, 1, { sizes: '100vw', eager: true, cls: 'hero-img', alt: '' })}</div>
  <div class="hero-shade" aria-hidden="true"></div>
  <div class="hero-lines contours" aria-hidden="true"></div>
  <div class="hero-content">
    <h1 class="display hero-title" id="hero-title">
      <span class="line"><span>Сервис безопасных</span></span>
      <span class="line"><span>покупок <em>автомобилей</em></span></span>
      <span class="line"><span>за границей</span></span>
    </h1>
    <p class="hero-lead" data-hero-fade>Купите автомобиль мечты напрямую из-за рубежа без рисков переплат и скрытых комиссий с помощью безопасной сделки от Сбера</p>
    <div class="hero-actions" data-hero-fade>
      <button class="btn btn-lime" type="button" data-open-lead>Консультация</button>
      <a class="btn btn-ghost" href="/catalog/">Каталог автомобилей</a>
    </div>
  </div>
  <ul class="hero-facts" data-hero-fade>
    <li><strong>1000+</strong><span>авто под ключ</span></li>
    <li><strong>Вся Россия</strong><span>работаем по всей стране</span></li>
    <li><strong>5+ лет</strong><span>опыта</span></li>
  </ul>
  <p class="hero-caption" data-hero-fade>${esc(carTitle(p))}</p>
</section>`;
}

function hero() {
  return PHOTO_HERO ? photoHero() : filmHero();
}

function promises() {
  const items = [
    ['Безопасная сделка', 'Обеспечиваем сделку «под ключ» через аккредитив Сбера: покупка авто у нас надёжнее и проще, чем заказ на маркетплейсе.'],
    ['Выгодно', 'Благодаря работе с крупными экспортёрами мы привозим авто быстрее и дешевле, подтверждая качество детальными отчётами.'],
    ['Удобно', 'Своя аккредитованная лаборатория по оформлению СБКТС и ЭПТС исключает из сделки посредников и ускоряет процесс.'],
    ['Надёжно', 'Многоуровневые проверки Сбера подтверждают, что вы работаете с официальным, легальным и устойчивым партнёром.'],
  ];
  return `<section class="promises" aria-label="Почему с нами спокойно">
  <ul class="promise-list">${items.map(([t, d]) => `<li class="promise" data-reveal><h2 class="promise-title">${t}</h2><p>${d}</p></li>`).join('')}</ul>
</section>`;
}

// Every make the old site's showroom offers (tazzz base). Makes with models in our catalogue link to
// their page; the rest open the request form with the make filled in.
function allBrandsList() {
  const own = new Set(brands.map((b) => b.slug));
  // Digits first, then Latin letters, Russian makes last.
  const keyOf = (name) => {
    const ch = name[0].toUpperCase();
    return /[0-9]/.test(ch) ? '0–9' : /[A-Z]/.test(ch) ? ch : 'А–Я';
  };
  const rank = (k) => (k === '0–9' ? 0 : k === 'А–Я' ? 2 : 1);
  const groups = new Map();
  for (const b of allBrands.brands) {
    const key = keyOf(b.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  }
  const ordered = [...groups].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
  for (const [, list] of ordered) list.sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));
  const item = (b) =>
    own.has(b.slug)
      ? `<li data-name="${esc(b.name.toLowerCase())}"><a class="make make-own" href="/brands/${b.slug}/">${esc(b.name)}</a></li>`
      : `<li data-name="${esc(b.name.toLowerCase())}"><button class="make" type="button" data-open-lead data-model="${esc(b.name)}">${esc(b.name)}</button></li>`;
  return `<div class="makes is-collapsed" id="all-makes" data-makes inert>
  <div class="makes-inner">
    <div class="makes-tools">
      <div class="makes-search">${icon.search}<label class="sr-only" for="makes-q">Найти марку</label><input id="makes-q" type="search" placeholder="Найти марку" autocomplete="off" data-makes-q></div>
      <p class="makes-legend"><span class="make-dot" aria-hidden="true"></span>есть модели и цены в нашем каталоге. Остальные марки привезём под заказ: нажмите на марку, и откроется заявка.</p>
    </div>
    <div class="makes-groups">${ordered
      .map(([k, list]) => `<section class="makes-group" data-makes-group><h3 class="makes-letter">${k}</h3><ul>${list.map(item).join('')}</ul></section>`)
      .join('')}</div>
    <p class="makes-empty" data-makes-empty hidden>Такой марки нет в списке. Напишите её в заявке, и мы проверим, можно ли привезти.</p>
  </div>
</div>`;
}

function brandsBlock() {
  const total = allBrands.brands.length;
  return `<section class="brands-section" aria-labelledby="brands-title">
  <div class="section-head">
    <h2 class="display section-title" id="brands-title" data-reveal>Работаем с <em>ведущими</em> брендами</h2>
    <p class="section-note" data-reveal>${brands.length} ${plural(brands.length, 'марка', 'марки', 'марок')} и ${products.length} ${plural(products.length, 'модель', 'модели', 'моделей')} с ценой под ключ в нашем каталоге. Всего в базе ${total} ${plural(total, 'марка', 'марки', 'марок')}.</p>
  </div>
  ${brandTrack()}
  <ul class="brand-grid">${brands
    .map((b) => `<li><a class="brand-tile" href="/brands/${b.slug}/">${brandMark(b.slug, b.name)}</a></li>`)
    .join('')}</ul>
  <div class="makes-toggle-wrap"><button class="btn btn-ghost makes-toggle" type="button" aria-expanded="false" aria-controls="all-makes" data-makes-toggle><span data-makes-label>Показать все марки</span><span class="makes-total">${total}</span></button></div>
  ${allBrandsList()}
</section>`;
}

function fan() {
  const cars = FAN.map((s) => bySlug.get(s)).filter(Boolean);
  return `<section class="offers" aria-labelledby="offers-title" data-fan>
  <div class="offers-head">
    <p class="kicker">Подборка Limee Auto</p>
    <h2 class="display section-title" id="offers-title" data-reveal>Актуальные <em>предложения</em></h2>
    <p class="section-note" data-reveal>Выберите автомобиль и оставьте заявку. Менеджер уточнит наличие, состояние и стоимость.</p>
  </div>
  <div class="fan" role="list">${cars
    .map((p, i) => {
      const price = priceFrom(p);
      return `<a class="fan-card" role="listitem" href="/cars/${p.slug}/" style="--i:${i};--n:${cars.length}" data-fan-card>
      ${carImage(p, 1, { sizes: '(max-width: 760px) 80vw, 340px', alt: '' })}
      <span class="fan-info"><span class="fan-name">${esc(carTitle(p))}</span><span class="fan-price">${price ? `от <b data-price-cny="${p.minCny}">${rub(price)}</b>` : 'Цена по запросу'}</span></span>
    </a>`;
    })
    .join('')}</div>
  <div class="offers-foot"><a class="btn btn-dark" href="/catalog/">Весь каталог</a></div>
</section>`;
}

function reasons() {
  const cards = [
    { t: 'Своя лаборатория', s: 'Мы не «перекидываем» этапы на подрядчиков', list: ['оформление СБКТС и ЭПТС', 'сертификация', 'таможенное декларирование'], f: 'Это сокращает сроки, убирает лишние наценки и исключает бюрократию' },
    { t: 'Безопасная сделка', s: 'Совместно со Сбербанком', text: 'Деньги замораживаются на счёте Сбербанка и перечисляются на наш счёт только после выполнения условий', f: '100% банковские гарантии прозрачности и минимизация рисков на каждом этапе' },
    { t: 'Гарантия и сервис', s: 'Только официальная гарантия', list: ['на двигатель', 'трансмиссию', 'электрику', 'ключевые элементы ходовой'], f: 'Регламентное обслуживание, оригинальные расходники, доступ к каталогу запчастей' },
    { t: 'Витрина авто', s: 'Разработали свою автомобильную витрину с точными ценами под ключ', list: ['гибкая фильтрация: 19+ параметров', 'премиальные бренды', 'массовые бренды'], f: 'Подберите автомобиль мечты за считанные минуты' },
    { t: 'Честная стоимость', list: ['без скрытых комиссий', 'все платежи прописаны в договоре', 'без доплат'], f: 'В процессе цена не поменяется, несём полную юридическую ответственность' },
    { t: 'Юридическая гарантия', s: 'Берём на себя все юридические и таможенные риски', list: ['Прозрачный договор', '100% юридическая чистота', 'Средства полностью защищены'] },
  ];
  return `<section class="reasons" aria-labelledby="reasons-title">
  <div class="reasons-bg contours" aria-hidden="true"></div>
  <div class="section-head">
    <h2 class="display section-title" id="reasons-title" data-reveal>6 причин заказать авто из Кореи и Китая <em>у Limee Auto</em></h2>
    <p class="section-note" data-reveal>Мы соединяем покупателей из России и СНГ с крупнейшими дилерами и фабричными площадками Китая и Кореи. На нашей онлайн-платформе весь актуальный рынок: новые модели, проверенные машины с пробегом, редкие комплектации и спецверсии. Вы видите реальные лоты, прозрачную историю, комплектации и конечную стоимость до подписания договора.</p>
  </div>
  <ul class="reason-grid">${cards
    .map(
      (c) => `<li class="notch-card" data-reveal>
      <h3 class="reason-title">${c.t}</h3>
      ${c.s ? `<p class="reason-sub">${c.s}</p>` : ''}
      ${c.list ? `<ul class="ticks">${c.list.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
      ${c.text ? `<p class="reason-text">${c.text}</p>` : ''}
      ${c.f ? `<p class="reason-foot">${c.f}</p>` : ''}
    </li>`,
    )
    .join('')}</ul>
  <div class="numbers">
    <ul class="number-list">
      <li data-reveal><strong data-count="1000">1000</strong><span>Более 1000 авто под ключ</span></li>
      <li data-reveal><strong>РФ</strong><span>Работаем по всей России</span></li>
      <li data-reveal><strong data-count="5">5</strong><span>Опыт более 5 лет</span></li>
    </ul>
    <button class="btn btn-lime" type="button" data-open-lead>${leadForm.submit}</button>
  </div>
</section>`;
}

const STEPS = [
  {
    title: 'Выбор автомобиля и проверка предложений',
    img: 'step-1',
    list: [
      'Подбирайте автомобиль с помощью менеджера или самостоятельно в нашем приложении',
      'Отправляем запрос продавцу на проверку авто',
      'Получаем двуязычную форму (кит/рус): доступность для экспорта; актуальные данные: цена, пробег, VIN, бронь; отметки по кузову и салону, фото и видео',
      'Все данные по автомобилю появляются в вашем аккаунте',
    ],
    result: 'Вы за 24 часа получаете актуальные данные по состоянию и доступности авто',
  },
  {
    title: 'Бронь, договор и оплата',
    img: 'step-2',
    list: [
      'Вы подписываете агентский договор (можно офертой, без бумажек и скана)',
      'Оплата брони',
      'После осмотра: отчёт с фото и видео',
      'Подписываем договор купли-продажи',
      'Оплата по условиям договора. Выбираем варианты с аккредитивом от Сбера или без.',
    ],
    result: 'Юридическая и финансовая прозрачность, автоматизация взаимодействия. Запуск последующих процессов',
  },
  {
    title: 'Доставка и отслеживание',
    img: 'step-3',
    list: ['После подписания договора запускаем транспортировку', 'Вы видите статус доставки в приложении', 'Таможенное оформление и СБКТС/ЭПТС', 'Вручение автомобиля', 'Постпродажное обслуживание'],
    result: 'Отслеживание статуса сделки, оформление документации и вручение автомобиля',
  },
  {
    title: 'Бизнес-тур в Китай',
    img: 'step-4',
    list: ['Посещение площадок', 'Тест-драйв', 'Фиксация лота', 'Далее стандартный процесс с аккредитивом и логистикой'],
    result: 'Если хотите выбрать авто лично, устроим тур',
  },
];

function steps() {
  return `<section class="steps" aria-labelledby="steps-title">
  <div class="steps-head">
    <h2 class="display section-title" id="steps-title" data-reveal>Возьмём на себя все заботы: <em>подберём автомобиль</em> и передадим ключи</h2>
    <p class="section-note" data-reveal>Вы получаете проверенный автомобиль, полную прозрачность и сопровождение на каждом этапе сделки</p>
  </div>
  <ol class="step-list">${STEPS.map(
    (s, i) => `<li class="step" data-step>
      <figure class="step-media">
        <img src="/media/site/${s.img}-${s.img === 'step-4' ? 535 : 848}.webp" ${s.img === 'step-4' ? '' : `srcset="/media/site/${s.img}-480.webp 480w, /media/site/${s.img}-848.webp 848w" sizes="(max-width: 760px) 90vw, 420px"`} width="${s.img === 'step-4' ? 535 : 848}" height="${s.img === 'step-4' ? 749 : s.img === 'step-2' ? 1264 : 1187}" alt="" fetchpriority="low" decoding="async">
        <span class="step-num" aria-hidden="true">${i + 1}</span>
      </figure>
      <div class="step-body">
        <p class="step-index">Этап ${i + 1} из ${STEPS.length}</p>
        <h3 class="step-title">${s.title}</h3>
        <ul class="ticks">${s.list.map((x) => `<li>${x}</li>`).join('')}</ul>
        <p class="step-result"><span>Результат</span>${s.result}</p>
      </div>
    </li>`,
  ).join('')}</ol>
</section>`;
}

function delivery() {
  const stages = ['Выбор и проверка', 'Бронь и договор', 'Транспортировка', 'Таможня, СБКТС и ЭПТС', 'Вручение автомобиля'];
  const { w, h, route, routeKr, from, fromKr, to } = map;
  // label spots in the viewBox: tuned by eye so they stay inside the phone crop (x 170…1030)
  const labels = { ...map.labels, korea: [fromKr[0] + 6, fromKr[1] + 44] };
  return `<section class="delivery" aria-labelledby="delivery-title" data-delivery>
  <div class="delivery-sticky">
    <div class="delivery-head">
      <h2 class="display section-title" id="delivery-title">Из Китая и Кореи <em>в Россию</em></h2>
      <p class="section-note">Понятный и контролируемый процесс: от поиска подходящего автомобиля и проверки его состояния до оформления документов, логистики и передачи машины клиенту. Статус доставки виден в приложении.</p>
    </div>
    <div class="map" data-map>
      <img class="map-dots" src="/media/art/eurasia-dots.svg" width="${w}" height="${h}" alt="" decoding="async">
      <svg class="map-layer" viewBox="0 0 ${w} ${h}" aria-hidden="true">
        <defs>
          <linearGradient id="route-grad" gradientUnits="userSpaceOnUse" x1="${from[0]}" y1="${from[1]}" x2="${to[0]}" y2="${to[1]}"><stop offset="0" stop-color="#d5ff00"/><stop offset="1" stop-color="#f6f7f0"/></linearGradient>
          <linearGradient id="route-grad-kr" gradientUnits="userSpaceOnUse" x1="${fromKr[0]}" y1="${fromKr[1]}" x2="${to[0]}" y2="${to[1]}"><stop offset="0" stop-color="#d5ff00"/><stop offset="1" stop-color="#f6f7f0"/></linearGradient>
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
        </defs>
        <path class="route-ghost" d="${routeKr}"/>
        <path class="route-line route-kr" d="${routeKr}" pathLength="1" data-route/>
        <path class="route-ghost" d="${route}"/>
        <path class="route-glow" d="${route}" filter="url(#route-glow)" pathLength="1" data-route/>
        <path class="route-line" d="${route}" pathLength="1" data-route/>
        <g class="map-city map-city-from" transform="translate(${from.join(',')})"><circle r="7"/><circle class="pulse" r="7"/></g>
        <g class="map-city map-city-from" transform="translate(${fromKr.join(',')})"><circle r="6"/><circle class="pulse" r="6"/></g>
        <g class="map-city map-city-to" transform="translate(${to.join(',')})" data-city-to><circle r="8"/><circle class="pulse" r="8"/><text x="-16" y="-20" text-anchor="end">Москва</text></g>
        <text class="map-country" x="${labels.russia[0]}" y="${labels.russia[1]}" text-anchor="middle">РОССИЯ</text>
        <text class="map-country map-country-cn" x="${labels.china[0]}" y="${labels.china[1]}" text-anchor="middle">КИТАЙ</text>
        <text class="map-country map-country-cn" x="${labels.korea[0]}" y="${labels.korea[1]}" text-anchor="middle">КОРЕЯ</text>
        <g class="map-car" data-map-car transform="translate(${from.join(',')})"><circle r="22"/><path d="M-12 4c1-4 4-7 9-8l6-1c4 0 7 3 9 7v4h-24Z"/><circle class="wheel" cx="-6" cy="8" r="2.6"/><circle class="wheel" cx="6" cy="8" r="2.6"/></g>
      </svg>
    </div>
    <ol class="stage-list" data-stages>${stages.map((s, i) => `<li class="stage${i === 0 ? ' is-active' : ''}" data-stage><span class="stage-dot"></span>${s}</li>`).join('')}</ol>
    <p class="map-note">Схема для наглядности. Маршрут и сроки рассчитываются под конкретный заказ.</p>
  </div>
</section>`;
}

function checks() {
  const cols = [
    ['Полная юридическая проверка', 'Проверяем продавца, документы и условия сделки до выкупа автомобиля в Китае. Контролируем юридическую чистоту покупки, экспорта и последующего оформления в России.', ['Проверка продавца и договора', 'Сверка VIN и комплектации', 'Контроль оплаты и документов', 'Проверка экспортного оформления', 'Подготовка к СБКТС и ЭПТС']],
    ['Техническая диагностика', 'Проверяем работоспособность основных систем автомобиля перед отправкой из Китая.', ['Запуск автомобиля', 'Проверка приборной панели', 'Работа света и оптики', 'Проверка мультимедиа и камер', 'Контроль ошибок и предупреждений']],
    ['Кузов и салон', 'Осматриваем внешний вид и интерьер автомобиля, чтобы зафиксировать состояние до доставки.', ['Лакокрасочное покрытие', 'Зазоры и внешние элементы', 'Стёкла, пластик и оптика', 'Состояние салона', 'Комплектность ключей и аксессуаров']],
  ];
  return `<section class="checks" aria-labelledby="checks-title">
  <div class="checks-head">
    <h2 class="display section-title" id="checks-title" data-reveal>Что мы проверяем <em>при подборе</em> авто</h2>
    <p class="section-note" data-reveal>Проверяем автомобиль, документы, историю и техническое состояние. Вы получаете честный отчёт и уверенность в покупке.</p>
    <img class="checks-img" src="/media/site/checks-1390.webp" srcset="/media/site/checks-700.webp 700w, /media/site/checks-1390.webp 1390w" sizes="(max-width: 760px) 100vw, 45vw" width="1390" height="1132" alt="" loading="lazy" decoding="async">
  </div>
  <ul class="check-cols">${cols
    .map(([t, d, l]) => `<li class="check-col" data-reveal><h3>${t}</h3><p>${d}</p><ul class="ticks">${l.map((x) => `<li>${x}</li>`).join('')}</ul></li>`)
    .join('')}</ul>
  <div class="review">
    <img src="/media/site/review-1661.webp" srcset="/media/site/review-840.webp 840w, /media/site/review-1661.webp 1661w" sizes="100vw" width="1661" height="947" alt="" loading="lazy" decoding="async">
    <div class="review-copy">
      <h3 class="display review-title" data-reveal>Подробный фото <em>и видеообзор</em></h3>
      <ul class="ticks">
        <li>Подробное видео и фото с осмотром кузова и салона, подвески и двигателя</li>
        <li>Видео тест-драйва и его диагностики, копии сервисных книжек</li>
        <li>Онлайн-осмотр авто в любое время и прямая консультация специалиста</li>
      </ul>
    </div>
  </div>
</section>`;
}

function tazzz() {
  return `<section class="tazzz" aria-labelledby="tazzz-title">
  <div class="tazzz-card">
    <div class="tazzz-bg contours" aria-hidden="true"></div>
    <p class="kicker">База Tazzz</p>
    <h2 class="display section-title" id="tazzz-title">Автомобили, которые можно <em>заказать сейчас</em></h2>
    <p class="section-note">Реальные предложения с фотографиями, характеристиками и рассчитанной стоимостью под ключ.</p>
    <a class="btn btn-lime" href="${links.tazzz}" target="_blank" rel="noopener">Смотреть основной каталог</a>
  </div>
</section>`;
}

export function renderHome() {
  return {
    title: 'Limee Auto: автомобили из Китая под ключ с безопасной сделкой от Сбера',
    description: 'Подбор, проверка, покупка и доставка автомобилей из Китая в Россию под ключ. Безопасная сделка через аккредитив Сбера, своя лаборатория СБКТС и ЭПТС. Каталог из 251 модели с ценой под ключ.',
    pageClass: 'page-home',
    intro: true,
    body: `${hero()}${promises()}${brandsBlock()}${fan()}${reasons()}${steps()}${delivery()}${checks()}${tazzz()}${leadSection()}`,
  };
}
