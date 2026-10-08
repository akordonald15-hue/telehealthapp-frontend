import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:3108';
const output = 'artifacts/integration-final-fixes';
const files = fs.readdirSync(`${output}/mailbox`).sort((a, b) => fs.statSync(`${output}/mailbox/${b}`).mtimeMs - fs.statSync(`${output}/mailbox/${a}`).mtimeMs);
const email = files.map(f => fs.readFileSync(`${output}/mailbox/${f}`, 'utf8').match(/qa-patient-\d+@caretekk\.invalid/)?.[0]).find(Boolean);
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
    const dismiss = page.getByRole('button', { name: 'Not now', exact: true });
    if (await dismiss.isVisible()) await dismiss.click();
    await page.goto(`${base}/appointments`);
    const location = page.getByRole('checkbox', { name: 'I confirm that I am currently in Nigeria.' });
    await expect(location).not.toBeChecked();
    const started = page.waitForResponse(r => r.url().endsWith('/api/triage/start') && r.request().method() === 'POST');
    await location.check();
    const response = await started;
    assert.equal(response.status(), 201);
    assert.equal(response.request().postDataJSON().consultation_country, 'NG');
    if (await dismiss.isVisible()) await dismiss.click();
    await page.screenshot({ path: `${output}/real-location-appointments-${width}.png`, fullPage: true });
    await page.evaluate(() => window.localStorage.clear()); // Only this disposable browser's QA drafts.
    await page.goto(`${base}/triage`);
    await expect(page).toHaveURL(/\/appointments/); // Existing consolidated care-check journey.
    await expect(page.getByRole('checkbox', { name: 'I confirm that I am currently in Nigeria.' })).not.toBeChecked();
    await page.goto(`${base}/home-care/book`);
    await expect(page.getByRole('checkbox', { name: 'I confirm that I am currently in Nigeria.' })).not.toBeChecked();
    await expect(page.getByText('Home visits are currently available in Akwa Ibom State, Nigeria.', { exact: true }).first()).toBeVisible();
    if (await dismiss.isVisible()) await dismiss.click();
    await page.screenshot({ path: `${output}/real-location-homecare-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    results.push({ width, login: 'real backend', checkbox: 'not preselected', declaration: 'NG sent by real UI', triage: 'existing redirect to gated appointments', homecare: 'Akwa Ibom visible', overflow: false });
    await page.close();
  }
  fs.writeFileSync(`${output}/real-clinical-ui.json`, JSON.stringify(results, null, 2));
} finally { await browser.close(); }
