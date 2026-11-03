import { company, socials, nav, legalNav, leadForm, links } from '../content/site.js';
import { esc, icon, socialIcon, brandMark, brands } from './ui.js';
import { wordmark, carOutline } from './brand.js';

const ext = (href) => /^https?:/.test(href);
const linkAttrs = (href) => (ext(href) ? ' target="_blank" rel="noopener"' : '');

export function header(path) {
  const items = nav
    .map((n) => {
      const current = !n.external && (path === n.href || (n.href !== '/' && path.startsWith(n.href)));
      return `<a class="nav-link" href="${n.href}"${linkAttrs(n.href)}${current ? ' aria-current="page"' : ''}>${n.label}</a>`;
    })
    .join('');
  return `<a class="skip-link" href="#main">Перейти к содержимому</a>
<header class="site-header" data-header>
  <a class="header-logo" href="/" aria-label="Limee Auto, на главную">${wordmark('wordmark-header')}</a>
  <nav class="main-nav" aria-label="Основное меню">${items}</nav>
  <div class="header-contact">
    <a class="header-phone" href="${company.phoneHref}">${company.phone}</a>
    <span class="header-hours">${company.hours}</span>
  </div>
  <button class="btn btn-lime header-cta" type="button" data-open-lead>${leadForm.submit}</button>
  <button class="burger" type="button" aria-expanded="false" aria-controls="menu" data-menu-toggle><span class="sr-only">Меню</span><i></i><i></i></button>
</header>
<div class="menu" id="menu" data-menu hidden>
  <div class="menu-bg contours" aria-hidden="true"></div>
  <nav class="menu-nav" aria-label="Меню">
    <a class="menu-link" href="/">Главная</a>
    ${nav.map((n) => `<a class="menu-link" href="${n.href}"${linkAttrs(n.href)}>${n.label}</a>`).join('')}
  </nav>
  <div class="menu-foot">
    <a class="menu-phone" href="${company.phoneHref}">${company.phone}</a>
    <span>${company.hours}</span>
    <div class="socials">${socials.map((s) => `<a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}">${socialIcon[s.id]}</a>`).join('')}</div>
    <button class="btn btn-lime" type="button" data-open-lead>${leadForm.submit}</button>
  </div>
</div>`;
}

export function leadFields(idPrefix, { model = '' } = {}) {
  const id = (n) => `${idPrefix}-${n}`;
  return `<div class="field"><label for="${id('name')}">Имя</label><input id="${id('name')}" name="name" type="text" autocomplete="name" placeholder="Как к вам обращаться"></div>
  <div class="field"><label for="${id('phone')}">Телефон <span aria-hidden="true">*</span></label><input id="${id('phone')}" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" required aria-describedby="${id('phone-err')}"><span class="field-error" id="${id('phone-err')}" role="alert"></span></div>
  <div class="field"><label for="${id('budget')}">Ваш бюджет</label><input id="${id('budget')}" name="budget" type="text" inputmode="numeric" placeholder="Например, 1 500 000 ₽"></div>
  <div class="field"><label for="${id('model')}">Желаемая марка / модель</label><input id="${id('model')}" name="model" type="text" placeholder="Например: Zeekr 001, Li Auto L7" value="${esc(model)}"></div>
  <div class="field"><label for="${id('method')}">Удобный способ связи</label><div class="select"><select id="${id('method')}" name="method">${leadForm.contactMethods.map((m) => `<option>${m}</option>`).join('')}</select></div></div>
  <label class="consent"><input type="checkbox" name="consent" required aria-describedby="${id('consent-err')}"><span class="consent-box" aria-hidden="true">${icon.check}</span><span>Я согласен с <a href="/privacy/" target="_blank">политикой конфиденциальности</a> и даю <a href="/consent/" target="_blank">согласие на обработку персональных данных</a></span></label>
  <span class="field-error" id="${id('consent-err')}" role="alert"></span>`;
}

function leadDone() {
  return `<div class="lead-done" hidden tabindex="-1">
    <span class="lead-done-mark">${icon.check}</span>
    <p class="lead-done-title">Заявка готова</p>
    <p>Мы открыли WhatsApp с текстом заявки. Отправьте сообщение, и менеджер свяжется с вами.</p>
    <p class="lead-done-alt">Если WhatsApp не открылся, позвоните: <a href="${company.phoneHref}">${company.phone}</a></p>
  </div>`;
}

export function leadDialog() {
  return `<dialog class="lead-dialog" data-lead-dialog aria-labelledby="lead-dialog-title">
  <div class="lead-dialog-inner">
    <button class="dialog-close" type="button" data-close-lead aria-label="Закрыть">${icon.close}</button>
    <h2 class="lead-dialog-title" id="lead-dialog-title">${leadForm.title}</h2>
    <p class="lead-dialog-text">${leadForm.text}</p>
    <form class="lead-form" data-lead-form novalidate>
      ${leadFields('dlg')}
      <button class="btn btn-lime btn-wide" type="submit">${leadForm.submit}</button>
    </form>
    ${leadDone()}
  </div>
</dialog>`;
}

// Lead block that closed every page of the old site.
export function leadSection({ model = '' } = {}) {
  const points = [
    ['8+ вариантов новых авто', 'под ваш бюджет, класс и желаемую комплектацию'],
    ['Проверка документов', 'сверяем VIN, комплектацию, условия выкупа и оформления'],
    ['Расчёт стоимости до России', 'цена авто, доставка, таможня, СБКТС, ЭПТС и комиссия'],
  ];
  return `<section class="lead" id="lead" aria-labelledby="lead-title">
  <div class="lead-copy">
    <h2 class="display lead-title" id="lead-title">Оставьте заявку на подбор <em>нового авто</em></h2>
    <p class="lead-sub">и получите персональную подборку <mark>бесплатно</mark></p>
    <p class="lead-text">Подберём новые автомобили из Китая под ваш бюджет, комплектацию и сроки поставки. Рассчитаем стоимость под ключ до России и покажем реальные варианты от проверенных поставщиков.</p>
    <ul class="lead-points">${points.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join('')}</ul>
  </div>
  <div class="lead-card">
    <h3 class="lead-card-title">${leadForm.title}</h3>
    <p class="lead-card-text">${leadForm.text}</p>
    <form class="lead-form" data-lead-form novalidate>
      ${leadFields('lead', { model })}
      <button class="btn btn-lime btn-wide" type="submit">${leadForm.submit}</button>
    </form>
    ${leadDone()}
  </div>
</section>`;
}

export function brandTrack(cls = '') {
  const row = brands.map((b) => `<a class="track-item" href="/brands/${b.slug}/">${brandMark(b.slug, b.name)}</a>`).join('');
  return `<div class="brand-track ${cls}">
  <div class="track-row">${row}</div>
  <div class="track-row" aria-hidden="true">${row.replaceAll('class="track-item"', 'class="track-item" tabindex="-1"')}</div>
</div>`;
}

export function footer() {
  return `<footer class="site-footer">
  <div class="footer-panel">
    <div class="footer-tab" aria-hidden="true"></div>
    <div class="footer-bg contours" aria-hidden="true"></div>
    <div class="footer-statement">
      ${carOutline('footer-outline')}
      <p class="display footer-slogan">Премиальные автомобили <em>под заказ</em> из Китая и Кореи</p>
      <p class="footer-about">${company.about}</p>
    </div>
    <div class="footer-cols">
      <nav class="footer-col" aria-label="Разделы">
        <p class="footer-label">Разделы</p>
        <a href="/catalog/">Каталог</a>
        <a href="${links.vitrina}" target="_blank" rel="noopener">Витрина</a>
        <a href="/about/">О компании</a>
        <a href="/contacts/">Контакты</a>
        <a href="/requisites/">Реквизиты</a>
      </nav>
      <div class="footer-col">
        <p class="footer-label">Контакты</p>
        <a class="footer-big" href="${company.phoneHref}">${company.phone}</a>
        <span class="footer-note">${company.hours}</span>
        <a class="footer-big" href="mailto:${company.email}">${company.email}</a>
        <span class="footer-note">${company.emailNote}</span>
        <span class="footer-addr">${company.address}</span>
      </div>
      <div class="footer-col">
        <p class="footer-label">Мы на связи</p>
        <div class="footer-socials">${socials.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${socialIcon[s.id]}<span>${s.label}</span></a>`).join('')}</div>
      </div>
    </div>
    ${brandTrack('brand-track-footer')}
    <button class="btn btn-lime footer-cta" type="button" data-open-lead>${leadForm.submit}</button>
  </div>
  <div class="footer-bar">
    <a href="/requisites/">© 2026 ${company.legal}, ИНН ${company.inn}. Все права защищены</a>
    <div class="footer-legal">${legalNav.map((l) => `<a href="${l.href}">${l.label}</a>`).join('')}</div>
  </div>
</footer>`;
}

export function loader() {
  return `<div class="loader" data-loader aria-hidden="true">
  <div class="loader-inner">
    ${carOutline('loader-outline')}
    ${wordmark('loader-wordmark', '')}
    <div class="loader-bar"><i data-loader-bar></i></div>
  </div>
</div>
<script>try{if(sessionStorage.getItem('limee-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('no-intro')}catch(e){}</script>`;
}
