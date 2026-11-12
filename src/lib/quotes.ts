/** Testimonials scene math. Pure, so it is unit-tested. */

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Pinned run in vh: 56.5 vh per quote, so two quotes run 113 vh (v3 ÷ 1.15). */
export function quotesRun(quotes: number): number {
  return 56.5 * quotes;
}

/**
 * Quote `i` of `n` at progress `p` (0–1): opacity and vertical offset in px.
 * Handoff k (quote k−1 → k) runs while p·n goes from k − 0.16 to k + 0.16. The leaving
 * quote fades in the first half and the next one in the second, so two never overlap.
 */
export function quoteAt(p: number, n: number, i: number): { opacity: number; y: number } {
  const handoff = (k: number) => clamp((p * n - k + 0.16) / 0.32);
  const arrive = i === 0 ? 1 : handoff(i);
  const leave = i === n - 1 ? 0 : handoff(i + 1);
  return {
    opacity: clamp(arrive * 2 - 1) * (1 - clamp(leave * 2)),
    y: (1 - arrive - leave) * 60,
  };
}
