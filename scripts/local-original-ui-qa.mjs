import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:3108';
const output = 'artifacts/country-feature-removal';
const mailbox = 'artifacts/integration-final-fixes/mailbox';
const files = fs.readdirSync(mailbox).sort((a, b) => fs.statSync(`${mailbox}/${b}`).mtimeMs - fs.statSync(`${mailbox}/${a}`).mtimeMs);
const email = files.map(f => fs.readFileSync(`${mailbox}/${f}`, 'utf8').match(/qa-patient-\d+@caretekk\.invalid/)?.[0]).find(Boolean);
assert(email);
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await page.goto(`${base}/login`);
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill('Local-QA-Only-2026!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    const started = page.waitForResponse(r => r.url().endsWith('/api/triage/start') && r.request().method() === 'POST');
    await page.goto(`${base}/appointments`);
    const response = await started;
    assert.equal(response.status(), 201);
    assert.equal(response.request().postData(), null);
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    const dismiss = page.getByRole('button', { name: 'Not now', exact: true });
    if (await dismiss.isVisible()) await dismiss.click();
    await page.screenshot({ path: `${output}/real-original-appointments-${width}.png`, fullPage: true });
    await page.goto(`${base}/home-care/book`);
    await expect(page.getByText('Home visits are currently available in Akwa Ibom State, Nigeria.', { exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    if (await dismiss.isVisible()) await dismiss.click();
    await page.screenshot({ path: `${output}/real-original-homecare-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    results.push({ width, login: 'real backend', careCheck: '201 with bodyless original request, no extra checkbox', homecare: 'Akwa Ibom notice preserved', overflow: false });
    await page.close();
  }
  fs.writeFileSync(`${output}/real-original-ui.json`, JSON.stringify(results, null, 2));
} finally { await browser.close(); }
