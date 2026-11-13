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
/** kind: the scene whose text dims the strands. */
export type Frame = Station & { kind: string; shift: number };
export type Section = { id: string; top: number; bottom: number };
export type Arc = { C: Point; r: number; a0: number; dl: number; u: number; sg: number };

/** Colors per scene: core 1, edge 1, core 2, edge 2. */
export type Palette = Record<string, Rgb[]>;

export const SCENES = ['hero', 'statement', 'cases'];
const kind = (id: string) => (SCENES.includes(id) ? id : 'rest');

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sm = (t: number) => t * t * (3 - 2 * t);

export function station(id: string, vw: number, vh: number, n: boolean, pal: Palette): Station {
  const P = (x: number, y: number): Point => [x * vw, y * vh];
  const k = (pal[kind(id)] ?? pal['rest'] ?? []) as Rgb[];
  const black: Rgb = [0, 0, 0];
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

/** Stations of the section at mid-screen and the next one, blended near the boundary. */
export function blend(
  sections: Section[],
  scrollY: number,
  vw: number,
  vh: number,
  n: boolean,
  pal: Palette,
): Frame {
  const y = scrollY + vh * 0.5;
  let i = sections.findIndex((s) => y < s.bottom);
  if (i < 0) i = sections.length - 1;
  const a = sections[i] ?? { id: 'rest', top: 0, bottom: 0 };
  const b = sections[i + 1] ?? a;
  const t = sm(clamp((y - (a.bottom - vh * 0.45)) / (vh * 0.7)));
  const A = station(a.id, vw, vh, n, pal);
  const B = station(b.id, vw, vh, n, pal);
  // Order → disorder → order: mid-transition the bundles trade sides and chaos peaks.
  const swap = Math.sin(Math.PI * t);
  return {
    kind: kind(t < 0.5 ? a.id : b.id),
    pts: A.pts.map((p, j) => {
      const q = B.pts[j] ?? p;
      return [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
    }),
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
