// Interaction smoke test against a running server: node scripts/check.mjs [baseUrl]
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const base = process.argv[2] || 'http://127.0.0.1:4310';
const out = process.argv[3] || 'check-shots';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const results = [];
const ok = (name, pass, info = '') => results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? `  (${info})` : ''}`);

async function page(w = 1440, h = 900, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...opts });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && p.errors.push(m.text()));
  return p;
}

// 1. Intro loader draws, then leaves; second visit in the same session skips it.
{
  const p = await page();
  await p.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${out}/loader-mid.jpg`, type: 'jpeg', quality: 70 });
  const during = await p.$('[data-loader]');
  await p.waitForTimeout(3000);
  const after = await p.$('[data-loader]');
  ok('intro loader shows then removes itself', Boolean(during) && !after);
  await p.screenshot({ path: `${out}/hero-after.jpg`, type: 'jpeg', quality: 70 });
  await p.goto(base + '/catalog/');
  await p.goto(base + '/');
  ok('intro skipped on second visit', (await p.$('[data-loader]')) === null || (await p.evaluate(() => document.documentElement.classList.contains('no-intro'))));
  ok('home: no JS errors', p.errors.length === 0, p.errors.slice(0, 3).join(' | '));
  await p.context().close();
}

// 2. Lead dialog + validation + WhatsApp hand-off
{
  const p = await page();
  await p.goto(base + '/about/');
  await p.click('.header-cta');
  ok('dialog opens from header', await p.evaluate(() => document.querySelector('[data-lead-dialog]').open));
  await p.click('[data-lead-dialog] button[type=submit]');
  const err = await p.textContent('#dlg-phone-err');
  ok('empty phone is rejected with a message', err.includes('номер'), err);
  await p.fill('#dlg-phone', '9091234567');
  const formatted = await p.inputValue('#dlg-phone');
  ok('phone mask formats', formatted === '+7 (909) 123-45-67', formatted);
  await p.click('[data-lead-dialog] button[type=submit]');
  const cErr = await p.textContent('#dlg-consent-err');
  ok('consent is required', cErr.includes('согласие'), cErr);
  await p.check('[data-lead-dialog] input[name=consent]', { force: true });
  await p.fill('#dlg-model', 'Zeekr 001');
  const [popup] = await Promise.all([p.waitForEvent('popup', { timeout: 5000 }).catch(() => null), p.click('[data-lead-dialog] button[type=submit]')]);
  const url = popup ? popup.url() : '';
  ok('submit opens WhatsApp with the request text', url.includes('wa.me/79661569498') || url.includes('api.whatsapp.com') || url.includes('whatsapp'), url.slice(0, 120));
  ok('success state shown', await p.isVisible('[data-lead-dialog] .lead-done'));
  await p.screenshot({ path: `${out}/dialog-done.jpg`, type: 'jpeg', quality: 70 });
  await p.keyboard.press('Escape');
  ok('Escape closes dialog', !(await p.evaluate(() => document.querySelector('[data-lead-dialog]').open)));
  await p.context().close();
}

// 3. Catalogue filters
{
  const p = await page();
  await p.goto(base + '/catalog/');
  const visible = () => p.$$eval('[data-car]:not([hidden])', (els) => els.length);
  const count = () => p.textContent('[data-cat-count]');
  ok('catalog starts with 24 cards and 251 total', (await visible()) === 24 && (await count()) === '251', `${await visible()} / ${await count()}`);
  await p.selectOption('#cat-brand', 'bmw');
  await p.waitForTimeout(200);
  ok('brand filter: BMW = 22', (await count()) === '22', await count());
  ok('URL keeps the filter', p.url().includes('brand=bmw'));
  await p.fill('#cat-q', 'i7');
  await p.waitForTimeout(400);
  const names = await p.$$eval('[data-car]:not([hidden]) .car-card-name', (els) => els.map((e) => e.textContent));
  ok('search narrows to i7 models', names.length > 0 && names.every((n) => /i7/i.test(n)), names.join(', '));
  await p.fill('#cat-q', 'zzzz');
  await p.waitForTimeout(400);
  ok('empty state appears', await p.isVisible('[data-cat-empty]'));
  await p.click('[data-cat-reset]');
  await p.waitForTimeout(200);
  ok('reset restores all', (await count()) === '251');
  await p.selectOption('#cat-sort', 'price-asc');
  await p.waitForTimeout(200);
  const prices = await p.$$eval('[data-car]:not([hidden])', (els) => els.map((e) => Number(e.dataset.price) || Infinity));
  ok('sort by price ascending', prices.every((v, i) => i === 0 || v >= prices[i - 1]));
  await p.click('[data-cat-more]');
  ok('show more adds cards', (await visible()) === 48, String(await visible()));
  await p.goto(base + '/catalog/?brand=zeekr');
  ok('deep link ?brand=zeekr works', (await count()) === '7', await count());
  ok('catalog: no JS errors', p.errors.length === 0, p.errors.slice(0, 3).join(' | '));
  await p.context().close();
}

// 4. Car page: trims recalc, gallery
{
  const p = await page();
  await p.goto(base + '/cars/porsche-911/');
  const t0 = await p.textContent('[data-calc-total]');
  await p.click('[data-trim="3"]');
  const t1 = await p.textContent('[data-calc-total]');
  ok('choosing a trim recalculates the total', t0 !== t1, `${t0} -> ${t1}`);
  ok('trim button marks pressed', (await p.getAttribute('[data-trim="3"]', 'aria-pressed')) === 'true');
  await p.click('[data-gallery-next]');
  await p.waitForTimeout(900);
  ok('gallery next moves to photo 2', (await p.textContent('[data-gallery-index]')) === '2');
  await p.click('.car-hero [data-open-lead]');
  ok('lead dialog prefilled with the model', (await p.inputValue('#dlg-model')) === 'Porsche 911');
  ok('car page: no JS errors', p.errors.length === 0, p.errors.slice(0, 3).join(' | '));
  await p.context().close();
}

// 5. Mobile menu
{
  const p = await page(390, 844, { isMobile: true, hasTouch: true });
  await p.goto(base + '/contacts/');
  await p.click('[data-menu-toggle]');
  await p.waitForTimeout(700);
  ok('mobile menu opens', await p.isVisible('[data-menu] .menu-link'));
  await p.screenshot({ path: `${out}/menu.jpg`, type: 'jpeg', quality: 70 });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(700);
  ok('menu closes on Escape', await p.$eval('[data-menu]', (m) => m.hidden));
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok('no horizontal scroll at 390px', overflow <= 0, String(overflow));
  await p.context().close();
}

// 6. Horizontal overflow across key pages at phone width
{
  const p = await page(375, 812, { isMobile: true, hasTouch: true });
  const bad = [];
  for (const u of ['/', '/catalog/', '/brands/bmw/', '/cars/lixiang-ideal-l9/', '/about/', '/contacts/', '/privacy/', '/terms/', '/consent/', '/requisites/', '/404/']) {
    await p.goto(base + u);
    await p.waitForTimeout(400);
    const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (o > 0) bad.push(`${u}:${o}`);
  }
  ok('no horizontal overflow at 375px on 11 pages', bad.length === 0, bad.join(', '));
  await p.context().close();
}

// 7. Reduced motion: no loader, route fully drawn
{
  const p = await page(1440, 900, { reducedMotion: 'reduce' });
  await p.goto(base + '/');
  ok('reduced motion skips the intro', (await p.$('[data-loader]')) === null);
  const off = await p.$eval('.route-line', (el) => getComputedStyle(el).strokeDashoffset);
  ok('reduced motion shows the full route', parseFloat(off) === 0, off);
  await p.context().close();
}

console.log(results.join('\n'));
await browser.close();
