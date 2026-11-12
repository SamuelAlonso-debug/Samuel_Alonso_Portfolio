/**
 * About dial: Querétaro time, working-hours state, and one entrance where the hours
 * arc draws and the hand sweeps from midnight to now. Reduced motion: static dial.
 */
import { availability, dialAngle, queretaroTime, type Availability } from '../lib/availability';

const dial = document.getElementById('dial');
const svg = dial?.querySelector('svg');
const hand = dial?.querySelector<SVGGElement>('.hand');
const sweep = dial?.querySelector<SVGPathElement>('.sweep');
const [hours, , minutes] = dial?.querySelectorAll('.now tspan') ?? [];
const status = dial?.querySelector<HTMLElement>('.status');
const statusText = status?.querySelector('span');

if (dial && svg && hand && sweep && hours && minutes && status && statusText) {
  const text = JSON.parse(dial.dataset['text'] ?? '{}') as Record<Availability | 'now', string>;
  const pad = (n: number) => String(n).padStart(2, '0');
  const angle = () => {
    const local = queretaroTime(new Date());
    return `rotate(${dialAngle(local.h, local.m)}deg)`;
  };
  // Read the drawn state before hiding the arc for the entrance.
  const drawn = getComputedStyle(sweep).transform;
  let intro = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (intro) dial.dataset['intro'] = '';

  const tick = () => {
    const local = queretaroTime(new Date());
    const time = `${pad(local.h)}:${pad(local.m)}`;
    const state = availability(local);
    hours.textContent = pad(local.h);
    minutes.textContent = pad(local.m);
    svg.setAttribute('aria-label', text.now.replace('{time}', time));
    status.toggleAttribute('data-on', state === 'on');
    statusText.textContent = text[state];
    if (!intro) hand.style.transform = angle();
  };
  tick();
  setInterval(tick, 20_000);

  if (intro) {
    new IntersectionObserver(
      (entries, observer) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        const to = angle();
        const timing = { easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' } as const;
        delete dial.dataset['intro'];
        sweep.animate([{ transform: 'rotate(0deg)' }, { transform: drawn }], {
          ...timing,
          duration: 1100,
        });
        hand.style.transform = to;
        const sweepHand = hand.animate([{ transform: 'rotate(180deg)' }, { transform: to }], {
          ...timing,
          duration: 1300,
          delay: 150,
        });
        sweepHand.onfinish = sweepHand.oncancel = () => {
          intro = false;
          tick();
        };
      },
      { threshold: 0.45 },
    ).observe(dial);
  }
}
