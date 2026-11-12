/** Case track scroll math. Pure, so it is unit-tested. */

/** Vertical run that drives a horizontal shift: (shift + 15 vh) ÷ 1.15, 15% faster than v3. */
export function trackRun(shift: number, viewportHeight: number): number {
  return (shift + 0.15 * viewportHeight) / 1.15;
}

/** 1-based panel the counter shows at progress `p` (0–1). */
export function panelAt(p: number, panels: number): number {
  return Math.min(panels, Math.max(1, Math.round(p * panels + 0.5)));
}
