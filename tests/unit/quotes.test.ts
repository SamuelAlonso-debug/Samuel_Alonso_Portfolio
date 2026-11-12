import { describe, expect, it } from 'vitest';
import { quoteAt, quotesRun } from '../../src/lib/quotes';

const at = (p: number, n: number, i: number) => {
  const { opacity, y } = quoteAt(p, n, i);
  return { opacity: +opacity.toFixed(3), y: +y.toFixed(1) };
};

describe('testimonials scene', () => {
  it('runs 113 vh for two quotes', () => {
    expect(quotesRun(2)).toBe(113);
    expect(quotesRun(3)).toBe(169.5);
  });

  it('hands off between p = 0.42 and 0.58 with two quotes, as in v3', () => {
    expect(at(0.42, 2, 0)).toEqual({ opacity: 1, y: 0 });
    expect(at(0.42, 2, 1)).toEqual({ opacity: 0, y: 60 });
    expect(at(0.46, 2, 0)).toEqual({ opacity: 0.5, y: -15 });
    expect(at(0.46, 2, 1)).toEqual({ opacity: 0, y: 45 });
    expect(at(0.5, 2, 0)).toEqual({ opacity: 0, y: -30 });
    expect(at(0.5, 2, 1)).toEqual({ opacity: 0, y: 30 });
    expect(at(0.54, 2, 1)).toEqual({ opacity: 0.5, y: 15 });
    expect(at(0.58, 2, 0)).toEqual({ opacity: 0, y: -60 });
    expect(at(0.58, 2, 1)).toEqual({ opacity: 1, y: 0 });
  });

  it('shows one quote at a time between handoffs', () => {
    const shown = (p: number) => [0, 1, 2].filter((i) => quoteAt(p, 3, i).opacity === 1);
    expect(shown(0)).toEqual([0]);
    expect(shown(0.5)).toEqual([1]);
    expect(shown(1)).toEqual([2]);
  });
});
