import { expect, test } from '@playwright/test';

/** True when the visible hero copy intersects a visible product screen. */
function copyUnderScreen(): boolean {
  const copy = document.getElementById('hero-copy');
  const wall = document.getElementById('hero-wall');
  if (!copy || !wall) throw new Error('hero markup missing');
  const visible = (el: Element) =>
    getComputedStyle(el).visibility !== 'hidden' && Number(getComputedStyle(el).opacity) > 0.05;
  if (!visible(copy) || !visible(wall)) return false;
  const c = copy.getBoundingClientRect();
  return [...wall.children].some((screen) => {
    const r = screen.getBoundingClientRect();
    return (
      r.width > 0 && r.left < c.right && c.left < r.right && r.top < c.bottom && c.top < r.bottom
    );
  });
}

for (const width of [320, 390, 1280, 1920]) {
  test(`hero copy never sits under a screen at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
    await page.goto('/');
    for (const at of [0, 0.25, 0.5, 0.75, 1]) {
      await page.evaluate((f) => {
        const hero = document.getElementById('hero');
        if (hero) scrollTo(0, (hero.offsetHeight - innerHeight) * f);
      }, at);
      await page.waitForTimeout(800);
      expect(await page.evaluate(copyUnderScreen), `progress ${at}`).toBe(false);
    }
  });
}

test('about dial shows Querétaro time and when work resumes', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-14T18:30:00Z')); // Saturday 12:30 in Querétaro
  await page.goto('/');
  const dial = page.locator('#dial');
  await expect(dial.locator('.now')).toHaveText('12:30');
  await expect(dial.locator('.status')).toHaveText('Fuera de horario. Vuelvo el lunes a las 9:00.');
  await expect(dial.locator('.status')).not.toHaveAttribute('data-on');
});

test('reduced motion: no pinning, statement fully lit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#hero > div').first()).toHaveCSS('position', 'relative');
  await expect(page.locator('#statement .w').last()).toHaveCSS('opacity', '1');
});
