// First-screen film. One flick of the wheel / swipe / key plays the film on to the next stop on its
// own, like a video; scrolling the other way plays it back. After the last stop the page scrolls on.
// The film is one video; STOPS are the moments it rests on, TEXT_AT says which headline shows when.

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Seconds in film.mp4: Shanghai, the yard in front of the truck, Moscow-City, the house with the car unloaded.
const STOPS = [0, 5.125, 18.865, 31.28];
// Headline stage that starts at each of these seconds (0 Shanghai ... 4 handover): the truck leaves at ~9.4,
// Moscow shows at ~15.5, the truck stops at the house and the unloading starts at ~26.
const TEXT_AT = [0, 3.2, 9.4, 15.5, 26.0];
// A chip plays to the stop of its stage ("Transport" and "Customs" both rest in Moscow).
const CHIP_STOP = [0, 1, 2, 2, 3];
const LAST = STOPS.length - 1;
// Playback speed of each leg (yard to Moscow is the longest and runs fastest), a little above the generated speed.
const LEG_RATE = [1.2, 1.4, 1.3];
const SRC = { phone: '/media/film/film-m.mp4', sd: '/media/film/film-720.mp4', hd: '/media/film/film-1080.mp4' };
const POSTER = { phone: '/media/film/film-poster-m.jpg', desk: '/media/film/film-poster.jpg' };

const smooth = (x) => x * x * (3 - 2 * x);
const sine = (x) => 0.5 - Math.cos(Math.PI * x) / 2;
const stageAt = (t) => TEXT_AT.reduce((s, at, k) => (t >= at - 0.001 ? k : s), 0);

export function film() {
  const root = document.querySelector('[data-film]');
  let video = root?.querySelector('[data-film-video]');
  if (!root || !video) return;

  const steps = [...root.querySelectorAll('[data-film-step]')];
  const chips = [...root.querySelectorAll('[data-film-chip]')];
  const bar = root.querySelector('[data-film-bar]');
  const hint = root.querySelector('[data-film-hint]');
  const facts = root.querySelector('[data-film-facts]');
  const skip = root.querySelector('[data-film-skip]');

  const still = reducedMotion(); // no travelling video: stops are reached by an instant cut
  const phone = matchMedia('(max-width: 760px)').matches;
  const conn = navigator.connection || {};
  const lean = Boolean(conn.saveData) || /(^|-)[23]g$/.test(conn.effectiveType || '');

  video.poster = phone ? POSTER.phone : POSTER.desk;
  video.src = phone ? SRC.phone : SRC.sd;
  root.classList.add('is-live');

  let idx = 0; // stop the film rests on
  let moving = false;
  let to = 0;
  let dir = 1;
  let dest = 0;
  let base = 1.2; // speed of the current leg
  let quick = false;
  let raf = 0;
  let pendingHD = null;
  let stage = -1;
  // seek-driven travel (backwards, or forwards when the player stalls)
  let seekMode = false;
  let seekFrom = 0;
  let seekT0 = 0;
  let seekSpan = 1;
  // stall watchdog
  let lastTime = 0;
  let lastMove = 0;
  let deadline = 0;

  // ---------- what is shown ----------
  function showStage(s) {
    if (s === stage) return;
    stage = s;
    steps.forEach((el, k) => {
      el.classList.toggle('is-active', k === s);
      el.classList.toggle('is-past', k < s);
    });
    chips.forEach((el, k) => {
      el.classList.toggle('is-active', k === s);
      el.classList.toggle('is-done', k < s);
      if (k === s) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    const list = chips[s]?.closest('.film-chips');
    if (list && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: chips[s].offsetLeft - (list.clientWidth - chips[s].offsetWidth) / 2, behavior: 'smooth' });
    }
  }

  function setHint() {
    if (hint) {
      const go = phone ? 'Листайте вниз' : 'Листайте вниз, чтобы начать путь';
      const more = phone ? 'Листайте вниз' : 'Листайте вниз, чтобы продолжить';
      hint.textContent = idx === 0 ? go : idx === LAST ? more : 'Листайте дальше';
      hint.classList.toggle('is-gone', moving);
    }
    facts?.classList.toggle('is-gone', idx > 0 || moving);
  }

  function sync() {
    const t = video.currentTime;
    showStage(stageAt(t));
    if (bar) bar.style.transform = `scaleX(${Math.min(1, t / STOPS[LAST])})`;
  }

  function snap(i) {
    cancelAnimationFrame(raf);
    video.pause();
    moving = false;
    idx = i;
    video.currentTime = STOPS[i];
    showStage(stageAt(STOPS[i]));
    setHint();
    if (bar) bar.style.transform = `scaleX(${STOPS[i] / STOPS[LAST]})`;
  }

  // ---------- travelling between stops ----------
  function finish() {
    cancelAnimationFrame(raf);
    video.pause();
    video.currentTime = dest;
    idx = to;
    moving = false;
    sync();
    setHint();
    if (pendingHD) applyHD();
  }

  function beginSeek(now) {
    seekMode = true;
    seekFrom = video.currentTime;
    seekT0 = now;
    seekSpan = (Math.abs(dest - seekFrom) / (base * (quick ? 2.2 : dir > 0 ? 1 : 1.35))) * 1000;
    video.pause();
  }

  function loop(now) {
    if (!seekMode && dir > 0) {
      const cur = video.currentTime;
      const remaining = dest - cur;
      if (remaining <= 0.03 || video.ended) return finish();
      // a short ease-out so the stop is soft; the rest of the clip runs at a steady speed
      video.playbackRate = base * (quick ? 2.2 : 1) * (0.6 + 0.4 * smooth(Math.min(1, remaining / 0.3)));
      if (cur !== lastTime) {
        lastTime = cur;
        lastMove = now;
      } else if (now - lastMove > 900) {
        beginSeek(now); // the player is not moving: drive the film by seeking instead
      }
    }
    if (seekMode) {
      const p = Math.min(1, (now - seekT0) / seekSpan);
      const e = dir < 0 ? sine(p) : p;
      if (!video.seeking) video.currentTime = seekFrom + (dest - seekFrom) * e;
      if (p >= 1) return finish();
    }
    if (now > deadline) return finish(); // never stay locked
    sync();
    raf = requestAnimationFrame(loop);
  }

  function go(next, fast = false) {
    if (moving || next === idx || next < 0 || next > LAST) return;
    if (still) return snap(next);
    moving = true;
    to = next;
    dir = next > idx ? 1 : -1;
    dest = STOPS[next];
    base = LEG_RATE[Math.min(idx, next)];
    quick = fast;
    seekMode = dir < 0;
    const now = performance.now();
    if (seekMode) {
      seekFrom = video.currentTime;
      seekT0 = now;
      seekSpan = (Math.abs(dest - seekFrom) / (base * (quick ? 2.2 : 1.35))) * 1000;
      video.pause();
    } else {
      if (Math.abs(video.currentTime - STOPS[idx]) > 0.05) video.currentTime = STOPS[idx];
      video.playbackRate = base * (quick ? 2.2 : 1);
      video.play().catch(() => {});
      lastTime = video.currentTime;
      lastMove = now;
    }
    deadline = now + (Math.abs(dest - STOPS[idx]) / base) * 1000 * 2 + 2500;
    setHint();
    raf = requestAnimationFrame(loop);
  }

  // ---------- input: wheel, touch, keys ----------
  const blocked = () => document.querySelector('dialog[open]') || document.documentElement.classList.contains('menu-open');
  // The film owns the gesture only while it is at the very top and has somewhere to go.
  const canHandle = (d) => scrollY <= 1 && ((d > 0 && idx < LAST) || (d < 0 && idx > 0)) && !blocked();

  let lastWheel = 0;
  let armed = true; // a gesture may start a move
  let owned = false; // this gesture was taken by the film: swallow the rest of its inertia

  addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const now = performance.now();
      if (now - lastWheel > 140) {
        armed = true;
        owned = false;
      }
      lastWheel = now;
      const d = e.deltaY > 0 ? 1 : -1;
      if (owned) {
        e.preventDefault();
        return;
      }
      if (armed && canHandle(d)) {
        e.preventDefault();
        if (moving) {
          owned = true;
        } else if (Math.abs(e.deltaY) >= 3) {
          owned = true;
          go(idx + d);
        }
        return;
      }
      armed = false; // the browser scrolls the page for the rest of this gesture
    },
    { passive: false },
  );

  let tx = 0;
  let ty = 0;
  let touchDir = 0;
  let touchOwned = false;
  addEventListener(
    'touchstart',
    (e) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
      touchDir = 0;
      touchOwned = false;
      // iOS only plays a muted inline video after a touch: prime it once.
      if (!video.dataset.primed) {
        video.dataset.primed = '1';
        video.play().then(() => video.pause()).catch(() => {});
      }
    },
    { passive: true },
  );
  addEventListener(
    'touchmove',
    (e) => {
      const dy = ty - e.touches[0].clientY;
      const dx = tx - e.touches[0].clientX;
      if (!touchDir && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        touchDir = dy > 0 ? 1 : -1;
        touchOwned = canHandle(touchDir);
      }
      if (touchOwned) e.preventDefault();
    },
    { passive: false },
  );
  addEventListener(
    'touchend',
    (e) => {
      if (!touchOwned) return;
      const dy = ty - e.changedTouches[0].clientY;
      if (!moving && Math.abs(dy) > 28) go(idx + touchDir);
      touchOwned = false;
    },
    { passive: true },
  );

  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable], dialog')) return;
    const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && e.target === document.body);
    const up = e.key === 'ArrowUp' || e.key === 'PageUp';
    if (!down && !up) return;
    const d = down ? 1 : -1;
    if (!canHandle(d)) return;
    e.preventDefault();
    go(idx + d);
  });

  // The page was scrolled away from the film (scrollbar drag, reload mid-page, anchor): rest on the last stop.
  const away = () => {
    if (scrollY > 2 && !moving && idx !== LAST) snap(LAST);
  };
  addEventListener('scroll', away, { passive: true });
  addEventListener('load', away);

  chips.forEach((chip, i) => {
    chip.addEventListener('click', () => {
      const stop = CHIP_STOP[i];
      if (stop === idx) return;
      go(stop, Math.abs(stop - idx) > 1);
    });
  });

  skip?.addEventListener('click', () => {
    if (!moving && idx !== LAST) snap(LAST);
    scrollTo({ top: root.getBoundingClientRect().height, behavior: still ? 'auto' : 'smooth' });
  });

  // ---------- quality: start with the light file, swap in the 1080p one when it has downloaded ----------
  function applyHD() {
    const url = pendingHD;
    if (!url || moving) return;
    pendingHD = null;
    const next = video.cloneNode(false);
    next.removeAttribute('src');
    next.muted = true;
    next.playsInline = true;
    next.preload = 'auto';
    next.addEventListener(
      'loadeddata',
      () => {
        next.currentTime = video.currentTime;
        next.addEventListener(
          'seeked',
          () => {
            if (moving) {
              pendingHD = url; // try again when the film rests
              return;
            }
            video.replaceWith(next);
            video = next;
          },
          { once: true },
        );
      },
      { once: true },
    );
    next.src = url;
  }

  function upgrade() {
    if (phone || lean) return;
    fetch(SRC.hd)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (!b) return;
        pendingHD = URL.createObjectURL(b);
        if (!moving) applyHD();
      })
      .catch(() => {});
  }
  addEventListener('load', () => setTimeout(upgrade, 2500));

  showStage(0);
  setHint();
  sync();
}
