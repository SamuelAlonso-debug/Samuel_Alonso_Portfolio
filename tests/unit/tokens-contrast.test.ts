import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

type Tokens = Record<string, string>;

function block(selector: string): Tokens {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`missing block ${selector}`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]));
}

/** WCAG relative luminance of an `oklch(L% C h)` value, clipped to sRGB. */
function luminance(value: string): number {
  const m = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)$/.exec(value);
  if (!m) throw new Error(`not oklch: ${value}`);
  const [L, C, h] = [Number(m[1]) / 100, Number(m[2]), (Number(m[3]) * Math.PI) / 180];
  const [a, b] = [C * Math.cos(h), C * Math.sin(h)];
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clip = (c: number) => Math.min(1, Math.max(0, c));
  const r = clip(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s);
  const g = clip(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s);
  const bl = clip(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

function contrast(tokens: Tokens, fg: string, bg: string): number {
  const value = (name: string) => {
    const v = tokens[name];
    if (!v) throw new Error(`missing token --${name}`);
    return luminance(v);
  };
  const [x, y] = [value(fg), value(bg)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const TEXT = 4.5;
const GRAPHIC = 3;

const light = block(':root');
const dark = { ...light, ...block(":root[data-theme='dark']") };
/** Tone blocks point at field tokens: resolve `var(--x)` against the light block. */
const tone = (name: string): Tokens =>
  Object.fromEntries(
    Object.entries({ ...light, ...block(`:root[data-tone='${name}']`) }).map(([k, v]) => [
      k,
      v.replace(/^var\(--([\w-]+)\)$/, (_, ref: string) => light[ref] ?? v),
    ]),
  );

// [foreground, background, minimum ratio]
const themed: [string, string, number][] = [
  ['ink', 'paper', TEXT],
  ['muted', 'paper', TEXT],
  ['accent', 'paper', TEXT],
  ['ink', 'surface', TEXT],
  ['muted', 'surface', TEXT],
  ['accent-ink', 'accent', TEXT],
  ['status-ok', 'paper', GRAPHIC],
  ['status-warn', 'paper', GRAPHIC],
  ['status-critical', 'paper', GRAPHIC],
  ['status-ok', 'surface', GRAPHIC],
  ['status-warn', 'surface', GRAPHIC],
  ['status-critical', 'surface', GRAPHIC],
];

const fields: [string, string, number][] = [
  ['ink-field-fg', 'ink-field', TEXT],
  ['ink-field-muted', 'ink-field', TEXT],
  ['ink-field-hours', 'ink-field', GRAPHIC],
  ['petrol-field-fg', 'petrol-field', TEXT],
  ['petrol-field-muted', 'petrol-field', TEXT],
  ['action-ink', 'action', TEXT],
  ['action-ink', 'action-hover', TEXT],
  ['action', 'ink-field', TEXT],
  ['action', 'petrol-field', TEXT],
];

describe('token contrast (WCAG 2.2 AA)', () => {
  for (const [name, tokens] of [
    ['light', light],
    ['dark', dark],
    ['ink tone', tone('ink')],
    ['petrol tone', tone('petrol')],
  ] as const) {
    it.each(themed)(`${name}: %s on %s ≥ %d:1`, (fg, bg, min) => {
      expect(contrast(tokens, fg, bg)).toBeGreaterThanOrEqual(min);
    });
  }

  it.each(fields)('field: %s on %s ≥ %d:1', (fg, bg, min) => {
    expect(contrast(light, fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it('ink tone: the hours arc reads on the dial surface (≥3:1)', () => {
    expect(contrast(tone('ink'), 'ink-field-hours', 'surface')).toBeGreaterThanOrEqual(GRAPHIC);
  });

  it('dark values match between the media query and the manual toggle', () => {
    expect(block(":root:not([data-theme='light'])")).toEqual(block(":root[data-theme='dark']"));
  });
});
