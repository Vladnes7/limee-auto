// Limee Auto identity pieces rendered inline: the wordmark (client's own SVG) and the car outline
// from the lime logo (redrawn as strokes so it can be animated).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const logoFile = path.resolve(here, '../../../_материалы/фото/логотип/logo-home-block_logo-1.svg');
const raw = fs.readFileSync(logoFile, 'utf8');
const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// White letters follow the text colour; the grey second «Ξ» becomes the lime accent, as on the lime logo.
const body = inner.replace(/fill="white"/g, 'fill="currentColor"').replace(/fill="#8E9093"/g, 'class="logo-accent"');

export function wordmark(cls = '', label = 'Limee Auto') {
  return `<svg class="wordmark ${cls}" viewBox="0 0 459 142" role="img" aria-label="${label}">${body}</svg>`;
}

// Car outline: roof, window line, the two crossing body lines and the ground line of the lime logo.
export const carLines = [
  'M14 228C26 170 104 146 214 118C292 98 352 60 434 36C524 12 650 16 768 70C834 100 884 146 900 208',
  'M300 118C380 76 468 50 562 44C664 40 762 76 852 116',
  'M104 160C244 124 378 142 480 168C600 198 724 246 884 246',
  'M66 210C214 222 374 210 480 168C584 126 718 108 836 128',
  'M110 250H584',
];

export function carOutline(cls = '') {
  return `<svg class="car-outline ${cls}" viewBox="0 0 920 270" aria-hidden="true" fill="none">${carLines
    .map((d, i) => `<path class="car-line car-line-${i + 1}" d="${d}" pathLength="1"/>`)
    .join('')}</svg>`;
}
