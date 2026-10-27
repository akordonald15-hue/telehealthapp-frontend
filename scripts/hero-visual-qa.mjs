import { createRequire } from 'node:module';
const load = createRequire(import.meta.url);
const { chromium } = load('@playwright/test');
import fs from 'node:fs';
import assert from 'node:assert/strict';
const phase = process.argv[2] || 'after';
const base = process.env.QA_BASE_URL || 'http://localhost:3100';
fs.mkdirSync('artifacts/hero-review', { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1100 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(base, { waitUntil: 'networkidle', timeout: 180000 });
    await page.waitForTimeout(1500);
    if (await page.getByRole('button', { name: 'Not now', exact: true }).isVisible()) await page.getByRole('button', { name: 'Not now', exact: true }).click();
    await page.locator('main section').first().screenshot({ path: `artifacts/hero-review/${phase}-${width}-consult.png` });
    if (phase === 'before') {
      await page.waitForTimeout(8000);
    } else {
      await page.getByRole('button', { name: 'Show homecare highlight' }).click();
      await page.waitForTimeout(1400);
    }
    await page.locator('main section').first().screenshot({ path: `artifacts/hero-review/${phase}-${width}-homecare.png` });
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      missingAnchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.querySelector(h)),
      heroImages: [...document.querySelectorAll('[data-slide][aria-hidden="false"] [data-hero-image]')].map(el => { const b = el.getBoundingClientRect(); return { src: el.querySelector('img').getAttribute('src'), x: b.x, right: b.right, width: b.width }; }),
    }));
    assert.equal(layout.documentWidth, width, `Horizontal overflow at ${width}px`);
    assert.deepEqual(errors, [], `Browser errors at ${width}px`);
    if (phase === 'after') {
      assert.equal(layout.heroImages.length, 1, 'Each slide shows one group photo');
      const [image] = layout.heroImages;
      assert.ok(Math.abs((image.x + image.right) / 2 - width / 2) < 2, 'Group photo must be centered');
      if (width < 1024) {
        const menu = page.getByRole('button', { name: 'Toggle navigation' });
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        await page.waitForTimeout(500);
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      }
    }
    results.push({ width, errors, ...layout });
    await page.close();
  }
  if (phase === 'after') {
    const page = await browser.newPage({ viewport: { width: 390, height: 1000 }, reducedMotion: 'reduce' });
    await page.goto(base, { waitUntil: 'networkidle', timeout: 180000 });
    const hero = page.locator('main section').first();
    const initialHeight = (await hero.boundingBox()).height;
    await page.getByRole('button', { name: 'Show homecare highlight' }).click();
    assert.equal(await page.getByRole('button', { name: 'Show homecare highlight' }).getAttribute('aria-pressed'), 'true');
    assert.equal((await hero.boundingBox()).height, initialHeight, 'Slide switching must reserve stable height');
    await page.getByRole('button', { name: 'Show consultation highlight' }).click();
    assert.equal(await page.getByRole('button', { name: 'Show consultation highlight' }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Show homecare highlight' }).press('Enter');
    assert.equal(await page.getByRole('button', { name: 'Show homecare highlight' }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Show consultation highlight' }).press('Enter');
    assert.equal(await page.getByRole('button', { name: 'Show consultation highlight' }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByRole('link', { name: 'Talk to a Doctor', exact: true }).first().getAttribute('href'), '/register');
    assert.equal(await page.getByRole('link', { name: 'Book Homecare', exact: true }).first().getAttribute('href'), '/register');
    await page.close();
  }
  fs.writeFileSync(`artifacts/hero-review/${phase}-qa.json`, JSON.stringify(results, null, 2));
  await browser.close();
})();


