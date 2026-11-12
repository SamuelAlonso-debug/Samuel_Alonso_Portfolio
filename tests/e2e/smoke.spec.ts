import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { path: '/', lang: 'es-MX', switchTo: '/en/' },
  { path: '/en/', lang: 'en', switchTo: '/' },
] as const;

for (const { path, lang, switchTo } of pages) {
  test.describe(`page ${path}`, () => {
    test('declares lang, canonical and hreflang alternates', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
      await expect(page.locator('h1')).toHaveCount(1);
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
      await page.waitForLoadState('networkidle');
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
