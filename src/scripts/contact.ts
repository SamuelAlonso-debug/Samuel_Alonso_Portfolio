/**
 * Contact: live Querétaro time, and the page's primary actions (`.magnetic`): they pull
 * toward a fine pointer and turn the nav CTA neutral while on screen (one amber per view).
 */
import { queretaroTime } from '../lib/availability';

const clock = document.querySelector<HTMLElement>('#contact .clock');
if (clock) {
  const text = clock.dataset['text'] ?? '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const tick = () => {
    const { h, m } = queretaroTime(new Date());
    clock.textContent = text.replace('{time}', `${pad(h)}:${pad(m)}`);
  };
  tick();
  setInterval(tick, 20_000);
}

const primaries = [...document.querySelectorAll<HTMLElement>('.magnetic')];
const onScreen = new Set<Element>();
const watch = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) onScreen.add(e.target);
    else onScreen.delete(e.target);
  }
  document.body.toggleAttribute('data-primary-visible', onScreen.size > 0);
});
for (const el of primaries) watch.observe(el);

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  // The inline transition replaces the button's own, so press and hover are restated.
  const pull = (el: Element | null, x: number, y: number, timing: string) => {
    if (!(el instanceof HTMLElement)) return;
    el.style.transition = `translate ${timing}, scale 150ms ease-out, background-color 150ms ease-out`;
    el.style.translate = `${x}px ${y}px`;
  };
  for (const m of primaries) {
    m.addEventListener('pointermove', (e) => {
      if (reduce.matches) return;
      const r = m.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      pull(m, x * 0.22, y * 0.3, '120ms linear');
      pull(m.firstElementChild, x * 0.1, y * 0.12, '120ms linear');
    });
    m.addEventListener('pointerleave', () => {
      const settle = '500ms cubic-bezier(0.22, 1, 0.36, 1)';
      pull(m, 0, 0, settle);
      pull(m.firstElementChild, 0, 0, settle);
    });
  }
}
