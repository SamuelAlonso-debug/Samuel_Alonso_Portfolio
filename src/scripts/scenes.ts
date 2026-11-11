/**
 * Scroll scenes on native scroll. One rAF loop eases each pinned scene toward its
 * scroll progress and stops when settled. Reduced motion: final states, no loop.
 */
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 820px)');
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
