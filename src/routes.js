import { company } from './content/site.js';
import { esc, products, brands } from './render/ui.js';
import { header, footer, leadDialog, loader } from './render/layout.js';
import { renderHome } from './render/home.js';
import { renderCatalog, renderBrand } from './render/catalog.js';
import { renderCar } from './render/car.js';
import { renderAbout, renderContacts, renderPrivacy, renderTerms, renderConsent, renderRequisites, renderNotFound } from './render/pages.js';

const fixed = {
  '/': renderHome,
  '/catalog/': renderCatalog,
  '/about/': renderAbout,
  '/contacts/': renderContacts,
  '/requisites/': renderRequisites,
  '/privacy/': renderPrivacy,
  '/terms/': renderTerms,
  '/consent/': renderConsent,
  '/404/': renderNotFound,
};

export const routes = [
  ...Object.keys(fixed),
  ...brands.map((b) => `/brands/${b.slug}/`),
  ...products.map((p) => `/cars/${p.slug}/`),
];

function resolve(path) {
  if (fixed[path]) return fixed[path]();
  let m = path.match(/^\/brands\/([^/]+)\/$/);
  if (m && brands.some((b) => b.slug === m[1])) return renderBrand(m[1]);
  m = path.match(/^\/cars\/([^/]+)\/$/);
  if (m && products.some((p) => p.slug === m[1])) return renderCar(m[1]);
  return null;
}

const org = {
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',
  name: company.brand,
  legalName: company.legal,
  url: company.site,
  telephone: '+79099868888',
  email: company.email,
  address: { '@type': 'PostalAddress', streetAddress: 'Нижний Сусальный пер., д. 5, стр. 19', addressLocality: 'Москва', postalCode: '105064', addressCountry: 'RU' },
  openingHours: 'Mo-Su 09:00-21:00',
  logo: `${company.site}/icon-512.png`,
};

export function render(path) {
  const page = resolve(path);
  if (!page) return null;
  const url = `${company.site}${path === '/404/' ? '/' : path}`;
  const title = path === '/' ? page.title : `${page.title} | ${company.brand}`;
  const image = `${company.site}${page.image || '/media/og.jpg'}`;
  const ld = [path === '/' ? org : null, page.jsonLd].filter(Boolean);
  const head = `<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
${page.noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="${company.brand}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
${ld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}`;
  const body = `${page.intro ? loader() : ''}
${header(path)}
<main id="main" class="${page.pageClass}">
${page.body}
</main>
${footer()}
${leadDialog()}
<div class="vt-curtain" aria-hidden="true"></div>`;
  return { head, body, pageClass: page.pageClass };
}
