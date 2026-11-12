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

test('how I work: petrol field, rows enter once in view', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('#how .row');
  await expect(rows).toHaveCount(3);
  await page.locator('#how h2').evaluate((h) => h.scrollIntoView({ block: 'center' }));
  await expect(page.locator('html')).toHaveAttribute('data-tone', 'petrol');
  for (const row of await rows.all()) {
    await row.scrollIntoViewIfNeeded();
    await expect(row).toHaveCSS('opacity', '1');
  }
});

test('header links reach their scene; the menu sheet closes on navigation', async ({ page }) => {
  await page.goto('/');
  const menu = page.locator('[data-menu]');
  if (await menu.isVisible()) {
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('main')).toHaveJSProperty('inert', true);
    await page.locator('#site-menu').getByRole('link', { name: 'Cómo trabajo' }).click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('main')).toHaveJSProperty('inert', false);
  } else {
    await page.locator('header').getByRole('link', { name: 'Cómo trabajo' }).click();
    await expect(page.locator('header a[href="#how"]')).toHaveAttribute('aria-current', 'location');
  }
  await expect(page).toHaveURL(/#how$/);
});

test('no empty case track: the scene exists only with cases', async ({ page }) => {
  await page.goto('/');
  const scene = await page.locator('#cases').count();
  const panels = await page.locator('#cases .panel').count();
  expect(scene === 0 || panels > 0, `scene ${scene}, panels ${panels}`).toBe(true);
  await expect(page.locator('header a[href="#cases"]')).toHaveCount(scene);
});

test('no empty testimonials scene; one quote at a time while pinned', async ({ page }) => {
  await page.goto('/');
  const scene = page.locator('#testimonials');
  const quotes = scene.locator('.quote');
  const n = await quotes.count();
  await expect(scene).toHaveCount(n > 0 ? 1 : 0);
  if (n < 2) return;
  await scene.evaluate((s) => scrollTo(0, scrollY + s.getBoundingClientRect().top));
  await expect(scene).toHaveClass(/pinned/);
  await expect(page.locator('html')).toHaveAttribute('data-tone', 'paper');
  await expect(quotes.first()).toHaveCSS('opacity', '1');
  await expect(quotes.nth(1)).toHaveCSS('opacity', '0');
  // A focused author link brings its quote on screen.
  const linked = quotes.filter({ has: page.getByRole('link') }).last();
  if ((await linked.count()) === 0) return;
  await linked.getByRole('link').focus();
  await expect(linked).toHaveCSS('opacity', '1');
});

test('contact only with a booking link; one amber action per view', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  const booking = (await contact.count()) > 0;
  // Nav link, nav CTA, menu sheet link and hero CTA.
  await expect(page.locator('a[href="#contact"]')).toHaveCount(booking ? 4 : 0);
  if (!booking) return;
  await expect(contact.locator('.orb')).toHaveAttribute('href', /^https:\/\//);
  await expect(contact.locator('.clock')).toHaveText(/Querétaro son las \d\d:\d\d/);
  await expect(contact.locator('#contact-form')).toBeVisible();
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-primary-visible', '');
  const place = (id: string, at: number) =>
    page
      .locator(`#${id}`)
      .evaluate(
        (s, at) => scrollTo(0, scrollY + s.getBoundingClientRect().top - innerHeight * at),
        at,
      );
  await place('about', 0);
  await expect(body).not.toHaveAttribute('data-primary-visible');
  // The curve flattens as the ink field rises; the field takes the page tone only at the top.
  await place('contact', 0.45);
  await expect(contact.locator('.curve')).toHaveCSS('transform', /^matrix\(1, 0, 0, 0\.(49|5)/);
  await expect(page.locator('html')).not.toHaveAttribute('data-tone', 'ink');
  await place('contact', 0);
  await expect(page.locator('html')).toHaveAttribute('data-tone', 'ink');
  await expect(body).toHaveAttribute('data-primary-visible', '');
  await expect(page.locator('[data-section-link][href="#contact"]')).toHaveAttribute(
    'aria-current',
    'location',
  );
});

test('reduced motion: no pinning, statement fully lit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#how .row').last()).toHaveCSS('opacity', '1');
  await expect(page.locator('#hero > div').first()).toHaveCSS('position', 'relative');
  await expect(page.locator('#statement .w').last()).toHaveCSS('opacity', '1');
  for (const quote of await page.locator('#testimonials .quote').all()) {
    await expect(quote).toHaveCSS('opacity', '1');
  }
  for (const curve of await page.locator('#contact .curve').all()) await expect(curve).toBeHidden();
});
