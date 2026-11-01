// Generates the topographic contour backgrounds (landonorris-style line fields) as static SVGs.
// Deterministic: the same seed always draws the same lines.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contours } from 'd3-contour';
import { geoPath } from 'd3-geo';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../public/media/art');
fs.mkdirSync(out, { recursive: true });

function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Smooth value noise built from a few random gaussian bumps: reads like terrain, never like a grid.
function field(w, h, seed, bumps) {
  const r = rng(seed);
  const hills = Array.from({ length: bumps }, () => ({
    x: r() * w, y: r() * h, s: (0.07 + r() * 0.2) * Math.max(w, h), a: (r() - 0.35) * 2,
  }));
  const v = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (const k of hills) {
        const dx = x - k.x, dy = y - k.y;
        s += k.a * Math.exp(-(dx * dx + dy * dy) / (2 * k.s * k.s));
      }
      v[y * w + x] = s;
    }
  }
  return v;
}

function draw(name, { w, h, seed, bumps, levels, scale }) {
  const values = field(w, h, seed, bumps);
  let min = Infinity, max = -Infinity;
  for (const x of values) { if (x < min) min = x; if (x > max) max = x; }
  const thresholds = Array.from({ length: levels }, (_, i) => min + ((max - min) * (i + 1)) / (levels + 1));
  const polys = contours().size([w, h]).smooth(true).thresholds(thresholds)(Array.from(values));
  const pathGen = geoPath();
  const d = polys.map((p) => pathGen(p)).filter(Boolean).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" preserveAspectRatio="xMidYMid slice"><path d="${d.replace(/(\d+\.\d)\d+/g, '$1')}" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
  fs.writeFileSync(path.join(out, `${name}.svg`), svg);
  console.log(name, Math.round(svg.length / 1024) + 'KB');
}

draw('contours-a', { w: 320, h: 200, seed: 7, bumps: 26, levels: 26, scale: 6 });
draw('contours-b', { w: 240, h: 240, seed: 31, bumps: 22, levels: 22, scale: 6 });
draw('contours-c', { w: 320, h: 140, seed: 93, bumps: 20, levels: 18, scale: 6 });
