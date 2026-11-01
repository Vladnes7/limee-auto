// First-screen film. One flick of the wheel / swipe / key plays the film on to the next stop on its
// own, like a video; scrolling the other way plays it back. After the last stop the page scrolls on.
// The film is one video; STOPS are the moments it rests on, TEXT_AT says which headline shows when.
// Going back plays a second, frame-mirrored file (…-rev.mp4) forwards: real playback, not seeking.
// Both files are downloaded whole into memory (blob) so playback never waits for the network.

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Seconds in film.mp4: Shanghai, the yard in front of the truck, Moscow-City, the house with the car unloaded.
const STOPS = [0, 5.125, 18.865, 32.9];
// Headline stage that starts at each of these seconds (0 Shanghai ... 4 handover): the truck leaves at ~9.4,
// Moscow shows at ~15.5, the truck stops at the house and the unloading starts at ~26.4.
const TEXT_AT = [0, 3.2, 9.4, 15.5, 26.4];
// A chip plays to the stop of its stage ("Transport" and "Customs" both rest in Moscow).
const CHIP_STOP = [0, 1, 2, 2, 3];
const LAST = STOPS.length - 1;
// Playback speed of each leg (yard to Moscow is the longest and runs fastest), a little above the generated speed.
const LEG_RATE = [1.2, 1.4, 1.4];
const BACK = 1.35; // going back runs a little faster than forwards
const QUICK = 2.2; // chip jumps over more than one stop
// Frames: 24 fps, 791 frames (0…790). Frame k of the film is frame 790 - k of the reversed file.
const FPS = 24;
const END_FRAME = 790;
const SRC = {
  phone: '/media/film/film-m.mp4',
  phoneRev: '/media/film/film-m-rev.mp4',
  sd: '/media/film/film-720.mp4',
  hd: '/media/film/film-1080.mp4',
  hdRev: '/media/film/film-1080-rev.mp4',
};
const POSTER = { phone: '/media/film/film-poster-m.jpg', desk: '/media/film/film-poster.jpg' };

const smooth = (x) => x * x * (3 - 2 * x);
const sine = (x) => 0.5 - Math.cos(Math.PI * x) / 2;
const stageAt = (t) => TEXT_AT.reduce((s, at, k) => (t >= at - 0.001 ? k : s), 0);
const frameOf = (t) => Math.min(END_FRAME, Math.max(0, Math.floor(t * FPS + 0.001)));
const mid = (f) => (f + 0.5) / FPS; // a time safely inside frame f
const mirror = (t) => mid(END_FRAME - frameOf(t)); // the same picture in the other file

// Resolves once a seek has landed and its frame is on screen.
function seekTo(el, t) {
  return new Promise((resolve) => {
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      resolve();
    };
    const painted = () => {
      if (el.requestVideoFrameCallback) el.requestVideoFrameCallback(() => end());
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(end, 40)));
    };
    if (!el.seeking && Math.abs(el.currentTime - t) < 0.5 / FPS) return painted();
    el.addEventListener('seeked', painted, { once: true });
    el.currentTime = t;
    setTimeout(end, 1200); // never wait forever
  });
}

function fetchBlob(url) {
  return fetch(url)
    .then((r) => (r.ok ? r.blob() : null))
    .then((b) => (b ? URL.createObjectURL(b) : null))
    .catch(() => null);
}

export function film() {
  const root = document.querySelector('[data-film]');
  let video = root?.querySelector('[data-film-video]');
  const rev = root?.querySelector('[data-film-rev]');
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
  // Phone: the element only reads the header; the whole file comes in as a blob (below) and replaces it.
  if (phone && !lean) video.preload = 'metadata';
  video.src = phone ? SRC.phone : SRC.sd;
  root.classList.add('is-live');

  let idx = 0; // stop the film rests on
  let moving = false;
  let leg = 0; // id of the current move, so late async callbacks of an old move do nothing
  let to = 0;
  let dir = 1;
  let dest = 0;
  let base = 1.2; // speed of the current leg
  let quick = false;
  let raf = 0;
  let pendingHD = null;
  let stage = -1;
  let revReady = false;
  let revOn = false; // the reversed file is the one on screen
  // seek-driven travel (backwards before the reversed file is in, or when the player refuses to play)
  let seekMode = false;
  let seekFrom = 0;
  let seekT0 = 0;
  let seekSpan = 1;
  // stall watchdog
  let lastTime = 0;
  let lastMove = 0;
  let lastNow = 0;
  let deadline = 0;
  let playFailed = false;
  let restAt = 0; // when the film last came to rest

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

  // film time currently on screen
  const filmTime = () => (revOn ? mid(END_FRAME - frameOf(rev.currentTime)) : video.currentTime);

  function sync(t = filmTime()) {
    showStage(stageAt(t));
    if (bar) bar.style.transform = `scaleX(${Math.min(1, t / STOPS[LAST])})`;
  }

  function showRev(on) {
    revOn = on;
    rev?.classList.toggle('is-on', on);
  }

  function rest() {
    moving = false;
    restAt = performance.now();
    sync(STOPS[idx]);
    setHint();
    if (pendingHD) applyHD();
  }

  function snap(i) {
    cancelAnimationFrame(raf);
    leg++;
    video.pause();
    rev?.pause();
    showRev(false);
    seekMode = false;
    idx = i;
    video.currentTime = STOPS[i];
    rest();
  }

  // ---------- travelling between stops ----------
  function finish() {
    cancelAnimationFrame(raf);
    video.pause();
    idx = to;
    seekMode = false;
    if (!revOn) {
      video.currentTime = dest;
      return rest();
    }
    // Back on the forward file: put it on the same picture first, then uncover it.
    rev.pause();
    const id = leg;
    seekTo(video, dest).then(() => {
      if (id !== leg) return;
      showRev(false);
      rest();
    });
  }

  function beginSeek(now) {
    seekMode = true;
    seekFrom = video.currentTime;
    seekT0 = now;
    seekSpan = (Math.abs(dest - seekFrom) / (base * (quick ? QUICK : dir > 0 ? 1 : BACK))) * 1000;
    video.pause();
  }

  // speed of a playing leg, with a short ease-out so the stop is soft
  const rateFor = (remaining, back) => base * (quick ? QUICK : back ? BACK : 1) * (0.6 + 0.4 * smooth(Math.min(1, remaining / 0.3)));

  // watchdog for a playing element: waiting for data is fine, standing still with data is not
  function watch(el, now) {
    const cur = el.currentTime;
    if (cur !== lastTime) {
      lastTime = cur;
      lastMove = now;
    } else if (el.readyState < 3 || el.seeking) {
      lastMove = now;
      deadline += now - lastNow; // buffering does not count against the deadline
    } else if (now - lastMove > 900) {
      return true;
    }
    return false;
  }

  function loop(now) {
    if (revOn) {
      const target = mirror(dest);
      const remaining = target - rev.currentTime;
      if (remaining <= 0.03 || rev.ended) return finish();
      rev.playbackRate = rateFor(remaining, true);
      if (watch(rev, now) || playFailed) {
        // the reversed file will not play: fall back to seeking the forward one from the same picture
        rev.pause();
        video.currentTime = filmTime();
        showRev(false);
        beginSeek(now);
      }
    } else if (!seekMode && dir > 0) {
      const remaining = dest - video.currentTime;
      if (remaining <= 0.03 || video.ended) return finish();
      video.playbackRate = rateFor(remaining, false);
      if (playFailed || watch(video, now)) beginSeek(now); // the player is not moving: drive the film by seeking
    }
    if (seekMode) {
      const p = Math.min(1, (now - seekT0) / seekSpan);
      const e = dir < 0 ? sine(p) : p;
      if (!video.seeking) video.currentTime = seekFrom + (dest - seekFrom) * e;
      if (p >= 1) return finish();
    }
    lastNow = now;
    if (now > deadline) return finish(); // never stay locked
    sync();
    raf = requestAnimationFrame(loop);
  }

  function go(next, fast = false) {
    if (moving || next === idx || next < 0 || next > LAST) return;
    if (still) return snap(next);
    moving = true;
    const id = ++leg;
    to = next;
    dir = next > idx ? 1 : -1;
    dest = STOPS[next];
    base = LEG_RATE[Math.min(idx, next)];
    quick = fast;
    playFailed = false;
    seekMode = false;
    const now = performance.now();
    lastNow = now;
    lastMove = now;
    deadline = now + (Math.abs(dest - STOPS[idx]) / base) * 1000 * 2 + 3000;
    setHint();

    if (dir < 0 && revReady) {
      // put the reversed file on the picture that is showing, uncover it, play it
      const from = video.currentTime;
      video.pause();
      rev.playbackRate = rateFor(9, true);
      seekTo(rev, mirror(from)).then(() => {
        if (id !== leg) return;
        showRev(true);
        lastTime = rev.currentTime;
        lastMove = performance.now();
        rev.play().catch(() => (playFailed = true));
        raf = requestAnimationFrame(loop);
      });
      return;
    }
    if (dir < 0) {
      beginSeek(now);
    } else {
      if (Math.abs(video.currentTime - STOPS[idx]) > 0.05) video.currentTime = STOPS[idx];
      video.playbackRate = base * (quick ? QUICK : 1);
      video.play().catch(() => (playFailed = true));
      lastTime = video.currentTime;
    }
    raf = requestAnimationFrame(loop);
  }

  // ---------- input: wheel, touch, keys ----------
  const blocked = () => document.querySelector('dialog[open]') || document.documentElement.classList.contains('menu-open');
  // The film owns the gesture only while it is at the very top and has somewhere to go.
  const canHandle = (d) => scrollY <= 1 && ((d > 0 && idx < LAST) || (d < 0 && idx > 0)) && !blocked();

  let lastWheel = 0;
  let lastAbs = 0;
  let armed = true; // a gesture may start a move
  let owned = false; // this gesture was taken by the film: swallow the rest of its inertia

  addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const now = performance.now();
      const abs = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 40 : 1);
      // A new gesture: a pause in the wheel stream, or — on a trackpad, where a new flick lands on the
      // inertia tail of the previous one — the film is resting and the wheel speeds up again (the tail
      // only ever slows down), or a mouse wheel keeps turning at full strength after the film stopped.
      const fresh =
        now - lastWheel > 140 ||
        (!moving && now - restAt > 120 && ((abs >= 8 && abs > lastAbs * 1.4 + 2) || (abs >= 60 && abs >= lastAbs && now - restAt > 350)));
      if (fresh) {
        armed = true;
        owned = false;
      }
      lastWheel = now;
      lastAbs = abs;
      const d = e.deltaY > 0 ? 1 : -1;
      if (owned) {
        e.preventDefault();
        return;
      }
      if (armed && canHandle(d)) {
        e.preventDefault();
        if (moving) {
          owned = true;
        } else if (abs >= 3) {
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
  // iOS plays an inline video most reliably once a touch has started it: prime each element once.
  const prime = (el) => {
    if (!el || el.dataset.primed || !el.currentSrc || moving) return;
    el.dataset.primed = '1';
    const t = el.currentTime;
    el.play()
      .then(() => {
        if (moving && (el === video || revOn)) return;
        el.pause();
        el.currentTime = t;
      })
      .catch(() => {});
  };
  addEventListener(
    'touchstart',
    (e) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
      touchDir = 0;
      touchOwned = false;
      prime(video);
      prime(rev);
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
    if (idx !== LAST) snap(LAST);
    scrollTo({ top: root.getBoundingClientRect().height, behavior: still ? 'auto' : 'smooth' });
  });

  // ---------- files: swap in the whole film from memory, then load the reversed one ----------
  function applyHD() {
    const url = pendingHD;
    if (!url || moving) return;
    pendingHD = null;
    const next = video.cloneNode(false);
    next.removeAttribute('src');
    delete next.dataset.primed;
    next.muted = true;
    next.playsInline = true;
    next.preload = 'auto';
    next.addEventListener(
      'loadeddata',
      () => {
        seekTo(next, video.currentTime).then(() => {
          if (moving) {
            pendingHD = url; // try again when the film rests
            return;
          }
          video.replaceWith(next);
          video = next;
        });
      },
      { once: true },
    );
    next.src = url;
  }

  function loadRev(src) {
    if (!rev || still) return Promise.resolve();
    return fetchBlob(src).then((url) => {
      if (!url) return;
      rev.addEventListener('loadeddata', () => (revReady = true), { once: true });
      rev.src = url;
    });
  }

  function upgrade() {
    if (lean || still) return;
    fetchBlob(phone ? SRC.phone : SRC.hd).then((url) => {
      if (url) {
        pendingHD = url;
        if (!moving) applyHD();
      }
      loadRev(phone ? SRC.phoneRev : SRC.hdRev);
    });
  }
  // Phone: the film is the whole first screen, fetch it at once. Desktop: the 720p file streams fine,
  // the 1080p one waits for the rest of the page.
  if (phone) upgrade();
  else if (document.readyState === 'complete') setTimeout(upgrade, 2500);
  else addEventListener('load', () => setTimeout(upgrade, 2500));

  showStage(0);
  setHint();
  sync(0);
}
