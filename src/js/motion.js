import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'expo.out';

// Seconds to hold entrance animations so they play as the page-transition curtain lifts.
function arrival() {
  if (!('CSSViewTransitionRule' in window)) return 0;
  try {
    const a = window.navigation?.activation;
    if (a) return a.from && a.navigationType !== 'reload' ? 0.6 : 0;
  } catch {}
  return document.referrer.startsWith(location.origin) ? 0.6 : 0;
}

// ---------- inner pages: heading block rises in ----------
export function pageHero() {
  const h = document.querySelector('.page-hero, .car-hero-content');
  if (!h || reduced()) return;
  const parts = h.querySelectorAll(':scope > :not(.page-hero-bg)');
  gsap.fromTo(parts, { opacity: 0, y: 56 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: EASE, delay: arrival() + 0.05, clearProps: 'transform' });
}

// Blocks on inner pages that fade up as they enter, without tagging every template.
const AUTO_REVEAL = [
  '.contact-main > *',
  '.contact-side > *',
  '.legal > *',
  '.about-link',
  '.lead-copy > *',
  '.lead-card',
  '.cat-live',
  '.cat-tools',
  '.gallery',
  '.related',
];

// ---------- intro: car outline draws itself, wordmark arrives, curtain lifts ----------
export function intro(onDone) {
  const loader = document.querySelector('[data-loader]');
  const skip = !loader || document.documentElement.classList.contains('no-intro');
  if (skip) {
    loader?.remove();
    onDone();
    return;
  }
  document.documentElement.classList.add('is-loading');
  const lines = loader.querySelectorAll('.car-line');
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    onComplete() {
      loader.remove();
      document.documentElement.classList.remove('is-loading');
      try {
        sessionStorage.setItem('limee-intro', '1');
      } catch {}
    },
  });
  tl.to(lines, { strokeDashoffset: 0, duration: 1.15, stagger: 0.09 })
    .to(loader.querySelector('[data-loader-bar]'), { scaleX: 1, duration: 1.5, ease: 'power1.inOut' }, 0)
    .to(loader.querySelector('.loader-wordmark'), { opacity: 1, y: 0, duration: 0.6, ease: EASE }, 0.75)
    .to(loader.querySelector('.loader-outline'), { scale: 1.04, duration: 0.5, ease: 'power1.out' }, 1.3)
    .add(onDone, 1.55)
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, 1.55);
  gsap.set(loader.querySelector('.loader-wordmark'), { y: 14 });
  gsap.set(loader, { clipPath: 'inset(0 0 0% 0)' });
}

// ---------- generic reveal ----------
export function reveals() {
  document.querySelectorAll(AUTO_REVEAL.join(',')).forEach((el) => el.setAttribute('data-reveal', ''));
  const els = document.querySelectorAll('[data-reveal]');
  if (reduced() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  // What is on screen at load waits for the transition curtain; later reveals start at once.
  const hold = arrival() * 1000;
  const t0 = performance.now();
  const io = new IntersectionObserver(
    (entries) => {
      const wait = performance.now() - t0 < 400 ? hold : 0;
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const siblings = [...en.target.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
        const i = Math.max(0, siblings.indexOf(en.target));
        const el = en.target;
        el.style.transitionDelay = `${wait + Math.min(i, 6) * 70}ms`;
        el.classList.add('is-in');
        // Once shown, hand the element back to its own hover transitions.
        el.addEventListener('transitionend', function done(e) {
          if (e.target !== el || e.propertyName !== 'transform') return;
          el.removeEventListener('transitionend', done);
          el.style.transitionDelay = '';
          el.removeAttribute('data-reveal');
          el.classList.remove('is-in');
        });
        io.unobserve(en.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  els.forEach((el) => io.observe(el));
}

// ---------- numbers count up once ----------
export function counters() {
  const els = document.querySelectorAll('[data-count]');
  if (reduced()) return;
  els.forEach((el) => {
    const end = Number(el.dataset.count);
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.to(obj, { v: end, duration: 1.6, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(obj.v)) }),
    });
    el.textContent = '0';
  });
}

// ---------- process steps: photo drifts inside its frame ----------
export function steps() {
  if (reduced()) return;
  document.querySelectorAll('[data-step] .step-media img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

// ---------- fan of cars opens when it scrolls into view ----------
export function fan() {
  const f = document.querySelector('[data-fan] .fan');
  if (!f) return;
  if (reduced()) {
    f.classList.add('is-open');
    return;
  }
  ScrollTrigger.create({ trigger: f, start: 'top 75%', end: 'bottom 10%', onEnter: () => f.classList.add('is-open'), onLeaveBack: () => f.classList.remove('is-open') });
}

// ---------- delivery map: route draws and the car travels with scroll ----------
export function delivery() {
  const sec = document.querySelector('[data-delivery]');
  if (!sec) return;
  const routes = sec.querySelectorAll('[data-route]');
  const path = routes[routes.length - 1];
  const car = sec.querySelector('[data-map-car]');
  const stages = [...sec.querySelectorAll('[data-stage]')];
  const len = path.getTotalLength();
  const setStage = (p) => {
    const idx = Math.min(stages.length - 1, Math.floor(p * stages.length * 0.999));
    stages.forEach((s, i) => {
      s.classList.toggle('is-active', i === idx);
      s.classList.toggle('is-done', i < idx);
      s.classList.toggle('is-next', i === idx + 1);
    });
  };
  const place = (p) => {
    const pt = path.getPointAtLength(len * p);
    car.setAttribute('transform', `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)})`);
    routes.forEach((r) => (r.style.strokeDashoffset = String(1 - p)));
    setStage(p);
  };
  if (reduced()) {
    place(1);
    return;
  }
  place(0);
  ScrollTrigger.create({
    trigger: sec,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6,
    onUpdate: (self) => place(gsap.utils.clamp(0, 1, (self.progress - 0.08) / 0.84)),
  });
  gsap.from(sec.querySelector('.map'), { opacity: 0, scale: 0.94, duration: 1.2, ease: EASE, scrollTrigger: { trigger: sec, start: 'top 70%' } });
}
