import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Every page is rendered to static HTML at build time from src/routes.js.
// In dev the same renderer answers each route through middleware, re-imported on every request.
const ROUTES = path.resolve('src/routes.js');

async function load(server) {
  if (server) return server.ssrLoadModule(ROUTES);
  return import(`${ROUTES}?t=${Date.now()}`);
}

const fill = (shell, page) => shell.replace('<!--head-->', page.head).replace('<!--app-->', page.body);

const normalize = (url) => {
  const p = decodeURI((url || '/').split('?')[0].split('#')[0]);
  if (p === '/index.html') return '/';
  return p.endsWith('/') ? p : `${p}/`;
};

function staticPages() {
  let routesMod;
  return {
    name: 'limee-static-pages',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const accept = req.headers.accept || '';
        if (req.method !== 'GET' || !accept.includes('text/html')) return next();
        const p = normalize(req.url);
        if (/\.[a-z0-9]+\/$/i.test(p)) return next();
        try {
          const mod = await load(server);
          const page = mod.render(p) || mod.render('/404/');
          const shell = fs.readFileSync(path.resolve('index.html'), 'utf8');
          const html = await server.transformIndexHtml(req.url, fill(shell, page));
          res.statusCode = mod.render(p) ? 200 : 404;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (e) {
          server.ssrFixStacktrace?.(e);
          next(e);
        }
      });
    },
    async buildStart() {
      routesMod = await load();
    },
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        // Vite has processed the shell (hashed script/style tags); placeholders are still in it.
        const raw = String(bundle['index.html'].source);
        if (!raw.includes('<!--head-->') || !raw.includes('<!--app-->')) throw new Error('HTML shell lost its placeholders');
        bundle['index.html'].source = fill(raw, routesMod.render('/'));
        for (const route of routesMod.routes) {
          if (route === '/') continue;
          const page = routesMod.render(route);
          const file = route === '/404/' ? '404.html' : `${route.slice(1)}index.html`;
          this.emitFile({ type: 'asset', fileName: file, source: fill(raw, page) });
        }
        const urls = routesMod.routes.filter((r) => r !== '/404/').map((r) => `<url><loc>https://autolimee.ru${r}</loc></url>`).join('');
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>` });
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: 'User-agent: *\nAllow: /\nSitemap: https://autolimee.ru/sitemap.xml\n' });
      },
    },
  };
}

export default defineConfig({
  plugins: [staticPages()],
  server: { host: '127.0.0.1', port: 4310 },
  build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 700 },
});
