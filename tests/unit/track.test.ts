import { describe, expect, it } from 'vitest';
import { panelAt, trackRun } from '../../src/lib/track';

describe('case track', () => {
  it('runs (shift + 15 vh) ÷ 1.15', () => {
    expect(trackRun(2000, 1000)).toBeCloseTo(1869.57, 2);
    expect(trackRun(0, 900)).toBeCloseTo(117.39, 2);
  });

  it('counts panels from 1 to the last one', () => {
    expect(panelAt(0, 3)).toBe(1);
    expect(panelAt(0.4, 3)).toBe(2);
    expect(panelAt(0.7, 3)).toBe(3);
    expect(panelAt(1, 3)).toBe(3);
  });
});
