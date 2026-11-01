import { intro, pageHero, reveals, counters, steps, fan, delivery } from './js/motion.js';
import { film } from './js/film.js';
import { initLead } from './js/lead.js';
import { initCatalog } from './js/catalog.js';
import { initGallery, initConfig } from './js/car.js';
import { getRate, applyRate } from './js/rate.js';

document.documentElement.classList.add('js');

// ---------- header: solid after the hero, hides on scroll down, returns on scroll up ----------
function header() {
  const h = document.querySelector('[data-header]');
  if (!h) return;
  let last = scrollY;
  let ticking = false;
  // Pages that open on a light section keep the header dark from the first pixel.
  const forceSolid = Boolean(document.querySelector('main > section:first-child.page-hero-light'));
  const update = () => {
    const y = scrollY;
    const menuOpen = document.documentElement.classList.contains('menu-open');
    h.classList.toggle('is-solid', forceSolid || y > 40 || menuOpen);
    const hide = !menuOpen && y > 400 && y > last + 4;
    const show = y < last - 4 || y < 400;
    if (hide) h.classList.add('is-hidden');
    else if (show) h.classList.remove('is-hidden');
    document.documentElement.classList.toggle('header-hidden', h.classList.contains('is-hidden'));
    last = y;
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  h.addEventListener('focusin', () => h.classList.remove('is-hidden'));
  update();
}

// ---------- full-screen menu ----------
function menu() {
  const btn = document.querySelector('[data-menu-toggle]');
  const panel = document.querySelector('[data-menu]');
  if (!btn || !panel) return;
  const open = () => {
    panel.hidden = false;
    void panel.offsetHeight; // commit the closed state so the reveal always animates
    panel.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.querySelector('.sr-only').textContent = 'Закрыть меню';
    document.documentElement.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    panel.querySelector('a')?.focus({ preventScroll: true });
  };
  const close = () => {
    panel.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.querySelector('.sr-only').textContent = 'Меню';
    document.documentElement.classList.remove('menu-open');
    document.body.style.overflow = '';
    setTimeout(() => !panel.classList.contains('is-open') && (panel.hidden = true), 600);
  };
  btn.addEventListener('click', () => (btn.getAttribute('aria-expanded') === 'true' ? close() : open()));
  panel.addEventListener('click', (e) => e.target.closest('a') && close());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      close();
      btn.focus();
    }
  });
  document.addEventListener('limee:menu-close', () => btn.getAttribute('aria-expanded') === 'true' && close());
  matchMedia('(min-width: 961px)').addEventListener('change', (m) => m.matches && close());
}

// ---------- full list of makes: smooth expand + search ----------
function makes() {
  const btn = document.querySelector('[data-makes-toggle]');
  const panel = document.querySelector('[data-makes]');
  if (!btn || !panel) return;
  const label = btn.querySelector('[data-makes-label]');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    if (open) panel.classList.remove('is-collapsed');
    panel.classList.toggle('is-open', open);
    panel.inert = !open;
    label.textContent = open ? 'Скрыть список' : 'Показать все марки';
    // Focus the search only with a mouse: on phones it would pop the keyboard over the list.
    if (open && matchMedia('(hover: hover)').matches) setTimeout(() => panel.querySelector('[data-makes-q]')?.focus({ preventScroll: true }), 350);
    else btn.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  panel.addEventListener('transitionend', (e) => {
    if (e.target === panel && e.propertyName === 'grid-template-rows' && !panel.classList.contains('is-open')) panel.classList.add('is-collapsed');
  });
  const q = panel.querySelector('[data-makes-q]');
  const groups = [...panel.querySelectorAll('[data-makes-group]')];
  const empty = panel.querySelector('[data-makes-empty]');
  q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase();
    let shown = 0;
    for (const g of groups) {
      let n = 0;
      for (const li of g.querySelectorAll('li')) {
        const hit = !v || li.dataset.name.includes(v);
        li.hidden = !hit;
        n += hit;
      }
      g.hidden = !n;
      shown += n;
    }
    empty.hidden = shown > 0;
  });
}

header();
menu();
makes();
initLead();
initCatalog();
initGallery();
initConfig();
reveals();
pageHero();

film();
intro(() => {});
counters();
steps();
fan();
delivery();

getRate().then((r) => r && applyRate(r));
