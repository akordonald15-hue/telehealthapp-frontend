import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3101';
const output = 'artifacts/marketing-approval';
const coverage = 'Home visits are currently available in Akwa Ibom State, Nigeria.';
const browser = await chromium.launch();
const results = [];
async function dismissInstall(page) {
  const dismiss = page.getByRole('button', { name: 'Not now', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
}
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1100 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage();
    let signedIn = false;
    const user = { id: 901, email: 'qa@example.test', full_name: 'Marketing QA', role: 'patient', must_change_password: false };
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      let json = { count: 0, results: [], next: null, previous: null };
      let status = 200;
      if (path.includes('/auth/login')) { signedIn = true; json = { access: 'synthetic-marketing-qa', user }; }
      else if (path.includes('/auth/me')) { status = signedIn ? 200 : 401; json = signedIn ? user : { detail: 'Authentication required.' }; }
      else if (path.includes('/profiles/me')) json = { id: 901, profile_complete: true, full_name: user.full_name };
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });
    });
    await page.route('https://accounts.google.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await page.goto(`${base}/r/QA-CODE`);
    await expect(page.getByText(coverage, { exact: true })).toBeVisible();
    await dismissInstall(page);
    await page.screenshot({ path: `${output}/after-referral-${width}.png`, fullPage: true });
    await page.goto(`${base}/login`);
    await page.getByPlaceholder('you@example.com').fill('qa@example.test');
    await page.getByPlaceholder('Enter your password').fill('Synthetic-QA-password-123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    for (const [name, path] of [['homecare-booking', '/home-care/book'], ['homecare-requests', '/home-care/requests'], ['homecare-detail', '/home-care/requests/901']]) {
      await page.goto(`${base}${path}`);
      await expect(page.getByText(coverage, { exact: true })).toBeVisible({ timeout: 30000 });
      await dismissInstall(page);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await page.screenshot({ path: `${output}/after-${name}-${width}.png`, fullPage: true });
      results.push({ width, path, coverage: 'visible', overflow: false });
    }
    await context.close();
  }
  fs.writeFileSync(`${output}/coverage-browser-qa.json`, JSON.stringify({ results, backend: 'Synthetic responses only; no real API records or booking.' }, null, 2));
} finally { await browser.close(); }
