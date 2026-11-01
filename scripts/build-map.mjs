// Dot-matrix map of Eurasia (Natural Earth 110m via world-atlas) for the delivery section.
// Writes the static dot field to public/media/art/eurasia-dots.svg and the route geometry
// (projected into the same viewBox) to src/data/map.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { geoAzimuthalEqualArea, geoContains, geoInterpolate } from 'd3-geo';
import { feature } from 'topojson-client';

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, '..');
const req = (p) => JSON.parse(fs.readFileSync(path.join(site, 'node_modules', p), 'utf8'));
const land = feature(req('world-atlas/land-110m.json'), req('world-atlas/land-110m.json').objects.land);
const countries = feature(req('world-atlas/countries-110m.json'), req('world-atlas/countries-110m.json').objects.countries);
const russia = countries.features.find((f) => Number(f.id) === 643);
const china = countries.features.find((f) => Number(f.id) === 156);

const W = 1200, H = 680, STEP = 7.5;
const projection = geoAzimuthalEqualArea().rotate([-82, -50]).fitExtent(
  [[30, 40], [W - 30, H - 30]],
  { type: 'MultiPoint', coordinates: [[24, 70], [170, 68], [30, 28], [125, 18], [100, 80], [60, 78]] },
);

const groups = { world: [], russia: [], china: [] };
for (let y = STEP / 2; y < H; y += STEP) {
  for (let x = STEP / 2; x < W; x += STEP) {
    const ll = projection.invert([x, y]);
    if (!ll || !geoContains(land, ll)) continue;
    const key = geoContains(china, ll) ? 'china' : geoContains(russia, ll) ? 'russia' : 'world';
    groups[key].push(`M${x.toFixed(1)} ${y.toFixed(1)}h0`);
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<g fill="none" stroke-linecap="round">
<path d="${groups.world.join('')}" stroke="#34372f" stroke-width="2.4"/>
<path d="${groups.russia.join('')}" stroke="#b9bcb4" stroke-width="2.8"/>
<path d="${groups.china.join('')}" stroke="#d5ff00" stroke-width="2.9"/>
</g></svg>`;
fs.mkdirSync(path.join(site, 'public/media/art'), { recursive: true });
fs.writeFileSync(path.join(site, 'public/media/art/eurasia-dots.svg'), svg);

// Route: along the great circle from Beijing to Moscow, bowed slightly north so it reads as a journey.
const from = [116.4, 39.9], to = [37.62, 55.75];
const interp = geoInterpolate(from, to);
const pts = Array.from({ length: 40 }, (_, i) => {
  const t = i / 39;
  const [lon, lat] = interp(t);
  return projection([lon, lat + Math.sin(Math.PI * t) * 4]);
});
let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
for (let i = 1; i < pts.length - 1; i++) {
  const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
  d += `Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
}
d += `L${pts.at(-1)[0].toFixed(1)} ${pts.at(-1)[1].toFixed(1)}`;

const label = (ll) => projection(ll).map((n) => +n.toFixed(1));
const map = {
  w: W, h: H, route: d,
  from: label(from), to: label(to),
  labels: { russia: label([96, 63]), china: label([103, 33]), moscow: label(to) },
};
fs.writeFileSync(path.join(site, 'src/data/map.json'), JSON.stringify(map));
console.log('dots', groups.world.length, groups.russia.length, groups.china.length, 'svg', Math.round(svg.length / 1024) + 'KB');
