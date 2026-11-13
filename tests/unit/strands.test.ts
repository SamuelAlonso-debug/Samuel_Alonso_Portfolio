import { describe, expect, it } from 'vitest';
import { blend, reach, route, SCENES, station, type Point } from '../../src/lib/strands';

const near = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6;

describe('strand route', () => {
  const sizes = [
    [390, 844, true],
    [1280, 800, false],
    [1920, 1080, false],
  ] as const;

  it('stays continuous at every corner with arcs no tighter than the bundle reach', () => {
    for (const id of [...SCENES, 'rest'])
      for (const [vw, vh, n] of sizes) {
        const s = station(id, vw, vh, n, {});
        const need = reach(s);
        const { segments, arcs } = route(s.pts, s.R, need);
        arcs.forEach((a, i) => {
          expect(a.r).toBeGreaterThanOrEqual(need);
          const start: Point = [a.C[0] + a.r * Math.cos(a.a0), a.C[1] + a.r * Math.sin(a.a0)];
          const end: Point = [
            a.C[0] + a.r * Math.cos(a.a0 + a.dl),
            a.C[1] + a.r * Math.sin(a.a0 + a.dl),
          ];
          expect(near(segments[i]?.[1] ?? [NaN, NaN], start)).toBe(true);
          expect(near(segments[i + 1]?.[0] ?? [NaN, NaN], end)).toBe(true);
        });
      }
  });

  it('moves smoothly with the scroll across every scene boundary', () => {
    const [vw, vh] = [390, 844];
    // Short sections too: a blend never spans more than either side.
    const sections = [2.1, 2, 4.8, 0.6, 1.2, 0.9, 1.4].map((h, i, all) => {
      const top = all.slice(0, i).reduce((sum, x) => sum + x * vh, 0);
      return { id: SCENES[i] ?? 'rest', top, bottom: top + h * vh };
    });
    const flat = (y: number) => {
      const f = blend(sections, y, vw, vh, true, {});
      return [...f.pts.flat(), ...f.f.map((x) => x.o), 100 * f.glass];
    };
    let prev = flat(0);
    for (let y = 4; y < (sections.at(-1)?.bottom ?? 0); y += 4) {
      const cur = flat(y);
      expect(Math.max(...cur.map((v, i) => Math.abs(v - (prev[i] ?? v))))).toBeLessThan(40);
      prev = cur;
    }
  });
});
