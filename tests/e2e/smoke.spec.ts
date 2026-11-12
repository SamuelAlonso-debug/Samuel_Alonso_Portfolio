import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Case pages exist only with cases: CI has none, a fixtures build (CASES_DIR) has three.
const withCases = !!process.env['CASES_DIR'];
const pages = [
  { path: '/', lang: 'es-MX', switchTo: '/en/' },
  { path: '/en/', lang: 'en', switchTo: '/' },
  { path: '/como-esta-hecho/', lang: 'es-MX', switchTo: '/en/how-its-made/' },
  { path: '/en/how-its-made/', lang: 'en', switchTo: '/como-esta-hecho/' },
  { path: '/aviso-de-privacidad/', lang: 'es-MX', switchTo: '/en/privacy/' },
  { path: '/en/privacy/', lang: 'en', switchTo: '/aviso-de-privacidad/' },
  { path: '/contacto/', lang: 'es-MX', switchTo: '/en/contact/' },
  { path: '/en/contact/', lang: 'en', switchTo: '/contacto/' },
  ...(withCases
    ? ([
        { path: '/casos/sea/', lang: 'es-MX', switchTo: '/en/work/sea/' },
        { path: '/en/work/sea/', lang: 'en', switchTo: '/casos/sea/' },
      ] as const)
    : []),
];

test('case lists show every case in both locales', async ({ page }) => {
  test.skip(!withCases, 'needs CASES_DIR');
  for (const path of ['/casos/', '/en/work/']) {
    await page.goto(path);
    await expect(page.locator('main li h2 a')).toHaveCount(3);
  }
});

for (const { path, lang, switchTo } of pages) {
  test.describe(`page ${path}`, () => {
    test('declares lang, canonical and hreflang alternates', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test('shares an OG image per locale and Person JSON-LD', async ({ page, request }) => {
      await page.goto(path);
      const og = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(og).toMatch(lang === 'en' ? /\/og\/en\.png$/ : /\/og\/es\.png$/);
      expect((await request.get(new URL(og ?? '').pathname)).status()).toBe(200);
      const ld = await page.locator('script[type="application/ld+json"]').textContent();
      expect(JSON.parse(ld ?? '{}')['@graph'][0]['@type']).toBe('Person');
    });

    test('ships the Astro-generated CSP', async ({ page }) => {
      await page.goto(path);
      const csp = await page
        .locator('meta[http-equiv="content-security-policy"]')
        .getAttribute('content');
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('script-src');
    });

    test('browser reports no CSP violations', async ({ page }) => {
      const violations: string[] = [];
      page.on('console', (message) => {
        if (/Content.Security.Policy/i.test(message.text())) violations.push(message.text());
      });
      await page.goto(path);
      // Turnstile keeps polling on the contact page, so the idle wait is capped.
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      expect(violations).toEqual([]);
    });

    test('language switch leads to the equivalent page', async ({ page }) => {
      await page.goto(path);
      // ≤820 px the language link lives in the menu sheet.
      const menu = page.locator('[data-menu]');
      if (await menu.isVisible()) await menu.click();
      await page.locator('[data-lang-switch]:visible').click();
      await expect(page).toHaveURL(new RegExp(`${switchTo.replace(/\//g, '\\/')}$`));
    });

    for (const colorScheme of ['light', 'dark'] as const) {
      test(`no axe violations (WCAG 2.2 AA) in ${colorScheme} theme`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test('chosen theme persists across reload', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('[data-theme-toggle]');
  await toggle.click(); // system → light
  await toggle.click(); // light → dark
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('skip link focuses main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('unknown route returns 404 with the custom page', async ({ page }) => {
  const response = await page.goto('/no-existe/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('Página no encontrada');
});

// CI builds with the Turnstile test keys and a log-only email sink (.github/workflows/ci.yml).
test('contact form sends a valid message and shows the no-JS fallback', async ({
  page,
  browser,
}) => {
  test.skip(!process.env['CI'], 'needs the CI Turnstile test keys');
  await page.goto('/en/contact/');
  const form = page.locator('#contact-form');
  await form.getByLabel('Message').fill('Short');
  await form.getByRole('button', { name: 'Send message' }).click();
  await expect(form.getByRole('status')).toContainText('20 to 4000');

  await form.getByLabel('Name').fill('Ada Lovelace');
  await form.getByLabel('Email').fill('ada@example.com');
  await form.getByLabel('Message').fill('I would like a technical review of my app.');
  await expect(form.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('');
  await form.getByRole('button', { name: 'Send message' }).click();
  await expect(form.getByRole('status')).toHaveText('Message sent. I will reply soon.');

  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const plain = await noJs.newPage();
  await plain.goto('/contacto/');
  await expect(plain.locator('#contact-form')).toBeHidden();
  await expect(plain.getByRole('link', { name: 'samuelalonsodev@gmail.com' })).toBeVisible();
  await noJs.close();
});
