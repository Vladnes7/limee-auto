// Catalogue filtering: search, brand, body, engine, sort. State mirrors into the URL (?brand=bmw&body=...).
const PAGE = 24;
const plural = (n, a, b, c) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return a;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return b;
  return c;
};

export function initCatalog() {
  const root = document.querySelector('[data-catalog]');
  if (!root) return;
  const tools = document.querySelector('[data-cat-tools]');
  const grid = root.querySelector('[data-cat-grid]');
  const items = [...grid.querySelectorAll('[data-car]')];
  const original = items.slice();
  const countEl = root.querySelector('[data-cat-count]');
  const wordEl = root.querySelector('[data-cat-word]');
  const empty = root.querySelector('[data-cat-empty]');
  const more = root.querySelector('[data-cat-more]');
  const controls = Object.fromEntries([...tools.querySelectorAll('[data-filter]')].map((el) => [el.dataset.filter, el]));
  let limit = PAGE;

  const params = new URLSearchParams(location.search);
  for (const [k, el] of Object.entries(controls)) {
    const v = params.get(k);
    if (v && (el.tagName !== 'SELECT' || [...el.options].some((o) => o.value === v || o.text === v))) el.value = v;
  }

  function apply({ keepLimit = false } = {}) {
    if (!keepLimit) limit = PAGE;
    const q = (controls.q?.value || '').trim().toLowerCase();
    const brand = controls.brand?.value || '';
    const body = controls.body?.value || '';
    const engine = controls.engine?.value || '';
    const sort = controls.sort?.value || '';

    const match = original.filter((el) => {
      if (brand && el.dataset.brand !== brand) return false;
      if (body && el.dataset.body !== body) return false;
      if (engine && !el.dataset.engine.split('|').includes(engine)) return false;
      if (q && !q.split(/\s+/).every((w) => el.dataset.search.includes(w))) return false;
      return true;
    });

    const price = (el) => Number(el.dataset.price) || Infinity;
    if (sort === 'price-asc') match.sort((a, b) => price(a) - price(b));
    else if (sort === 'price-desc') match.sort((a, b) => (Number(b.dataset.price) || -1) - (Number(a.dataset.price) || -1));
    else if (sort === 'year') match.sort((a, b) => b.dataset.year.localeCompare(a.dataset.year) || price(a) - price(b));

    const visible = new Set(match.slice(0, limit));
    const matched = new Set(match);
    const order = [...match, ...original.filter((el) => !matched.has(el))];
    // Touch the DOM only where something changes: re-appending all 251 cards on every call
    // forced a full re-layout (a long task on phones, right as the page transition ends).
    const current = grid.children;
    if (order.some((el, i) => current[i] !== el)) order.forEach((el) => grid.appendChild(el));
    order.forEach((el) => {
      const hide = !visible.has(el);
      if (el.hidden !== hide) el.hidden = hide;
    });

    countEl.textContent = match.length;
    wordEl.textContent = plural(match.length, 'модель', 'модели', 'моделей');
    empty.hidden = match.length > 0;
    more.hidden = match.length <= limit;
    more.textContent = `Показать ещё ${Math.min(PAGE, match.length - limit)}`;

    const next = new URLSearchParams();
    for (const [k, el] of Object.entries(controls)) if (el.value) next.set(k, el.value);
    const qs = next.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  let t;
  controls.q?.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(apply, 140);
  });
  for (const k of ['brand', 'body', 'engine', 'sort']) controls[k]?.addEventListener('change', () => apply());
  more.addEventListener('click', () => {
    const firstNew = limit;
    limit += PAGE;
    apply({ keepLimit: true });
    const target = [...grid.querySelectorAll('[data-car]:not([hidden])')][firstNew];
    target?.querySelector('a')?.focus({ preventScroll: true });
  });
  root.querySelector('[data-cat-reset]').addEventListener('click', () => {
    for (const el of Object.values(controls)) el.value = '';
    apply();
    controls.q?.focus();
  });
  document.addEventListener('limee:rate', () => apply({ keepLimit: true }));
  apply();
}
