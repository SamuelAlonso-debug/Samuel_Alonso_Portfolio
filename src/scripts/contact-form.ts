/** Contact form: shown only with JS, sent through the `contact` Action, errors localized. */
import { actions, isInputError } from 'astro:actions';

declare const turnstile: { reset(): void } | undefined;

const form = document.querySelector<HTMLFormElement>('#contact-form');
if (form) {
  const errors: Record<string, string> = JSON.parse(form.dataset['errors'] ?? '{}');
  const status = form.querySelector<HTMLElement>('.status');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const label = button?.textContent ?? '';
  form.hidden = false;

  const show = (text: string) => {
    if (status) status.textContent = text;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!button || button.disabled) return;
    for (const el of form.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
    button.disabled = true;
    button.textContent = form.dataset['sending'] ?? label;
    show('');

    const { error } = await actions.contact(new FormData(form));
    button.disabled = false;
    button.textContent = label;
    if (typeof turnstile !== 'undefined') turnstile.reset();

    if (!error) {
      form.reset();
      show(form.dataset['sent'] ?? '');
      return;
    }
    if (isInputError(error)) {
      const fields = Object.keys(error.fields);
      for (const name of fields) {
        const el = form.elements.namedItem(name);
        if (el instanceof Element) el.setAttribute('aria-invalid', 'true');
      }
      const keys = fields.map((name) => (name === 'cf-turnstile-response' ? 'turnstile' : name));
      show([...new Set(keys.map((key) => errors[key] ?? errors['failed']))].join(' '));
      form.querySelector<HTMLElement>('[aria-invalid]')?.focus();
      return;
    }
    show(errors[error.message] ?? errors['failed'] ?? '');
  });
}
