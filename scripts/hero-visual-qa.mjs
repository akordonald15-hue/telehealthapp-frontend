import { createRequire } from 'node:module';
const load = createRequire(import.meta.url);
const { chromium } = load('../../telehealthapp-frontend/node_modules/@playwright/test');
import fs from 'node:fs';
import assert from 'node:assert/strict';
const phase = process.argv[2] || 'after';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1100 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 180000 });
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
      portraits: [...document.querySelectorAll('[data-slide][aria-hidden="false"] [data-portrait]')].map(el => { const b = el.getBoundingClientRect(); return { name: el.getAttribute('data-portrait'), x: b.x, right: b.right, width: b.width }; }),
    }));
    assert.equal(layout.documentWidth, width, `Horizontal overflow at ${width}px`);
    assert.deepEqual(errors, [], `Browser errors at ${width}px`);
    if (phase === 'after') {
      const okon = layout.portraits.find(p => p.name === 'Dr. Effiong Okon');
      assert.ok(okon && Math.abs((okon.x + okon.right) / 2 - width / 2) < 2, 'Dr. Okon must be centered');
      assert.equal(layout.portraits.length, 2, 'Removed middle doctor must not appear');
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
    await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 180000 });
    const hero = page.locator('main section').first();
    const initialHeight = (await hero.boundingBox()).height;
    await page.getByRole('button', { name: 'Show homecare highlight' }).click();
    assert.equal(await page.getByRole('button', { name: 'Show homecare highlight' }).getAttribute('aria-pressed'), 'true');
    assert.equal((await hero.boundingBox()).height, initialHeight, 'Slide switching must reserve stable height');
    await page.getByRole('button', { name: 'Show consultation highlight' }).click();
    assert.equal(await page.getByRole('button', { name: 'Show consultation highlight' }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByRole('link', { name: 'Talk to a Doctor', exact: true }).first().getAttribute('href'), '/register');
    assert.equal(await page.getByRole('link', { name: 'Book Homecare', exact: true }).first().getAttribute('href'), '/register');
    await page.close();
  }
  fs.writeFileSync(`artifacts/hero-review/${phase}-qa.json`, JSON.stringify(results, null, 2));
  await browser.close();
})();


