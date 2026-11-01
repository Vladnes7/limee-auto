// Live CNY rate from the Central Bank (the same source the old site used: cbr-xml-daily).
// Cached for 6 hours; when offline the build-time rate printed in the HTML stays.
const KEY = 'limee-cny-rate';
const TTL = 6 * 60 * 60 * 1000;
const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const nf4 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

export const rub = (n) => `${nf.format(Math.round(n))} ₽`;
export const rateText = (r) => nf4.format(r);

let feesTotal = 450000;
export function setFees(total) {
  feesTotal = total;
}
export const totalFor = (cny, rate) => (cny > 0 ? cny * rate + feesTotal : 0);

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && Date.now() - v.at < TTL) return v;
  } catch {}
  return null;
}

export async function getRate() {
  const cached = read();
  if (cached) return cached;
  try {
    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', { cache: 'no-store' });
    const json = await res.json();
    const c = json.Valute.CNY;
    const v = { rate: c.Value / c.Nominal, date: json.Date, at: Date.now() };
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {}
    return v;
  } catch {
    return null;
  }
}

export function applyRate({ rate, date }) {
  document.querySelectorAll('[data-price-cny]').forEach((el) => {
    const cny = Number(el.dataset.priceCny);
    if (cny > 0) el.textContent = rub(totalFor(cny, rate));
  });
  document.querySelectorAll('[data-rate-value]').forEach((el) => (el.textContent = rateText(rate)));
  const d = new Date(date).toLocaleDateString('ru-RU');
  document.querySelectorAll('[data-rate-line]').forEach((el) => (el.textContent = `Курс ЦБ на ${d}: 1 ¥ = ${rateText(rate)} ₽`));
  document.querySelectorAll('[data-car]').forEach((el) => {
    const p = el.querySelector('[data-price-cny]');
    if (p) el.dataset.price = Math.round(totalFor(Number(p.dataset.priceCny), rate));
  });
  document.dispatchEvent(new CustomEvent('limee:rate', { detail: { rate } }));
}
