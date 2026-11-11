/**
 * Scroll scenes on native scroll. One rAF loop eases each pinned scene toward its
 * scroll progress and stops when settled. Reduced motion: final states, no loop.
 */
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const byId = (id: string) => document.getElementById(id);

interface Scene {
  el: HTMLElement;
  cur: number;
  measure?: () => void;
  update: (p: number) => void;
}

const scenes: Scene[] = [];

function progress(el: HTMLElement): number {
  const run = el.offsetHeight - innerHeight;
  return run > 0 ? clamp(-el.getBoundingClientRect().top / run) : 0;
}

// Statement: words light up in reading order.
const statement = byId('statement');
if (statement) {
  const words = [...statement.querySelectorAll<HTMLElement>('.w')];
  scenes.push({
    el: statement,
    cur: 0,
    update: (p) => {
      const k = clamp(p * 1.2) * words.length;
      words.forEach((w, i) => (w.style.opacity = String(lerp(0.4, 1, clamp(k - i)))));
    },
  });
}

// Page tone follows the scene at mid-screen.
const toned = [...document.querySelectorAll<HTMLElement>('main [data-tone]')];
function updateTone() {
  const mid = innerHeight / 2;
  const hit = toned.find((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= mid && r.bottom > mid;
  });
  if (hit?.dataset['tone'] && document.documentElement.dataset['tone'] !== hit.dataset['tone']) {
    document.documentElement.dataset['tone'] = hit.dataset['tone'];
  }
}

let running = false;
function frame() {
  let moving = false;
  for (const s of scenes) {
    const target = progress(s.el);
    s.cur += (target - s.cur) * 0.14;
    if (Math.abs(target - s.cur) < 4e-4) s.cur = target;
    else moving = true;
    s.update(s.cur);
  }
  updateTone();
  running = moving;
  if (moving) requestAnimationFrame(frame);
}

function onScroll() {
  if (reduce.matches) return updateTone();
  if (!running) {
    running = true;
    requestAnimationFrame(frame);
  }
}

function layout() {
  for (const s of scenes) {
    s.measure?.();
    s.cur = reduce.matches ? 1 : progress(s.el);
    s.update(s.cur);
  }
  updateTone();
}

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', layout);
reduce.addEventListener('change', layout);
void document.fonts.ready.then(layout);
