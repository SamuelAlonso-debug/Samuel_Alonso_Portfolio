import { expect, test } from '@playwright/test';

test('reduced motion: no pinning, statement fully lit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#statement > div')).toHaveCSS('position', 'relative');
  await expect(page.locator('#statement .w').last()).toHaveCSS('opacity', '1');
});
