// First-screen film. One flick of the wheel / swipe / key plays the film on to the next stop on its
// own, like a video; scrolling the other way plays it back. After the last stop the page scrolls on.
// The film is one video; STOPS are the moments it rests on, TEXT_AT says which headline shows when.
// Going back plays a second, frame-mirrored file (…-rev.mp4) forwards: real playback, not seeking.
// Both files are downloaded whole into memory (blob) so playback never waits for the network.
//
// Several <video> elements take turns on screen (forward, reversed, the in-memory forward copy). The rule
// that keeps iPhone right: an element is uncovered only once it is PLAYING and has put a frame on screen.
// iOS Safari does not reliably repaint a paused video after a seek, so a seek alone never decides what
// is shown — that is how an old frame (Moscow) used to appear and stay frozen on the way back.

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Seconds in film.mp4: Shanghai, the yard in front of the truck, Moscow-City, the house with the car unloaded.
const STOPS = [0, 5.125, 18.865, 32.9];
// Headline stage that starts at each of these seconds (0 Shanghai ... 4 handover): the truck leaves at ~9.4,
// Moscow shows at ~15.5, the truck stops at the house and the unloading starts at ~26.4.
const TEXT_AT = [0, 3.2, 9.4, 15.5, 26.4];
// The car stands on its wheels at the house from here on: "Автомобиль уже у вас дома" shows.
const FINAL_AT = 31.6;
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
// how far along the five stage chips the film is, 0…1 (the line between them fills up to the active one)
const along = (t) => {
  const s = stageAt(t);
  if (s >= TEXT_AT.length - 1) return 1;
  return (s + (t - TEXT_AT[s]) / (TEXT_AT[s + 1] - TEXT_AT[s])) / (TEXT_AT.length - 1);
};

// Plays `el` from `t` and resolves true once it is playing with a frame on screen (false if it will not).
function playFrom(el, t, rate) {
  return new Promise((resolve) => {
    let done = false;
    const end = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => end(!el.paused && el.currentTime > t), 2000);
    const start = () => {
      el.playbackRate = rate;
      Promise.resolve(el.play())
        .then(() => {
          const painted = () => end(true);
          if (el.requestVideoFrameCallback) el.requestVideoFrameCallback(painted);
          const poll = () => {
            if (done) return;
            if (el.currentTime > t + 0.4 / FPS) requestAnimationFrame(painted);
            else requestAnimationFrame(poll);
          };
          requestAnimationFrame(poll);
        })
        .catch(() => end(false));
    };
    if (!el.seeking && Math.abs(el.currentTime - t) < 0.5 / FPS) start();
    else {
      el.addEventListener('seeked', start, { once: true });
      el.currentTime = t;
    }
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
  let video = root?.querySelector('[data-film-video]'); // the forward film
  const rev = root?.querySelector('[data-film-rev]'); // the same film reversed
  if (!root || !video) return;

  const steps = [...root.querySelectorAll('[data-film-step]')];
  const chips = [...root.querySelectorAll('[data-film-chip]')];
  const chipList = root.querySelector('.film-chips');
  const bar = root.querySelector('[data-film-bar]');
  const hint = root.querySelector('[data-film-hint]');
  const facts = root.querySelector('[data-film-facts]');
  const skip = root.querySelector('[data-film-skip]');
  const final = root.querySelector('[data-film-final]');

  // ?debug=1 in the address: a small log on screen of what the film does (for checking on a real phone).
  const debug = /[?&]debug=1\b/.test(location.search);
  let logBox = null;
  const log = (msg) => {
    if (!debug) return;
    if (!logBox) {
      logBox = document.createElement('pre');
      logBox.style.cssText =
        'position:fixed;left:8px;right:8px;top:72px;z-index:9999;margin:0;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.82);color:#d5ff00;font:11px/1.4 ui-monospace,monospace;white-space:pre-wrap;pointer-events:none';
      document.body.append(logBox);
    }
    const line = `${(performance.now() / 1000).toFixed(1)}s  ${msg}`;
    logBox.textContent = [line, ...logBox.textContent.split('\n')].slice(0, 12).join('\n');
  };
  const nameOf = (el) => (el === rev ? 'reversed' : el === video ? 'forward' : 'forward (memory)');

  const still = reducedMotion(); // no travelling video: stops are reached by an instant cut
  const phone = matchMedia('(max-width: 760px)').matches;
  const conn = navigator.connection || {};
  const lean = Boolean(conn.saveData) || /(^|-)[23]g$/.test(conn.effectiveType || '');

  video.poster = phone ? POSTER.phone : POSTER.desk;
  // Phone: the element only reads the header; the whole file comes in as a blob (below) and takes over.
  if (phone && !lean) video.preload = 'metadata';
  video.src = phone ? SRC.phone : SRC.sd;
  root.classList.add('is-live');

  let shown = video; // the element on screen
  let next = null; // the forward film from memory, waiting to take over at the next forward move
  let handing = null; // element being started for a handoff
  let idx = 0; // stop the film rests on
  let moving = false;
  let leg = 0; // id of the current move, so late async callbacks of an old move do nothing
  let to = 0;
  let dir = 1;
  let dest = 0;
  let base = 1.2; // speed of the current leg
  let quick = false;
  let raf = 0;
  let stage = -1;
  let revReady = false;
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
    root.dataset.stage = s; // phone: the sky colour above the picture follows the stage
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
    if (chipList && chipList.scrollWidth > chipList.clientWidth + 1) {
      chipList.scrollTo({ left: chips[s].offsetLeft - (chipList.clientWidth - chips[s].offsetWidth) / 2, behavior: 'smooth' });
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

  // film time of the picture on screen
  const filmTime = () => (shown === rev ? mid(END_FRAME - frameOf(rev.currentTime)) : shown.currentTime);

  function sync(t = filmTime()) {
    showStage(stageAt(t));
    if (bar) bar.style.transform = `scaleX(${Math.min(1, t / STOPS[LAST])})`;
    chipList?.style.setProperty('--film-p', along(t).toFixed(4));
    final?.classList.toggle('is-on', t >= FINAL_AT);
    root.classList.toggle('is-end', t >= FINAL_AT);
  }

  // uncover `el` (it is already playing with the right picture) and stop the one it replaces
  function show(el) {
    if (el === shown) return;
    el.classList.add('is-shown');
    shown.classList.remove('is-shown');
    shown.pause();
    shown = el;
  }

  // the in-memory forward film has taken over: the streaming element goes
  function adoptNext() {
    const old = video;
    video = next;
    next = null;
    video.poster = old.poster;
    old.remove();
    log('forward film now plays from memory');
  }

  function rest() {
    log(`rest at stop ${idx + 1}/${LAST + 1} (t ${filmTime().toFixed(2)}, on ${nameOf(shown)})`);
    moving = false;
    restAt = performance.now();
    sync(STOPS[idx]);
    setHint();
  }

  // instant cut to a stop (reduced motion, skip, page scrolled away)
  function snap(i) {
    cancelAnimationFrame(raf);
    leg++;
    seekMode = false;
    handing = null;
    idx = i;
    shown.pause();
    if (shown === rev) rev.currentTime = mirror(STOPS[i]);
    else shown.currentTime = STOPS[i];
    rest();
  }

  // ---------- travelling between stops ----------
  function finish() {
    cancelAnimationFrame(raf);
    idx = to;
    if (seekMode) {
      seekMode = false;
      video.currentTime = dest;
    }
    // the element stays where it stopped, on screen: no seek, nothing to repaint
    shown.pause();
    rest();
  }

  function beginSeek(now) {
    log(`driving by seeking (ready ${video.readyState}, play failed ${playFailed})`);
    if (shown !== video) {
      const t = filmTime();
      shown.pause();
      video.currentTime = t;
      video.classList.add('is-shown');
      shown.classList.remove('is-shown');
      shown = video;
    }
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
    if (!seekMode) {
      const back = shown === rev;
      const remaining = back ? mirror(dest) - rev.currentTime : dest - shown.currentTime;
      if (remaining <= 0.03 || shown.ended) return finish();
      shown.playbackRate = rateFor(remaining, back);
      if (playFailed || watch(shown, now)) beginSeek(now); // the player is not moving: drive the film by seeking
    }
    if (seekMode) {
      const p = Math.min(1, (now - seekT0) / seekSpan);
      const e = dir < 0 ? sine(p) : p;
      if (!video.seeking) video.currentTime = seekFrom + (dest - seekFrom) * e;
      if (p >= 1) return finish();
    }
    lastNow = now;
    if (now > deadline) {
      log('deadline: stop here');
      return finish(); // never stay locked
    }
    sync();
    raf = requestAnimationFrame(loop);
  }

  function startLoop() {
    lastTime = shown.currentTime;
    lastMove = performance.now();
    lastNow = lastMove;
    raf = requestAnimationFrame(loop);
  }

  // start `el` from `t` behind the picture; uncover it once it plays, then travel
  function handoff(el, t, rate, id) {
    handing = el;
    playFrom(el, t, rate).then((ok) => {
      if (handing === el) handing = null;
      if (id !== leg) {
        if (el !== shown) el.pause();
        return;
      }
      if (!ok) {
        log(`${nameOf(el)} film would not start`);
        el.pause();
        if (el === next) {
          next.remove();
          next = null;
        }
        playFailed = true;
        beginSeek(performance.now()); // drive the forward film by seeking from the picture on screen
        startLoop();
        return;
      }
      if (el === next) adoptNext();
      show(el);
      startLoop();
    });
  }

  function go(target, fast = false) {
    if (moving || target === idx || target < 0 || target > LAST) return;
    if (still) return snap(target);
    moving = true;
    const id = ++leg;
    to = target;
    dir = target > idx ? 1 : -1;
    dest = STOPS[target];
    base = LEG_RATE[Math.min(idx, target)];
    quick = fast;
    playFailed = false;
    seekMode = false;
    const now = performance.now();
    deadline = now + (Math.abs(dest - STOPS[idx]) / base) * 1000 * 2 + 3500;
    setHint();
    const from = filmTime();

    if (dir < 0 && revReady) {
      log(`go ${idx + 1} → ${target + 1} back on the reversed film`);
      if (shown === rev) {
        rev.playbackRate = rateFor(9, true);
        rev.play().catch(() => (playFailed = true));
        return startLoop();
      }
      return handoff(rev, mirror(from), rateFor(9, true), id);
    }
    if (dir < 0) {
      log(`go ${idx + 1} → ${target + 1} back by seeking (reversed film not in yet)`);
      beginSeek(now);
      return startLoop();
    }
    const player = next || video; // the in-memory copy takes over at the first forward move it can
    log(`go ${idx + 1} → ${target + 1}${fast ? ' fast' : ''} on ${nameOf(player)}`);
    const rate = base * (quick ? QUICK : 1);
    if (player === shown) {
      shown.playbackRate = rate;
      shown.play().catch(() => (playFailed = true));
      return startLoop();
    }
    handoff(player, mid(frameOf(from)), rate, id);
  }

  // ---------- input: wheel, touch, keys ----------
  const blocked = () => document.querySelector('dialog[open]') || document.documentElement.classList.contains('menu-open');
  // The intro curtain is up: gestures do nothing yet (no hidden film play, no page scroll under it).
  const loading = () => document.documentElement.classList.contains('is-loading');
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
      if (loading()) {
        // swallow, and let the first wheel event after the curtain start the film
        e.preventDefault();
        armed = true;
        owned = false;
        lastWheel = 0;
        return;
      }
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
  // The film holds the screen (top of the page, stops left to play): every move of the finger is the
  // film's from the very first pixel. iOS starts scrolling the page on the first move nobody cancels,
  // and later moves can no longer stop it — the page slid and the film jumped to the last stop.
  let touchLock = false;
  let touchTravel = 0; // how far the finger went: a swipe that starts on a chip is not a tap on it
  let lastTouchEnd = 0;
  // iOS starts a video most reliably after a touch has started it once: prime each hidden element once.
  // Never the one on screen or the one being started, so priming cannot move the picture.
  const prime = (el) => {
    if (!el || el.dataset.primed || !el.currentSrc || el === shown || el === handing || moving) return;
    el.dataset.primed = '1';
    const t = el.currentTime;
    Promise.resolve(el.play())
      .then(() => {
        if (el === shown || el === handing) return;
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
      touchTravel = 0;
      touchLock = !loading() && scrollY <= 1 && idx < LAST && !blocked();
      prime(video);
      prime(rev);
      prime(next);
    },
    { passive: true },
  );
  addEventListener(
    'touchmove',
    (e) => {
      if (loading()) {
        e.preventDefault();
        touchDir = 0;
        touchOwned = false;
        return;
      }
      const dy = ty - e.touches[0].clientY;
      const dx = tx - e.touches[0].clientX;
      touchTravel = Math.max(touchTravel, Math.abs(dy), Math.abs(dx));
      if (!touchDir && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        touchDir = dy > 0 ? 1 : -1;
        touchOwned = canHandle(touchDir);
      }
      if ((touchLock || touchOwned) && e.cancelable) e.preventDefault();
    },
    { passive: false },
  );
  addEventListener(
    'touchend',
    (e) => {
      lastTouchEnd = performance.now();
      touchLock = false;
      if (!touchOwned) return;
      const dy = ty - e.changedTouches[0].clientY;
      log(`swipe ${touchDir > 0 ? 'down' : 'up'} ${Math.round(dy)}px${moving ? ' (film busy)' : ''}`);
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
    if (loading()) return e.preventDefault();
    const d = down ? 1 : -1;
    if (!canHandle(d)) return;
    e.preventDefault();
    go(idx + d);
  });

  // The page was scrolled well away from the film (scrollbar drag, reload mid-page, anchor): rest on the
  // last stop. A small slip of the page is not "away" — it must never skip the film to its end.
  const away = () => {
    if (scrollY > root.offsetHeight * 0.5 && !moving && idx !== LAST) {
      log(`page scrolled away (${Math.round(scrollY)}px): last stop`);
      snap(LAST);
    }
  };
  addEventListener('scroll', away, { passive: true });
  addEventListener('load', away);

  chips.forEach((chip, i) => {
    chip.addEventListener('click', () => {
      // a swipe that began on a chip (they sit where the thumb starts) is not a tap on it
      if (performance.now() - lastTouchEnd < 600 && touchTravel > 6) return log(`chip ${i + 1} ignored: swipe`);
      log(`chip ${i + 1} tapped`);
      const stop = CHIP_STOP[i];
      if (stop === idx) return;
      go(stop, Math.abs(stop - idx) > 1);
    });
  });

  skip?.addEventListener('click', () => {
    log('skip pressed');
    if (idx !== LAST) snap(LAST);
    scrollTo({ top: root.getBoundingClientRect().height, behavior: still ? 'auto' : 'smooth' });
  });

  // ---------- files: the whole film in memory takes over, then the reversed one comes in ----------
  function prepareNext(url) {
    const el = video.cloneNode(false);
    el.removeAttribute('src');
    el.removeAttribute('poster');
    el.classList.remove('is-shown');
    delete el.dataset.primed;
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    el.addEventListener(
      'loadeddata',
      () => {
        next = el;
        log('forward film in memory');
      },
      { once: true },
    );
    el.src = url;
    video.after(el);
  }

  function loadRev(src) {
    if (!rev || still) return;
    fetchBlob(src).then((url) => {
      if (!url) return;
      rev.addEventListener(
        'loadeddata',
        () => {
          revReady = true;
          log('reversed film in memory');
        },
        { once: true },
      );
      rev.src = url;
    });
  }

  function upgrade() {
    if (lean || still) return;
    fetchBlob(phone ? SRC.phone : SRC.hd).then((url) => {
      if (url) prepareNext(url);
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
