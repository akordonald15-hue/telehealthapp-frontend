import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3101';
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1100 }, serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('**/api/**', r => r.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"Synthetic QA only"}' }));
    await page.route('https://accounts.google.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await page.addInitScript(() => {
      window.releaseLayoutShifts = [];
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.releaseLayoutShifts.push(entry.value);
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await page.waitForTimeout(1800);
    const first = page.getByRole('button', { name: 'Show consultation highlight' });
    const second = page.getByRole('button', { name: 'Show homecare highlight' });
    const hero = page.locator('main section').first();
    const initialHeight = (await hero.boundingBox()).height;
    await second.click();
    await page.waitForTimeout(1400);
    await expect(second).toHaveAttribute('aria-pressed', 'true');
    assert.equal((await hero.boundingBox()).height, initialHeight);
    const opacity = await page.locator('[data-slide="1"][aria-hidden="false"] [data-motion="image"]').evaluate(el => getComputedStyle(el).opacity);
    assert.equal(opacity, '1');
    await first.click();
    await page.waitForTimeout(1400);
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.locator('h1').click();
    await page.waitForTimeout(9400);
    await expect(second).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.locator('h1').click();
    await page.waitForTimeout(9400);
    await expect(second).toHaveAttribute('aria-pressed', 'true');
    assert.equal((await hero.boundingBox()).height, initialHeight);
    if (width === 390) {
      const menu = page.getByRole('button', { name: 'Toggle navigation' });
      await menu.click();
      await page.waitForTimeout(600);
      await expect(page.locator('#mobile-nav')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      await expect(menu).toBeFocused();
      await expect(page.locator('#mobile-nav')).toBeHidden();
    }
    const contrastRegions = await page.evaluate(() => {
      const heroSection = document.querySelector('main section');
      const section = heroSection.getBoundingClientRect();
      const footer = document.querySelector('footer').getBoundingClientRect();
      const heroTexts = [...heroSection.querySelectorAll('p, a, button')].filter(el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
      const footerTexts = [...document.querySelectorAll('footer p, footer h2, footer h3, footer li a')];
      return {
        heroMaxTextBottom: Math.max(...heroTexts.map(el => (el.getBoundingClientRect().bottom - section.top) / section.height)),
        footerMaxTextBottom: Math.max(...footerTexts.map(el => (el.getBoundingClientRect().bottom - footer.top) / footer.height)),
      };
    });
    // Text must stay in the stronger portion of the existing blue gradients.
    console.log(width, contrastRegions);
    assert.ok(contrastRegions.heroMaxTextBottom <= 0.8);
    assert.ok(contrastRegions.footerMaxTextBottom <= 0.85);
    const layoutShift = await page.evaluate(() => window.releaseLayoutShifts.reduce((sum, value) => sum + value, 0));
    assert.deepEqual(errors, []);
    results.push({ width, manualTransition: 'passed', automaticRotation: 'passed', pause: 'passed', menuAnimation: width === 390 ? 'passed' : 'desktop navigation', stableHeroHeight: initialHeight, observedLayoutShift: layoutShift, contrastRegions, errors });
    await page.close();
  }
  fs.writeFileSync(`${process.env.QA_OUTPUT_DIR || 'artifacts/release-review'}/motion-qa.json`, JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
