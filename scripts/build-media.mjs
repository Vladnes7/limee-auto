// Prepares web media from the parsed materials:
//  - brand logos -> public/media/brands/<slug>.png (single-colour alpha masks) + src/data/brand-marks.json
//  - catalogue photos -> public/media/cars/<slug>/<n>-<width>.webp
//  - favicon / touch icon from the client's logo
// Re-running skips files that already exist (pass --force to rebuild).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, '..');
const project = path.resolve(site, '..');
const materials = path.join(project, '_материалы');
const force = process.argv.includes('--force');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

const catalog = JSON.parse(fs.readFileSync(path.join(site, 'src/data/catalog.json'), 'utf8'));
const ensureDir = (d) => fs.mkdirSync(d, { recursive: true });
const exists = (f) => !force && fs.existsSync(f);

async function pool(items, size, fn) {
  let i = 0;
  const workers = Array.from({ length: size }, async () => {
    while (i < items.length) {
      const k = i++;
      await fn(items[k], k);
    }
  });
  await Promise.all(workers);
}

// ---------- brand logos ----------
async function logos() {
  const out = path.join(site, 'public/media/brands');
  ensureDir(out);
  const clientDir = path.join(materials, 'фото/каталог/_логотипы-брендов');
  const webDir = path.join(materials, 'фото/логотипы-марок-веб');
  const marks = {};

  for (const b of catalog.brands) {
    const file = path.join(out, `${b.slug}.png`);
    let img;
    if (b.slug === 'hongqi') {
      // Client file embeds a colour raster. Vector calligraphic mark from Wikipedia (File:Hongqi logo.svg).
      img = sharp(path.join(webDir, 'Hongqi_logo.svg'), { density: 600 }).ensureAlpha().extractChannel('alpha');
    } else if (b.slug === 'denza') {
      // Client file embeds a colour raster. Wordmark from Wikipedia (File:Denza Logo.svg), emblem cropped off.
      const src = sharp(path.join(webDir, 'denza-wordmark.png'));
      const { width, height } = await src.metadata();
      img = src.extract({ left: Math.round(width * 0.27), top: 0, width: Math.round(width * 0.73), height }).ensureAlpha().extractChannel('alpha');
    } else {
      // Client SVG: white mark on a black rounded tile. Luminance becomes the mask, so the tile disappears.
      img = sharp(path.join(clientDir, `${b.slug}.svg`), { density: 1200 }).flatten({ background: '#000' }).greyscale();
    }
    const mask = await img.toColourspace('b-w').raw().toBuffer({ resolveWithObject: true });
    const { data, info } = mask;
    const rgba = Buffer.alloc(info.width * info.height * 4);
    for (let p = 0; p < info.width * info.height; p++) {
      rgba[p * 4 + 3] = data[p * info.channels];
    }
    const trimmed = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .trim({ threshold: 8 })
      .toBuffer({ resolveWithObject: true });
    const scale = Math.min(1, 360 / trimmed.info.height, 1200 / trimmed.info.width);
    const w = Math.round(trimmed.info.width * scale);
    const h = Math.round(trimmed.info.height * scale);
    if (!exists(file)) await sharp(trimmed.data, { raw: { width: trimmed.info.width, height: trimmed.info.height, channels: 4 } }).resize(w, h).png({ compressionLevel: 9 }).toFile(file);
    marks[b.slug] = { w, h, ratio: +(w / h).toFixed(3) };
  }
  fs.writeFileSync(path.join(site, 'src/data/brand-marks.json'), JSON.stringify(marks, null, 1));
  console.log('logos', Object.keys(marks).length);
}

// ---------- catalogue photos ----------
async function cars() {
  const jobs = [];
  for (const p of catalog.products) {
    const dir = path.join(site, 'public/media/cars', p.slug);
    ensureDir(dir);
    for (const ph of p.photos) {
      const src = path.join(project, ph.src);
      const widths = ph.n === 1 ? [640, 1280, 1920] : [640, 1280];
      for (const w of widths) {
        const dest = path.join(dir, `${ph.n}-${w}.webp`);
        if (!exists(dest)) jobs.push({ src, dest, w });
      }
    }
  }
  let done = 0;
  await pool(jobs, Math.max(2, os.cpus().length - 1), async (j) => {
    try {
      await sharp(j.src).rotate().resize({ width: j.w, withoutEnlargement: true }).webp({ quality: j.w >= 1920 ? 78 : 74, effort: 4 }).toFile(j.dest);
    } catch (e) {
      console.error('fail', j.src, e.message);
    }
    if (++done % 250 === 0) console.log(`cars ${done}/${jobs.length}`);
  });
  console.log('cars done', jobs.length);
}

// ---------- icons ----------
async function icons() {
  const out = path.join(site, 'public');
  const src = path.join(materials, 'фото/логотип/favicon-site-icon_original-1080.jpg');
  if (!exists(path.join(out, 'apple-touch-icon.png'))) await sharp(src).resize(180, 180).png().toFile(path.join(out, 'apple-touch-icon.png'));
  if (!exists(path.join(out, 'icon-512.png'))) await sharp(src).resize(512, 512).png().toFile(path.join(out, 'icon-512.png'));
  if (!exists(path.join(out, 'favicon-32.png'))) await sharp(src).extract({ left: 60, top: 300, width: 960, height: 480 }).resize(32, 32, { fit: 'contain', background: '#000' }).png().toFile(path.join(out, 'favicon-32.png'));
  console.log('icons ok');
}

// ---------- images from the old site (steps, section backgrounds, about) ----------
async function siteImages() {
  const out = path.join(site, 'public/media/site');
  ensureDir(out);
  const f = path.join(materials, 'фото');
  const list = [
    ['step-1', 'заведение/etap-1_vybor-avto_range-rover.png', [480, 848]],
    ['step-2', 'заведение/etap-2_bron-dogovor_audi.png', [480, 848]],
    ['step-3', 'заведение/etap-3_dostavka_suv.png', [480, 848]],
    ['step-4', 'на-доработку/etap-4_biznes-tur_porsche.png', [535]],
    ['about', 'заведение/o-kompanii_autolime-1.png', [840, 1672]],
    ['checks', 'услуги/glavnaya-proverka-yur_fon-32ak2-1.png', [700, 1390]],
    ['review', 'услуги/glavnaya-foto-videoobzor_fon-809-1.png', [840, 1661]],
  ];
  for (const [name, src, widths] of list) {
    for (const w of widths) {
      const dest = path.join(out, `${name}-${w}.webp`);
      if (!exists(dest)) await sharp(path.join(f, src)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
    }
  }
  console.log('site images ok');
}

// ---------- social preview: hero car + client wordmark ----------
async function og() {
  const dest = path.join(site, 'public/media/og.jpg');
  if (exists(dest)) return;
  const { wordmark, carOutline } = await import('../src/render/brand.js');
  const photo = path.join(site, 'public/media/cars/bentley-continental-plug-in-hybrid/1-1920.webp');
  const shade = Buffer.from(`<svg width="1200" height="630"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#050605" stop-opacity=".92"/><stop offset=".55" stop-color="#050605" stop-opacity=".25"/><stop offset="1" stop-color="#050605" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>`);
  const mark = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><style>.logo-accent{fill:#d5ff00}.car-line{fill:none;stroke:#d5ff00;stroke-width:5;stroke-linecap:round}</style><g transform="translate(64,170) scale(.42)">${carOutline().replace(/<svg[^>]*>|<\/svg>/g, '')}</g><g transform="translate(64,320) scale(.62)" color="#eef0e8">${wordmark().replace(/<svg[^>]*>|<\/svg>/g, '')}</g></svg>`);
  const car = await sharp(photo).resize(900, 630, { fit: 'cover', position: 'centre' }).toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#050605' } })
    .composite([{ input: car, left: 300, top: 0 }, { input: shade }, { input: mark }])
    .jpeg({ quality: 82 })
    .toFile(dest);
  console.log('og ok');
}

if (!only || only === 'og') await og();
if (!only || only === 'site') await siteImages();
if (!only || only === 'logos') await logos();
if (!only || only === 'icons') await icons();
if (!only || only === 'cars') await cars();
