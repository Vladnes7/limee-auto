// Lead form: validate, then hand the request to WhatsApp with the text prefilled.
// No server yet (SPEC): the visitor sends the message themselves.
const WHATSAPP = '79661569498';

const digits = (s) => s.replace(/\D/g, '');

function formatPhone(value) {
  let d = digits(value);
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = '+7';
  if (p.length) out += ' (' + p.slice(0, 3);
  if (p.length >= 3) out += ')';
  if (p.length > 3) out += ' ' + p.slice(3, 6);
  if (p.length > 6) out += '-' + p.slice(6, 8);
  if (p.length > 8) out += '-' + p.slice(8, 10);
  return out;
}

function setError(input, errEl, message) {
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (errEl) errEl.textContent = message || '';
}

function initForm(form) {
  const phone = form.elements.phone;
  const consent = form.elements.consent;
  const phoneErr = document.getElementById(phone.getAttribute('aria-describedby'));
  const consentErr = document.getElementById(consent.getAttribute('aria-describedby'));

  phone.addEventListener('focus', () => {
    if (!phone.value) phone.value = '+7 (';
  });
  phone.addEventListener('blur', () => {
    if (digits(phone.value).length <= 1) phone.value = '';
    else if (phone.getAttribute('aria-invalid') === 'true') validatePhone();
  });
  phone.addEventListener('input', () => {
    const atEnd = phone.selectionStart === phone.value.length;
    phone.value = formatPhone(phone.value);
    if (atEnd) phone.setSelectionRange(phone.value.length, phone.value.length);
    if (phone.getAttribute('aria-invalid') === 'true' && digits(phone.value).length === 11) setError(phone, phoneErr, '');
  });
  consent.addEventListener('change', () => consent.checked && setError(consent, consentErr, ''));

  function validatePhone() {
    const ok = digits(phone.value).length === 11;
    setError(phone, phoneErr, ok ? '' : 'Введите номер полностью: +7 и 10 цифр');
    return ok;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const okPhone = validatePhone();
    const okConsent = consent.checked;
    setError(consent, consentErr, okConsent ? '' : 'Нужно согласие на обработку персональных данных');
    if (!okPhone) return phone.focus();
    if (!okConsent) return consent.focus();

    const f = form.elements;
    const lines = [
      'Заявка с сайта Limee Auto',
      f.name.value.trim() && `Имя: ${f.name.value.trim()}`,
      `Телефон: ${phone.value}`,
      f.budget.value.trim() && `Бюджет: ${f.budget.value.trim()}`,
      f.model.value.trim() && `Марка / модель: ${f.model.value.trim()}`,
      `Удобный способ связи: ${f.method.value}`,
      `Страница: ${document.title}`,
    ].filter(Boolean);
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');

    const done = form.parentElement.querySelector('.lead-done');
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
}

export function initLead() {
  document.querySelectorAll('[data-lead-form]').forEach(initForm);

  const dialog = document.querySelector('[data-lead-dialog]');
  if (!dialog) return;
  let opener = null;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-lead]');
    if (!btn) return;
    opener = btn;
    const form = dialog.querySelector('form');
    const done = dialog.querySelector('.lead-done');
    if (form.hidden) {
      form.hidden = false;
      done.hidden = true;
    }
    if (btn.dataset.model) form.elements.model.value = btn.dataset.model;
    document.dispatchEvent(new CustomEvent('limee:menu-close'));
    dialog.showModal();
    form.elements.name.focus();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-close-lead]')) dialog.close();
  });
  dialog.addEventListener('close', () => opener?.focus());
}
