/**
 * Neon strands geometry. Each scene has a station: a 4-point route and two bundles of hairlines.
 * The scroll blends neighboring stations. src/scripts/strands.ts draws the result.
 */
export type Rgb = [number, number, number];
export type Point = [number, number];

/** A bundle: centre offset from the route, half width, line spacing, weave amplitude and phase. */
export type Family = { o: number; w: number; g: number; a: number; ph: number; c: Rgb; e: Rgb };
export type Station = {
  pts: Point[];
  R: number;
  wave: number;
  gain: number;
  chaos: number;
  f: Family[];
};
/** keep: the scenes in view, whose text dims the strands. glass: weight of the contact lane. */
export type Frame = Station & { keep: string[]; glass: number; shift: number };
export type Section = { id: string; top: number; bottom: number };
export type Rect = { left: number; top: number; right: number; bottom: number };
/** An element's viewport rect: anchored routes follow it while it scrolls. */
export type Box = (sel: string) => Rect | undefined;
export type Arc = { C: Point; r: number; a0: number; dl: number; u: number; sg: number };

/** Colors per scene: core 1, edge 1, core 2, edge 2. */
export type Palette = Record<string, Rgb[]>;

export const SCENES = ['hero', 'statement', 'cases', 'about', 'how', 'testimonials', 'contact'];
const kind = (id: string) => (SCENES.includes(id) ? id : 'rest');

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sm = (t: number) => t * t * (3 - 2 * t);

export function station(
  id: string,
  vw: number,
  vh: number,
  n: boolean,
  pal: Palette,
  box: Box = () => undefined,
): Station {
  const P = (x: number, y: number): Point => [x * vw, y * vh];
  const k = (pal[kind(id)] ?? pal['rest'] ?? []) as Rgb[];
  const black: Rgb = [0, 0, 0];
  const at = (sel: string, l: number, t: number, r: number, b: number): Rect =>
    box(sel) ?? { left: l * vw, top: t * vh, right: r * vw, bottom: b * vh };
  const F = (fam: 0 | 1, o: number, w: number, g: number, a: number, ph: number): Family => ({
    o,
    w,
    g,
    a,
    ph,
    c: k[fam * 2] ?? black,
    e: k[fam * 2 + 1] ?? black,
  });
  switch (kind(id)) {
    case 'hero':
      return {
        pts: n
          ? [P(0.3, -0.15), P(0.3, 0.665), P(0.76, 0.665), P(0.76, 1.2)]
          : [P(0.4, -0.15), P(0.4, 0.7), P(0.965, 0.7), P(0.965, 1.2)],
        R: n ? 90 : 160,
        wave: 700,
        gain: 1,
        chaos: 0,
        f: [
          F(0, n ? -20 : -32, n ? 28 : 42, n ? 1.8 : 2.6, 6, 0),
          F(1, n ? 22 : 36, n ? 22 : 34, n ? 2.1 : 2.9, 7, 2.2),
        ],
      };
    case 'statement':
      return {
        pts: n
          ? [P(1.2, 0.22), P(0.3, 0.22), P(0.3, 0.84), P(1.2, 0.84)]
          : [P(1.2, 0.16), P(0.56, 0.16), P(0.56, 0.88), P(1.2, 0.88)],
        R: n ? 70 : 130,
        wave: 900,
        gain: 1,
        chaos: 0,
        f: [
          F(0, n ? -38 : -58, n ? 38 : 58, n ? 1.9 : 2.6, 4, 0),
          F(1, n ? 43 : 66, n ? 28 : 44, n ? 2.2 : 2.9, 4, 1.6),
        ],
      };
    case 'cases':
      return {
        pts: n
          ? [P(0.92, -0.2), P(0.92, 0.4), P(0.92, 0.7), P(0.92, 1.2)]
          : [P(-0.2, 0.47), P(0.3, 0.47), P(0.7, 0.47), P(1.2, 0.47)],
        R: 40,
        wave: n ? 520 : 1300,
        gain: n ? 0.8 : 1,
        chaos: 0.85,
        f: [
          F(0, 0, n ? 16 : 34, n ? 1.9 : 2.6, n ? 10 : 60, 0),
          F(1, 0, n ? 13 : 30, n ? 2.2 : 2.9, n ? 10 : 60, Math.PI),
        ],
      };
    case 'about': {
      // Orbits the clock card: ∩ on phones, U opening left on desktop. Once the card leaves the
      // top, the ∩ waits just above the screen: the blend to how I work turns its legs about
      // these corners, and from far above they would sweep out of view.
      const d = at('#about .dial', 0.05, 0.2, 0.45, 0.8);
      const top = Math.max(d.top - 28, -0.1 * vh);
      return {
        pts: n
          ? [
              [d.left - 8, d.bottom + vh],
              [d.left - 8, top],
              [d.right + 8, top],
              [d.right + 8, d.bottom + vh],
            ]
          : [
              [-0.2 * vw, d.top - 40],
              [d.right + 44, d.top - 40],
              [d.right + 44, d.bottom + 40],
              [-0.2 * vw, d.bottom + 40],
            ],
        R: n ? 90 : 150,
        wave: 800,
        gain: 0.9,
        chaos: 0.15,
        f: [
          F(0, n ? -16 : -26, n ? 20 : 30, n ? 1.9 : 2.6, 3, 0),
          F(1, n ? 18 : 30, n ? 14 : 24, n ? 2.2 : 2.9, 3, 1.4),
        ],
      };
    }
    case 'how': {
      // Down the right edge, then the baseline under the services. On phones the line first
      // crosses above the screen, out of view, so its legs match the ∩ of about before it: there
      // the leg along the top runs to the right, here it runs down the edge. Matched like this
      // no leg reverses mid-transition (it would shrink through zero and the hairlines fold).
      const x = (n ? 0.975 : 0.985) * vw;
      const y = at('#how .rows', 0, 0.2, 1, 0.85).bottom + 44;
      return {
        pts: n
          ? [
              [0.2 * vw, -0.3 * vh],
              [x, -0.3 * vh],
              [x, y],
              [-0.2 * vw, y],
            ]
          : [
              [x, -0.2 * vh],
              [x, y],
              [0.4 * vw, y],
              [-0.2 * vw, y],
            ],
        R: n ? 100 : 170,
        wave: 900,
        gain: 0.9,
        chaos: 0.25,
        f: [
          F(0, n ? -14 : -24, n ? 16 : 28, n ? 1.9 : 2.6, 4, 0),
          F(1, n ? 14 : 26, n ? 12 : 22, n ? 2.2 : 2.9, 4, 2),
        ],
      };
    }
    case 'testimonials': {
      // Many voices: a loose braid under the quote. It runs right to left like its neighbors
      // (how I work, contact): a reversed route folds on itself mid-transition and breaks.
      const q = at('#testimonials .quotes', 0, 0.25, 1, 0.7);
      const y = Math.min(q.bottom + (n ? 30 : 60), 0.9 * vh);
      return {
        pts: [
          [1.2 * vw, y],
          [0.7 * vw, y],
          [0.3 * vw, y],
          [-0.2 * vw, y],
        ],
        R: 40,
        wave: n ? 520 : 1100,
        gain: 0.95,
        chaos: 0.75,
        f: [
          F(0, 0, n ? 16 : 30, n ? 1.9 : 2.6, n ? 14 : 50, 0),
          F(1, 0, n ? 13 : 26, n ? 2.2 : 2.9, n ? 14 : 50, Math.PI),
        ],
      };
    }
    case 'contact': {
      // Two rails come down (desktop: between copy and form) and close in rings around the orb:
      // the route ends at its centre, so the offset bundles wrap around that end.
      const o = at('#contact .orb', 0.05, 0.7, 0.2, 0.9);
      const cx = (o.left + o.right) / 2;
      const cy = (o.top + o.bottom) / 2;
      const rad = (o.right - o.left) / 2;
      const copy = box('#contact .inner > :first-child');
      const form = box('#contact form');
      const x = n
        ? 0.8 * vw
        : copy && form && form.left > copy.right
          ? (copy.right + form.left) / 2
          : 0.78 * vw;
      return {
        pts: [
          [x, -0.3 * vh],
          [x, cy],
          [(x + cx) / 2, cy],
          [cx, cy],
        ],
        R: n ? 90 : 180,
        wave: 900,
        gain: 1,
        chaos: 0,
        f: [
          F(0, -(rad + 22), n ? 16 : 22, n ? 1.9 : 2.6, 0, 0),
          F(1, rad + 22, n ? 14 : 20, n ? 2.2 : 2.9, 0, 0),
        ],
      };
    }
    default:
      return {
        pts: [P(0.965, -0.2), P(0.965, 0.4), P(0.965, 0.7), P(0.965, 1.2)],
        R: 40,
        wave: 600,
        gain: 0.6,
        chaos: 0.5,
        f: [F(0, -8, 10, n ? 1.9 : 2.6, 3, 0), F(1, 10, 8, n ? 2.2 : 2.9, 3, 2)],
      };
  }
}

/** How far the hairlines reach from the route: no arc may be tighter. */
export const reach = (s: Station) =>
  Math.max(...s.f.map((f) => Math.abs(f.o) + f.w * 1.5 + f.a)) + 70 * s.chaos + 16;

const wrap = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const dir = (a: Point, b: Point) => Math.atan2(b[1] - a[1], b[0] - a[0]);

/**
 * Route points between two stations. The inner points move straight; each end leg keeps its
 * length and turns about its inner point. A straight move can pass an end through its neighbor:
 * the leg shrinks to nothing, its arc shrinks with it below the bundle reach and the hairlines
 * fold into a hard seam. The turn at each corner is blended as a signed angle, so it never
 * passes through a hairpin.
 */
function tween(P: Point[], Q: Point[], t: number): Point[] {
  const mid = P.map((p, j): Point => {
    const q = Q[j] ?? p;
    return [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
  });
  const n = mid.length;
  if (n < 3 || Q.length !== n || t <= 0 || t >= 1) return mid;
  const pt = (S: Point[], j: number): Point => S[j] ?? [0, 0];
  // End leg e–i next to inner point i, whose other neighbor is k.
  const leg = (e: number, i: number, k: number) => {
    const turn = (S: Point[]) => wrap(dir(pt(S, k), pt(S, i)) - dir(pt(S, i), pt(S, e)));
    const len = (S: Point[]) => Math.hypot(pt(S, e)[0] - pt(S, i)[0], pt(S, e)[1] - pt(S, i)[1]);
    const a = dir(pt(mid, k), pt(mid, i)) - lerp(turn(P), turn(Q), t);
    const l = lerp(len(P), len(Q), t);
    const [x, y] = pt(mid, i);
    mid[e] = [x + l * Math.cos(a), y + l * Math.sin(a)];
  };
  leg(0, 1, 2);
  leg(n - 1, n - 2, n - 3);
  return mid;
}

/**
 * Stations of the section at mid-screen and the next one, blended while their boundary crosses
 * the screen. The blend spans at most either section, and the pair changes where a blend ends,
 * so nothing jumps.
 */
export function blend(
  sections: Section[],
  scrollY: number,
  vw: number,
  vh: number,
  n: boolean,
  pal: Palette,
  box?: Box,
): Frame {
  const y = scrollY + vh * 0.5;
  const span = (j: number) => {
    const [s, x] = [sections[j], sections[j + 1]];
    return s && x ? Math.min(vh * 1.1, s.bottom - s.top, x.bottom - x.top) : 0;
  };
  let i = sections.findIndex((s, j) => y < s.bottom + 0.55 * span(j));
  if (i < 0) i = sections.length - 1;
  const a = sections[i] ?? { id: 'rest', top: 0, bottom: 0 };
  const b = sections[i + 1];
  const w = span(i);
  const t = w ? sm(clamp((y - a.bottom + 0.45 * w) / w)) : 0;
  const A = station(a.id, vw, vh, n, pal, box);
  const B = b ? station(b.id, vw, vh, n, pal, box) : A;
  const lane = (id = '') => (kind(id) === 'contact' ? 1 : 0);
  // Order → disorder → order: mid-transition the bundles trade sides and chaos peaks.
  const swap = Math.sin(Math.PI * t);
  return {
    keep: sections.filter((s) => s.bottom > scrollY && s.top < scrollY + vh).map((s) => kind(s.id)),
    glass: lerp(lane(a.id), lane(b?.id), t),
    pts: tween(A.pts, B.pts, t),
    R: lerp(A.R, B.R, t),
    wave: lerp(A.wave, B.wave, t),
    gain: lerp(A.gain, B.gain, t),
    chaos: Math.max(lerp(A.chaos, B.chaos, t), 0.9 * swap),
    f: A.f.map((fa, j) => {
      const fb = B.f[j] ?? fa;
      return {
        o: lerp(fa.o, fb.o, t) * (1 - 2 * swap),
        w: lerp(fa.w, fb.w, t),
        g: lerp(fa.g, fb.g, t),
        a: lerp(fa.a, fb.a, t) + 30 * swap,
        ph: lerp(fa.ph, fb.ph, t),
        c: mix(fa.c, fb.c, t),
        e: mix(fa.e, fb.e, t),
      };
    }),
    shift: scrollY / 240,
  };
}

/**
 * Straight segments joined by exact circular arcs. Each arc radius is at least `need`, so no
 * hairline crosses a corner's centre (there the line would break into pieces), unless the
 * segments leave no room.
 */
export function route(pts: Point[], R: number, need: number) {
  const segments: [Point, Point, number][] = [];
  const arcs: Arc[] = [];
  const len = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [p0, p1, p2, p3] = pts as [Point, Point, Point, Point];
  const cross = (a: Point, b: Point, c: Point) =>
    (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
  const straight2 = Math.abs(cross(p1, p2, p3)) < 1e-3 * (len(p1, p2) * len(p2, p3) + 1e-6);
  let u = 0;
  let cur = p0;
  let used = 0;
  for (const [a, p, c, first] of [
    [p0, p1, p2, true],
    [p1, p2, p3, false],
  ] as const) {
    const l1 = len(a, p) || 1e-3;
    const l2 = len(p, c) || 1e-3;
    const d1 = [(p[0] - a[0]) / l1, (p[1] - a[1]) / l1] as const;
    const d2 = [(c[0] - p[0]) / l2, (c[1] - p[1]) / l2] as const;
    const cr = d1[0] * d2[1] - d1[1] * d2[0];
    const th = Math.atan2(Math.abs(cr), d1[0] * d2[0] + d1[1] * d2[1]);
    if (th < 1e-3) continue;
    // The first corner shares the middle segment with the second, unless that one is straight.
    const room = first
      ? Math.min(l1, straight2 ? l2 + len(p2, p3) : l2 / 2)
      : Math.min(l1 - used, l2);
    const tan = Math.tan(th / 2);
    const r = Math.min(Math.max(R, need), room / tan);
    const tl = r * tan;
    used = tl;
    const S: Point = [p[0] - d1[0] * tl, p[1] - d1[1] * tl];
    const E: Point = [p[0] + d2[0] * tl, p[1] + d2[1] * tl];
    const sg = Math.sign(cr);
    const C: Point = [S[0] - sg * d1[1] * r, S[1] + sg * d1[0] * r];
    const a0 = Math.atan2(S[1] - C[1], S[0] - C[0]);
    let dl = Math.atan2(E[1] - C[1], E[0] - C[0]) - a0;
    if (dl > Math.PI) dl -= 2 * Math.PI;
    if (dl < -Math.PI) dl += 2 * Math.PI;
    segments.push([cur, S, u]);
    u += len(cur, S);
    arcs.push({ C, r, a0, dl, u, sg });
    u += r * th;
    cur = E;
  }
  segments.push([cur, p3, u]);
  return { segments, arcs };
}

// OKLCH keeps saturation through hue changes; an RGB mix greys out violet → green.
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.003131 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function toLch(rgb: Rgb): Rgb {
  const [r, g, b] = rgb.map(lin) as Rgb;
  const l = Math.cbrt(0.412221 * r + 0.536333 * g + 0.051446 * b);
  const m = Math.cbrt(0.211903 * r + 0.6807 * g + 0.107397 * b);
  const s = Math.cbrt(0.088302 * r + 0.281719 * g + 0.629979 * b);
  const A = 1.977998 * l - 2.428592 * m + 0.450594 * s;
  const B = 0.025904 * l + 0.782772 * m - 0.808676 * s;
  return [0.210454 * l + 0.793618 * m - 0.004072 * s, Math.hypot(A, B), Math.atan2(B, A)];
}

function fromLch([L, C, H]: Rgb): Rgb {
  const A = C * Math.cos(H);
  const B = C * Math.sin(H);
  const l = (L + 0.396338 * A + 0.215804 * B) ** 3;
  const m = (L - 0.105561 * A - 0.063854 * B) ** 3;
  const s = (L - 0.089484 * A - 1.291486 * B) ** 3;
  return [
    4.076742 * l - 3.307712 * m + 0.23097 * s,
    -1.268438 * l + 2.609757 * m - 0.341319 * s,
    -0.004196 * l - 0.703419 * m + 1.707615 * s,
  ].map((v) => clamp(gam(clamp(v)))) as Rgb;
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const x = toLch(a);
  const y = toLch(b);
  let dh = y[2] - x[2];
  if (dh > Math.PI) dh -= 2 * Math.PI;
  if (dh < -Math.PI) dh += 2 * Math.PI;
  return fromLch([lerp(x[0], y[0], t), lerp(x[1], y[1], t), x[2] + dh * t]);
}

/** Every `oklch(L% C H)` in a token value as sRGB 0–1. Plain math: a 2D canvas costs a long task. */
export function parseOklch(value: string): Rgb[] {
  return [...value.matchAll(/oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)/g)].map(([, L, C, H]) =>
    fromLch([Number(L) / 100, Number(C), (Number(H) * Math.PI) / 180]),
  );
}
