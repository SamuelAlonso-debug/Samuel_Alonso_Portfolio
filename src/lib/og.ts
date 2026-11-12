/**
 * Open Graph images (1200×630), one per locale, written after the build.
 * Text becomes vector paths from the site's own font, so the PNG never depends on system fonts.
 */
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { create, type Font } from 'fontkitten';
import sharp from 'sharp';

const lines = {
  es: 'Ingeniero de software en Querétaro, México',
  en: 'Software engineer in Querétaro, Mexico',
};

/** SVG path data for `text`, baseline at (x, y), `scale` px per font unit. No kerning; fine for a title. */
function textPath(font: Font, text: string, x: number, y: number, scale: number): string {
  let pen = x;
  let d = '';
  for (const glyph of font.glyphsForString(text)) {
    d += glyph.path.scale(scale, -scale).translate(pen, y).toSVG();
    pen += glyph.advanceWidth * scale;
  }
  return d;
}

/** The Schibsted Grotesk latin file among the built fonts. */
function findFont(fontsDir: string): Font {
  for (const name of readdirSync(fontsDir).filter((f) => f.endsWith('.woff2'))) {
    const font = create(readFileSync(join(fontsDir, name)));
    if (
      'familyName' in font &&
      font.familyName === 'Schibsted Grotesk' &&
      font.hasGlyphForCodePoint(0x51)
    ) {
      return font;
    }
  }
  throw new Error(`Schibsted Grotesk not found in ${fontsDir}.`);
}

export function ogImages(): AstroIntegration {
  return {
    name: 'og-images',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(dir);
        const font = findFont(join(root, '_astro', 'fonts'));
        const em = font.unitsPerEm;
        mkdirSync(join(root, 'og'), { recursive: true });
        for (const [locale, line] of Object.entries(lines)) {
          // --ink-field, --ink-field-fg, --ink-field-muted and --action in sRGB (librsvg has no oklch).
          // Title weight comes from a stroke: fontkitten cannot instance the variable font.
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
            <rect width="1200" height="630" fill="#0e1418"/>
            <rect x="96" y="200" width="96" height="10" rx="5" fill="#f5b84a"/>
            <path fill="#eef1f3" stroke="#eef1f3" stroke-width="5" stroke-linejoin="round" d="${textPath(font, 'Samuel Alonso', 90, 360, 132 / em)}"/>
            <path fill="#a4abb1" d="${textPath(font, line, 96, 450, 44 / em)}"/>
          </svg>`;
          await sharp(Buffer.from(svg))
            .png()
            .toFile(join(root, 'og', `${locale}.png`));
        }
      },
    },
  };
}
