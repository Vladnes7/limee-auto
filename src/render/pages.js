import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { company, socials, links } from '../content/site.js';
import { esc, icon, socialIcon, products, brands, plural } from './ui.js';
import { leadSection, brandTrack } from './layout.js';
import { crumbs } from './catalog.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.resolve(here, '../../../_материалы/страницы');

// Minimal markdown for the verbatim legal texts: headings, lists, emphasis, paragraphs.
function md(src) {
  const body = src.split(/\n---\n/).slice(1).join('\n---\n').trim();
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<em>$2</em>');
  const out = [];
  let list = null;
  const flush = () => { if (list) { out.push(`<ul>${list.join('')}</ul>`); list = null; } };
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('## ')) { flush(); out.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('### ')) { flush(); out.push(`<h3>${inline(line.slice(4))}</h3>`); continue; }
    if (line.startsWith('- ')) { (list ||= []).push(`<li>${inline(line.slice(2))}</li>`); continue; }
    flush();
    if (/^_.+_$/.test(line)) out.push(`<p class="legal-kicker">${esc(line.slice(1, -1))}</p>`);
    else out.push(`<p>${inline(line)}</p>`);
  }
  flush();
  return out.join('\n');
}

function meta(src, key) {
  return (src.match(new RegExp(`^- ${key}: (.+)$`, 'm')) || [])[1]?.trim();
}

function legal(file, url) {
  const src = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  const title = src.match(/^# (.+)$/m)[1].trim();
  return {
    title,
    description: meta(src, 'meta description') || title,
    pageClass: 'page-legal',
    body: `<section class="page-hero page-hero-dark">
  <div class="page-hero-bg contours" aria-hidden="true"></div>
  ${crumbs([{ href: '/', label: 'Главная' }, { label: title }])}
  <h1 class="display page-title">${esc(title)}</h1>
</section>
<article class="legal">${md(src)}</article>`,
  };
}

export const renderPrivacy = () => legal('politika-konfidencialnosti.md');
export const renderTerms = () => legal('polzovatelskoe-soglashenie.md');
export const renderConsent = () => legal('soglasie-na-obrabotku-personalnyh-dannyh.md');
export const renderRequisites = () => legal('rekvizity.md');

export function renderAbout() {
  return {
    title: 'О компании',
    description: 'Limee Auto занимается подбором, покупкой и доставкой автомобилей из Китая в Россию: от поиска и проверки автомобиля до оформления документов, логистики и передачи машины клиенту.',
    pageClass: 'page-about',
    body: `<section class="page-hero page-hero-dark about-hero">
  <div class="page-hero-bg contours" aria-hidden="true"></div>
  ${crumbs([{ href: '/', label: 'Главная' }, { label: 'О компании' }])}
  <h1 class="display page-title">О <em>компании</em></h1>
  <p class="page-lead">Limee Auto более 5 лет занимается подбором, покупкой и доставкой автомобилей из Китая в Россию.</p>
</section>
<section class="about">
  <figure class="about-media"><img src="/media/site/about-1672.webp" srcset="/media/site/about-840.webp 840w, /media/site/about-1672.webp 1672w" sizes="(max-width: 900px) 100vw, 60vw" width="1672" height="941" alt="Автомобиль с номерным знаком Limee Auto" loading="eager" decoding="async"></figure>
  <div class="about-copy">
    <p class="about-big" data-reveal>За это время мы выстроили понятный и контролируемый процесс: от поиска подходящего автомобиля и проверки его состояния до оформления документов, логистики и передачи машины клиенту.</p>
    <p data-reveal>Мы работаем напрямую с китайским рынком, внимательно подходим к подбору каждого автомобиля и сопровождаем клиента на всех этапах сделки. Наша задача: сделать покупку автомобиля из Китая максимально простой, прозрачной и предсказуемой.</p>
    <p data-reveal>Limee Auto это не просто доставка автомобиля, а комплексное сопровождение от выбора машины до её получения в России.</p>
  </div>
  <ul class="number-list number-list-light">
    <li data-reveal><strong data-count="1000">1000</strong><span>Более 1000 авто под ключ</span></li>
    <li data-reveal><strong>РФ</strong><span>Работаем по всей России</span></li>
    <li data-reveal><strong data-count="5">5</strong><span>Опыт более 5 лет</span></li>
  </ul>
</section>
<section class="about-links">
  <a class="about-link" href="/catalog/"><span class="kicker">Каталог</span><span class="about-link-title">${products.length} ${plural(products.length, 'модель', 'модели', 'моделей')} с ценой под ключ</span></a>
  <a class="about-link" href="/#delivery-title"><span class="kicker">Процесс</span><span class="about-link-title">Как проходит покупка и доставка</span></a>
  <a class="about-link" href="/requisites/"><span class="kicker">${company.legal}</span><span class="about-link-title">Реквизиты компании</span></a>
</section>
${brandTrack()}
${leadSection()}`,
  };
}

export function renderContacts() {
  const maps = `https://yandex.ru/maps/?text=${encodeURIComponent(company.address)}`;
  return {
    title: 'Контакты',
    description: `Телефон ${company.phone}, ${company.hours.toLowerCase()}. E-mail ${company.email}. Адрес: ${company.address}.`,
    pageClass: 'page-contacts',
    body: `<section class="page-hero page-hero-dark">
  <div class="page-hero-bg contours" aria-hidden="true"></div>
  ${crumbs([{ href: '/', label: 'Главная' }, { label: 'Контакты' }])}
  <h1 class="display page-title"><em>Контакты</em></h1>
</section>
<section class="contacts">
  <div class="contact-main">
    <a class="contact-big" href="${company.phoneHref}">${company.phone}</a>
    <p class="contact-note">${company.hours}</p>
    <a class="contact-big contact-mail" href="mailto:${company.email}">${company.email}</a>
    <p class="contact-note">${company.emailNote}</p>
    <div class="contact-addr">
      <p class="kicker">Адрес</p>
      <p>${company.address}</p>
      <a class="link-arrow" href="${maps}" target="_blank" rel="noopener">Открыть в Яндекс Картах</a>
    </div>
  </div>
  <div class="contact-side">
    <p class="kicker">Мессенджеры и соцсети</p>
    <ul class="contact-socials">${socials.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener">${socialIcon[s.id]}<span>${s.label}</span></a></li>`).join('')}</ul>
  </div>
  <div class="contact-req">
    <div class="contact-req-head">
      <p class="kicker">Реквизиты</p>
      <p class="contact-req-name">${company.legal}</p>
      <a class="link-arrow" href="/requisites/">Все реквизиты</a>
    </div>
    <dl>
      <div><dt>ОГРН</dt><dd>${company.ogrn}</dd></div>
      <div><dt>ИНН</dt><dd>${company.inn}</dd></div>
      <div><dt>КПП</dt><dd>${company.kpp}</dd></div>
      <div><dt>БИК</dt><dd>${company.bik}</dd></div>
      <div><dt>Р/с</dt><dd>${company.account}</dd></div>
      <div><dt>К/с</dt><dd>${company.corr}</dd></div>
      <div class="contact-req-wide"><dt>Банк</dt><dd>${company.bank}</dd></div>
    </dl>
  </div>
</section>
${leadSection()}`,
  };
}

export function renderNotFound() {
  return {
    title: 'Страница не найдена',
    description: 'Такой страницы нет на сайте Limee Auto.',
    pageClass: 'page-404',
    noindex: true,
    body: `<section class="page-hero page-hero-dark nf">
  <div class="page-hero-bg contours" aria-hidden="true"></div>
  <p class="nf-code display">404</p>
  <h1 class="display page-title">Такой страницы <em>нет</em></h1>
  <p class="page-lead">Возможно, ссылка устарела. Начните с каталога или главной.</p>
  <div class="nf-actions"><a class="btn btn-lime" href="/catalog/">Каталог автомобилей</a><a class="btn btn-ghost" href="/">На главную</a></div>
</section>`,
  };
}

export { links, brands };
