// GitHub Pages serves this project under a sub-path (https://vladnes7.github.io/limee-auto/), while the
// site links to its own pages and files from the root ("/catalog/", "/media/..."). After `npm run build`
// this rewrites every root link in dist to start with the sub-path. Only the Pages build runs it; the
// VPS / own-domain builds stay on root paths.
// Usage: node scripts/pages-base.mjs dist /limee-auto
import fs from 'node:fs';
import path from 'node:path';

const [dir = 'dist', baseArg = '/limee-auto'] = process.argv.slice(2);
const BASE = `/${baseArg.replace(/^\/+|\/+$/g, '')}`;

// Everything at the top of dist is a root link target: pages (about/, catalog/ ...), assets, media, icons.
const roots = fs.readdirSync(dir).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
// "/name" right after a quote, bracket, = , comma or space, and followed by / " ' ` ) ? # space or the end.
const link = new RegExp(`(^|[\\s"'\`(=,])/(${roots.join('|')})(?=[/"'\`)?#\\s,]|$)`, 'g');
const home = /(href=)(["'])\/\2/g; // the bare root link (logo, "home")

let files = 0;
let hits = 0;
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(html|js|css|json|webmanifest|svg|xml)$/i.test(e.name)) {
      const src = fs.readFileSync(p, 'utf8');
      let n = 0;
      const out = src
        .replace(link, (_, pre, name) => (n++, `${pre}${BASE}/${name}`))
        .replace(home, (_, attr, q) => (n++, `${attr}${q}${BASE}/${q}`));
      if (n) {
        fs.writeFileSync(p, out);
        files++;
        hits += n;
      }
    }
  }
}
walk(dir);
console.log(`pages-base: ${hits} links in ${files} files now start with ${BASE}/`);
