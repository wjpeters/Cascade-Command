export function leaderboardRoute(context) {
  return '/api/leaderboard' + (context?.day && context?.version ? '?' + new URLSearchParams({ day: context.day, version: context.version }) : '');
}
export function retryDelay(header, now = Date.now()) {
  if (!header) return 0;
  const value = /^\d+$/.test(header) ? Number(header) * 1000 : Date.parse(header) - now;
  return Number.isFinite(value) ? Math.max(0, Math.min(value, 86400000)) : 0;
}
export function leaderboardDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return '';
  return 'Klassement van ' + new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(day + 'T12:00:00Z'));
}
export function configureContactForm(form, meta) {
  const policy = meta?.contact_requirements || {}, box = form.querySelector('#score-contact');
  if (!box) return;
  let visible = false;
  for (const key of ['full_name', 'email', 'phone']) {
    const input = box.querySelector('[name="contact.' + key + '"]'), wrapper = input.closest('[data-contact-field]');
    const mode = policy[key] || 'disabled'; wrapper.hidden = mode === 'disabled'; input.disabled = mode === 'disabled'; input.required = mode === 'required';
    wrapper.querySelector('[data-required]').textContent = mode === 'required' ? ' (verplicht)' : ' (optioneel)';
    if (input.disabled) input.value = '';
    visible ||= !input.disabled;
  }
  box.hidden = !visible;
  box.querySelector('[data-contact-notice]').textContent = 'Deze contactgegevens zijn privé en worden gevraagd voor leaderboard- en prijsdeelname. Ze verschijnen niet in het openbare klassement. Beschikbaar voor beheer tot ' + (policy.retention_days || 90) + ' dagen; geen marketinginschrijving.';
}
export function contactPayload(form) {
  const contact = {};
  for (const key of ['full_name', 'email', 'phone']) {
    const input = form.querySelector('[name="contact.' + key + '"]');
    if (input && !input.disabled && input.value.trim()) contact[key] = input.value.trim();
  }
  return Object.keys(contact).length ? contact : undefined;
}
export function clearFieldErrors(form) {
  for (const input of form.querySelectorAll('input')) { input.removeAttribute('aria-invalid'); input.setCustomValidity(''); }
  for (const message of form.querySelectorAll('[data-error-for]')) message.textContent = '';
}
export function showFieldErrors(form, fields = {}) {
  clearFieldErrors(form);
  for (const [key, message] of Object.entries(fields)) {
    const input = [...form.querySelectorAll('input')].find(i => i.name === key), node = [...form.querySelectorAll('[data-error-for]')].find(i => i.dataset.errorFor === key);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (node) node.textContent = String(message);
  }
  form.querySelector('[aria-invalid="true"]')?.focus({ preventScroll: true });
}
