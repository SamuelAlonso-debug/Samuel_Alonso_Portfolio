/**
 * Scroll scenes on native scroll. One rAF loop eases each pinned scene toward its
 * scroll progress and stops when settled. Reduced motion: final states, no loop.
 */
import { quoteAt, quotesRun } from '../lib/quotes';
import { panelAt, trackRun } from '../lib/track';

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 820px)');
const byId = (id: string) => document.getElementById(id);

interface Scene {
  el: HTMLElement;
  cur: number;
  /** Progress last drawn: a settled scene is not redrawn. */
  shown?: number | undefined;
  measure?: () => void;
  update: (p: number) => void;
}

const scenes: Scene[] = [];

function progress(el: HTMLElement): number {
  const run = el.offsetHeight - innerHeight;
  return run > 0 ? clamp(-el.getBoundingClientRect().top / run) : 0;
}

// Hero: the wall closes into a window, the name docks top-left, the copy reappears under it.
const hero = byId('hero');
const photo = byId('hero-photo');
const wall = byId('hero-wall');
const veil = byId('hero-veil');
const heroName = byId('hero-name');
const copy = byId('hero-copy');
const dockName = byId('dock-name');
const dockCopy = byId('dock-copy');

if (hero && photo && wall && veil && heroName && copy && dockName && dockCopy) {
  const screens = [...wall.children] as HTMLElement[];
  let m: {
    n: DOMRect;
    c: DOMRect;
    dn: DOMRect;
    dc: DOMRect;
    end: { t: number; r: number; l: number };
    start: { l: number; t: number; s: number };
  } | null = null;

  const measure = () => {
    heroName.style.transform = copy.style.transform = '';
    const n = heroName.getBoundingClientRect();
    const c = copy.getBoundingClientRect();
    const dn = dockName.getBoundingClientRect();
    const dc = dockCopy.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = innerHeight;
    const end = narrow.matches
      ? {
          t: Math.min(vh - 140, Math.max(vh * 0.6, dc.top + c.height + 24)),
          r: vw * 0.06,
          l: vw * 0.06,
        }
      : { t: vh * 0.13, r: vw * 0.05, l: vw * 0.53 };
    Object.assign(wall.style, {
      left: `${end.l}px`,
      top: `${end.t}px`,
      width: `${vw - end.l - end.r}px`,
      height: `${vh - end.t}px`,
      visibility: 'visible',
    });
    const shown = screens.filter((s) => s.offsetParent);
    const bottom = Math.max(...shown.map((s) => s.offsetTop + s.offsetHeight));
    const left = Math.min(...shown.map((s) => s.offsetLeft));
    const right = Math.max(...shown.map((s) => s.offsetLeft + s.offsetWidth));
    let start;
    if (narrow.matches) {
      const s = clamp((c.top - 104) / bottom, 0.45, 1);
      start = { l: vw / 2 - (s * (left + right)) / 2, t: 80, s };
    } else {
      const t = vh * 0.09;
      const edge = vw * 0.95;
      let s = clamp((c.top - 24 - t) / bottom, 0.5, 0.8);
      if (n.right + 32 > edge - right * s)
        s = clamp(Math.min(s, (n.top - 24 - t) / bottom), 0.5, 0.8);
      start = { l: edge - right * s, t, s };
    }
    m = { n, c, dn, dc, end, start };
  };

  const update = (p: number) => {
    if (!m) return;
    const { n, c, dn, dc, end, start } = m;
    const e = ease(p);
    const r = 28 * e;
    photo.style.clipPath = `inset(${end.t * e}px ${end.r * e}px 0 ${end.l * e}px round ${r}px ${r}px 0 0)`;
    if (narrow.matches) {
      // Phones: the screen fades out in place and reappears in its window; it never crosses the text.
      const out = ease(clamp(e / 0.3));
      const back = ease(clamp((e - 0.6) / 0.4));
      const docked = e >= 0.5;
      wall.style.transform = docked
        ? `translate3d(0, ${(1 - back) * 24}px, 0)`
        : `translate3d(${start.l - end.l}px, ${start.t - end.t - out * 16}px, 0) scale(${start.s})`;
      wall.style.opacity = String(docked ? back : 1 - out);
      veil.style.opacity = String(1 - e);
    } else {
      wall.style.transform = `translate3d(${(start.l - end.l) * (1 - e)}px, ${(start.t - end.t) * (1 - e)}px, 0) scale(${lerp(start.s, 1, e)})`;
      wall.style.opacity = '1';
      veil.style.opacity = '0';
    }
    screens[1]?.style.setProperty('translate', `0 ${-18 * e}px`);
    screens[2]?.style.setProperty('translate', `0 ${36 * e}px`);
    const en = ease(clamp(p / 0.62));
    heroName.style.transform = `translate(${(dn.left - n.left) * en}px, ${(dn.top - n.top) * en}px) scale(${lerp(1, dn.height / n.height, en)})`;
    // The copy leaves in place, then arrives under the docked name.
    const docked = p >= 0.5;
    const o = docked ? ease(clamp((p - 0.5) / 0.3)) : 1 - ease(clamp(p / 0.2));
    copy.style.transform = docked
      ? `translate3d(${dc.left - c.left}px, ${dc.top - c.top + (1 - o) * 24}px, 0)`
      : `translate3d(0, ${(1 - o) * 24}px, 0)`;
    copy.style.opacity = String(o);
    copy.style.visibility = o < 0.02 ? 'hidden' : '';
  };

  scenes.push({ el: hero, cur: 0, measure, update });
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
      // Only words whose value changed: a style write per word per frame restyles every word.
      words.forEach((w, i) => {
        const lit = String(clamp(k - i));
        if (w.style.getPropertyValue('--lit') !== lit) w.style.setProperty('--lit', lit);
      });
    },
  });
}

// Cases: vertical scroll drives the horizontal track. ≤820 px and reduced motion: a list.
const cases = byId('cases');
const track = byId('track');
if (cases && track) {
  const panels = [...track.querySelectorAll<HTMLElement>('.panel')];
  const media = panels.map((p) => p.querySelector<HTMLElement>('.media-inner'));
  const count = byId('count');
  const bar = byId('count-bar');
  const pinned = () => !narrow.matches && !reduce.matches;
  let shift = 0;
  let centers: number[] = [];

  scenes.push({
    el: cases,
    cur: 0,
    measure: () => {
      track.style.transform = '';
      media.forEach((m) => m?.style.removeProperty('translate'));
      const vw = document.documentElement.clientWidth;
      shift = pinned() ? Math.max(0, track.scrollWidth - vw) : 0;
      cases.style.height = pinned() ? `${trackRun(shift, innerHeight) + innerHeight}px` : '';
      centers = panels.map((p) => p.offsetLeft + p.offsetWidth / 2 - vw / 2);
    },
    update: (p) => {
      if (!pinned()) return;
      const vw = document.documentElement.clientWidth;
      track.style.transform = `translate3d(${-shift * p}px, 0, 0)`;
      // Each screen drifts slightly against the track (parallax).
      media.forEach((m, i) =>
        m?.style.setProperty('translate', `${(((centers[i] ?? 0) - shift * p) / vw) * -9}% 0`),
      );
      const n = String(panelAt(p, panels.length)).padStart(2, '0');
      if (count && count.textContent !== n) count.textContent = n;
      bar?.style.setProperty('transform', `scaleX(${p})`);
    },
  });
}

// Testimonials: one quote leaves as the next arrives. Stacked with one quote, with reduced
// motion, or when a quote does not fit the screen.
const voices = byId('testimonials');
const quotes = [...(voices?.querySelectorAll<HTMLElement>('.quote') ?? [])];
const quoteBox = quotes[0]?.parentElement;
if (voices && quoteBox && quotes.length > 1) {
  const pinned = () => voices.classList.contains('pinned');
  scenes.push({
    el: voices,
    cur: 0,
    measure: () => {
      voices.classList.toggle('pinned', !reduce.matches);
      const fits = pinned() && quotes.every((q) => q.offsetHeight <= quoteBox.clientHeight);
      voices.classList.toggle('pinned', fits);
      voices.style.height = fits ? `${quotesRun(quotes.length) + 100}vh` : '';
      if (!fits) for (const q of quotes) q.style.opacity = q.style.transform = '';
    },
    update: (p) => {
      if (!pinned()) return;
      quotes.forEach((q, i) => {
        const { opacity, y } = quoteAt(p, quotes.length, i);
        q.style.opacity = String(opacity);
        q.style.transform = `translate3d(0, ${y}px, 0)`;
      });
    },
  });
  // A focused link (author profile) scrolls its quote into view.
  voices.addEventListener('focusin', (e) => {
    const i = quotes.findIndex((q) => q.contains(e.target as Node));
    if (i < 0 || !pinned()) return;
    const top = scrollY + voices.getBoundingClientRect().top;
    scrollTo(0, top + (voices.offsetHeight - innerHeight) * ((i + 0.5) / quotes.length));
  });
}

// Contact: the curve over the ink field flattens as the field rises (CSS hides it with
// reduced motion).
const curve = document.querySelector<HTMLElement>('#contact .curve');
// Readers measure now and return their writes, so a frame reads everything before it writes.
function readCurve() {
  const top = curve?.parentElement?.getBoundingClientRect().top;
  return () => {
    if (curve && top !== undefined)
      curve.style.transform = `scaleY(${clamp(top / (innerHeight * 0.9))})`;
  };
}

// Page tone and the current header link follow the scene at mid-screen.
const toned = [...document.querySelectorAll<HTMLElement>('main [data-tone]')];
const sectionLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-section-link]')];
let currentId: string | undefined;
function readTone() {
  const mid = innerHeight / 2;
  const rects = toned.map((s) => s.getBoundingClientRect());
  let i = rects.findIndex((r) => r.top <= mid && r.bottom > mid);
  // Past the last scene (footer): the last scene keeps the tone.
  if (i < 0 && (rects.at(-1)?.bottom ?? mid) < mid) i = toned.length - 1;
  let hit = toned[i];
  // data-tone-at="top" (contact): the scene takes over once its top reaches the screen top.
  if (hit?.dataset['toneAt'] === 'top' && (rects[i]?.top ?? 0) > 1) hit = toned[i - 1];
  return () => {
    const tone = hit?.dataset['tone'];
    if (tone && document.documentElement.dataset['tone'] !== tone) {
      document.documentElement.dataset['tone'] = tone;
    }
    if (hit?.id === currentId) return;
    currentId = hit?.id;
    for (const link of sectionLinks) {
      if (currentId && link.hash === `#${currentId}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
}

function draw(s: Scene) {
  if (s.cur === s.shown) return;
  s.update(s.cur);
  s.shown = s.cur;
}

let running = false;
function frame() {
  const targets = scenes.map((s) => progress(s.el));
  const writes = [readCurve(), readTone()];
  let moving = false;
  scenes.forEach((s, i) => {
    const target = targets[i] ?? s.cur;
    s.cur += (target - s.cur) * 0.14;
    if (Math.abs(target - s.cur) < 4e-4) s.cur = target;
    else moving = true;
    draw(s);
  });
  for (const write of writes) write();
  running = moving;
  if (moving) requestAnimationFrame(frame);
}

function onScroll() {
  if (reduce.matches) return readTone()();
  if (!running) {
    running = true;
    requestAnimationFrame(frame);
  }
}

function layout() {
  for (const s of scenes) {
    s.measure?.();
    s.cur = reduce.matches ? 1 : progress(s.el);
    s.shown = undefined;
    draw(s);
  }
  readCurve()();
  readTone()();
}

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', layout);
reduce.addEventListener('change', layout);
void document.fonts.ready.then(layout);
