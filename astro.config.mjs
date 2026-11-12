// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { ogImages } from './src/lib/og.ts';

// SITE_URL comes from the build environment (Workers Builds / CI). The default is for local dev only.
const site = process.env.SITE_URL ?? 'http://localhost:4321';

// Build data shown in the footer: which version the visitor is seeing.
const buildSha = (process.env.WORKERS_CI_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local').slice(
  0,
  7,
);
const buildDate = new Date().toISOString().slice(0, 10);

export default defineConfig({
  site,
  output: 'static', // everything is prerendered; only Actions run in the Worker

  // Images optimized at build time with sharp (no runtime Cloudflare Images).
  adapter: cloudflare({ imageService: 'compile' }),
  // No sessions: avoids provisioning an unused KV namespace.
  session: false,

  // Booking link behind "Book a call". Unset: no contact scene, no call buttons, no nav link.
  env: {
    schema: {
      PUBLIC_BOOKING_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        url: true,
        startsWith: 'https://',
      }),
      // Cloudflare Web Analytics token (public). Set only for production builds: the beacon's
      // endpoint rejects other origins, so local and CI builds ship without it.
      PUBLIC_CF_BEACON_TOKEN: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        length: 32,
      }),
    },
  },

  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false }, // ES at root, EN under /en/
  },

  integrations: [
    mdx(),
    ogImages(),
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-MX', en: 'en' } },
    }),
  ],

  // Shiki uses inline styles that Astro's CSP blocks; Prism uses classes.
  markdown: { syntaxHighlight: 'prism' },

  // Self-hosted fonts (no third-party requests) with metric fallbacks to avoid CLS.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Schibsted Grotesk',
      cssVariable: '--font-schibsted',
      weights: ['400 900'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
      weights: ['400', '500'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],

  security: {
    checkOrigin: true, // CSRF check on on-demand requests
    actionBodySizeLimit: 16 * 1024, // the contact form never needs more than 16 KB
    csp: {
      // Astro adds per-page script-src/style-src hashes. This covers the rest.
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://cloudflareinsights.com",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://static.cloudflareinsights.com'],
      },
    },
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      __BUILD_SHA__: JSON.stringify(buildSha),
      __BUILD_DATE__: JSON.stringify(buildDate),
    },
  },
});
