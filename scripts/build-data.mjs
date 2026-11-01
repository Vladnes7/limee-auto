// Builds src/data/catalog.json from the parsed catalogue (_материалы/каталог/товары.json).
// Only reshapes and cleans the client's data. Nothing is added that is not in the source.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '../..');
const source = path.join(projectRoot, '_материалы/каталог/товары.json');
const outFile = path.resolve(here, '../src/data/catalog.json');
const MAX_PHOTOS = 8;

const raw = JSON.parse(fs.readFileSync(source, 'utf8'));

const clean = (s) => String(s ?? '').replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const ENGINE_NAMES = {
  метаноловый_гибрид: 'Метаноловый гибрид',
  бензиновый_электропривод: 'Бензин + электропривод',
};
const BODY_NAMES = { 'хэтчбек-кроссовер': 'Хэтчбек-кроссовер' };

function engineType(v) {
  const t = clean(v);
  if (!t || /^\d+$/.test(t)) return null; // one record holds a stray number
  return ENGINE_NAMES[t] || cap(t);
}

function volume(v) {
  const t = clean(v);
  // Real displacement looks like "2.0 T" / "1.5 L". Plain numbers are power stored in the wrong field.
  const m = t.match(/^(\d(?:\.\d)?)\s*([LT])$/i);
  if (!m) return null;
  return `${m[1].replace('.', ',')} л${m[2].toUpperCase() === 'T' ? ', турбо' : ''}`;
}

function modelName(name, brand) {
  let n = clean(name);
  if (n.toUpperCase().startsWith(brand.toUpperCase() + ' ')) n = n.slice(brand.length + 1);
  return cap(n);
}

const brands = new Map();
const products = [];

for (const p of raw.products) {
  const brand = clean(p.brand);
  const brandSlug = p.brand_slug;
  const photos = p.images.filter((i) => i.local && i.downloaded !== false).slice(0, MAX_PHOTOS);
  if (!photos.length) continue;

  const seen = new Map();
  const trims = p.variations.map((v) => {
    const a = v.attributes;
    let title = cap(clean(v.trim_name || a['Комплектация']));
    const key = title.toLowerCase();
    seen.set(key, (seen.get(key) || 0) + 1);
    if (seen.get(key) > 1) title += ` (вариант ${seen.get(key)})`;
    // Source power is only trustworthy for pure EVs: on petrol and hybrid trims horsepower values
    // were saved into the kW field (911 Carrera 3.0T: «394 кВт» is in fact 394 л.с.).
    const electric = clean(a['Двигатель']) === 'Электрический';
    const kw = electric ? Number(a['Мощность кВт']) || null : null;
    const hp = kw ? Math.round(kw * 1.35962) : null;
    return {
      id: v.id,
      title,
      cny: v.priceCny || 0,
      year: clean(a['Год']) || null,
      body: BODY_NAMES[clean(a['Кузов'])] || clean(a['Кузов']) || null,
      drive: clean(a['Привод']) || null,
      gearbox: a['КПП'] && a['КПП'] !== 'undefined' ? clean(a['КПП']) : null,
      engine: engineType(a['Двигатель']),
      volume: volume(a['Объем двигателя']),
      kw,
      hp,
      util: Boolean(v.preferentialUtil),
    };
  });

  // Power is unreliable in the source for some models: the same kW is copied onto trims with
  // different engines (e.g. 911 Carrera 3.0T and GTS 3.6T both 394 kW). Hide it there.
  const byVolume = new Map();
  for (const t of trims) if (t.kw && t.volume) byVolume.set(t.volume, new Set([...(byVolume.get(t.volume) || []), t.kw]));
  const kwSets = [...byVolume.values()].map((s) => [...s].join());
  if (kwSets.length > 1 && new Set(kwSets).size === 1) for (const t of trims) { t.kw = null; t.hp = null; }

  const priced = trims.filter((t) => t.cny > 0).map((t) => t.cny);
  const years = [...new Set(trims.map((t) => t.year).filter(Boolean))].sort();
  const first = trims[0];
  const model = {
    slug: p.slug,
    name: clean(p.name),
    model: modelName(p.name, brand),
    brand,
    brandSlug,
    years,
    body: first.body,
    drive: [...new Set(trims.map((t) => t.drive).filter(Boolean))],
    engine: first.engine,
    engines: [...new Set(trims.map((t) => t.engine).filter(Boolean))],
    minCny: priced.length ? Math.min(...priced) : 0,
    maxCny: priced.length ? Math.max(...priced) : 0,
    util: trims.some((t) => t.util),
    trims,
    photos: photos.map((ph, i) => ({ n: i + 1, src: ph.local, w: ph.width, h: ph.height })),
    date: p.date_published,
  };
  products.push(model);

  if (!brands.has(brandSlug)) brands.set(brandSlug, { slug: brandSlug, name: brand, count: 0 });
  brands.get(brandSlug).count += 1;
}

const fees = raw.products[0].variations[0].static_fees.map((f) => ({ label: f.label, value: f.value }));

const out = {
  generated: new Date().toISOString().slice(0, 10),
  rate: { cny: raw.meta.rate_cny_rub, date: raw.meta.generated },
  fees,
  brands: [...brands.values()].sort((a, b) => a.name.localeCompare(b.name, 'en')),
  products,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out));
console.log(`models ${products.length}, brands ${out.brands.length}, trims ${products.reduce((s, p) => s + p.trims.length, 0)}`);
