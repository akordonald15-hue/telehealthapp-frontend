import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";

const load = createRequire(import.meta.url);
const { chromium, expect } = load('@playwright/test');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3101';
const output = process.env.QA_OUTPUT_DIR || 'artifacts/release-review';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
const empty = { count: 0, next: null, previous: null, results: [] };
const fakeUser = { id: 901, email: 'qa@example.test', phone: '', full_name: 'Release QA', role: 'patient', must_change_password: false };

async function mockApis(page, mode = 'signed-out') {
  // All backend requests are synthetic; this never uses production credentials/data.
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let status = 200;
    let json = empty;
    if (path.includes('/auth/login')) {
      if (mode === 'login-error') { status = 401; json = { detail: 'Invalid email or password.' }; }
      else json = { access: 'synthetic-release-qa', user: fakeUser };
    } else if (path.includes('/auth/me')) {
      if (mode === 'signed-out') { status = 401; json = { detail: 'Authentication required.' }; }
      else json = fakeUser;
    } else if (path.includes('/profiles/me')) {
      json = { id: 901, profile_complete: true, full_name: 'Release QA', gender: 'male', date_of_birth: '1990-01-01' };
    } else if (path.includes('/auth/')) {
      json = { detail: 'Synthetic QA response.' };
    }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });
  });
  await page.route('https://accounts.google.com/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
}

async function dismissInstall(page) {
  const dismiss = page.getByRole('button', { name: 'Not now', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
}

async function captureLoadedSection(page, section, path) {
  const images = section.locator('img');
  for (let index = 0; index < await images.count(); index++) {
    const img = images.nth(index);
    if (!await img.evaluate(el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))) continue;
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth > 0), { timeout: 30000 }).toBe(true);
  }
  await section.screenshot({ caret: 'initial', path });
}

try {
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    console.log(`Checking ${width}px`);
    const page = await browser.newPage({ viewport: { width, height: 1100 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await mockApis(page);
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({ timeout: 60000 });
    await dismissInstall(page);
    const overview = page.getByRole('region', { name: 'Caretekk service overview' });
    await expect(overview).toContainText('Connect with healthcare professionals.');
    await expect(overview).toContainText('Home visits in Akwa Ibom State, Nigeria');
    assert(!/1,?200\+|50\+|Lagos, Abuja, PH|Avg\. connect time|thousands/i.test(await page.locator('main').innerText()));
    await captureLoadedSection(page, overview, `${output}/after-service-overview-${width}.png`);
    assert(await overview.evaluate(el => el.scrollWidth <= el.clientWidth), 'Service overview overflows');
    const hero = page.locator('main section').first();
    await hero.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('[data-slide][aria-hidden="false"] [data-portrait] img')].every(img => img.complete && img.naturalWidth > 0), { timeout: 30000 });
    const height = (await hero.boundingBox()).height;
    await hero.screenshot({ caret: 'initial', path: `${output}/after-hero-consult-${width}.png` });
    const activePortraits = () => page.locator('[data-slide][aria-hidden="false"] [data-portrait]');
    const consult = await activePortraits().evaluateAll(elements => elements.map(el => {
      const rect = el.getBoundingClientRect();
      const img = el.querySelector('img');
      return { name: el.dataset.portrait, left: rect.left, right: rect.right, objectFit: getComputedStyle(img).objectFit, src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 };
    }));
    assert.equal(consult.length, 3);
    assert.ok(consult.every(p => p.loaded && p.objectFit === 'contain'));
    const sorted = [...consult].sort((a, b) => a.left - b.left);
    for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i].left > sorted[i - 1].right, 'Portraits must not overlap');
    const michael = consult.find(p => p.name === 'Dr. Michael Idam');
    assert.ok(decodeURIComponent(michael.src).includes('/img/Dr michael Idam.jpg'));
    await page.getByRole('button', { name: 'Show homecare highlight' }).click();
    await expect(page.getByRole('button', { name: 'Show homecare highlight' })).toHaveAttribute('aria-pressed', 'true');
    assert.equal((await hero.boundingBox()).height, height);
    await hero.screenshot({ caret: 'initial', path: `${output}/after-hero-homecare-${width}.png` });
    const homecare = await activePortraits().evaluateAll(elements => elements.map(el => {
      const rect = el.getBoundingClientRect();
      return { name: el.dataset.portrait, center: (rect.left + rect.right) / 2, src: el.querySelector('img').getAttribute('src') };
    }));
    assert.equal(homecare.length, 2);
    const okon = homecare.find(p => p.name === 'Dr. Effiong Okon');
    assert.ok(Math.abs(okon.center - width / 2) < 2);
    assert.ok(decodeURIComponent(okon.src).includes('/img/Dr effiong Okon.jpg'));
    const anchors = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.getElementById(h.slice(1))));
    assert.deepEqual(anchors, [], 'Navigation targets must exist');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('#faq').count(), 1);
    assert.equal(await page.locator('#contact').count(), 1);
    if (width < 1024) {
      const menu = page.getByRole('button', { name: 'Toggle navigation' });
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('#mobile-nav')).not.toHaveAttribute('inert', '');
      await page.keyboard.press('Escape');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(menu).toBeFocused();
      await expect(page.locator('#mobile-nav')).toHaveAttribute('inert', '');
    }
    const faq = page.locator('#faq');
    const faqButton = faq.getByRole('button').first();
    await faqButton.click();
    await expect(faqButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(`#${await faqButton.getAttribute('aria-controls')}`)).toBeVisible();
    await faqButton.click();
    await expect(faqButton).toHaveAttribute('aria-expanded', 'false');
    // Restore the initial expanded answer so comparison screenshots show the same state.
    await faq.getByRole('button').nth(3).click();
    await captureLoadedSection(page, faq, `${output}/after-faq-${width}.png`);
    const footer = page.locator('footer');
    await expect(footer.getByRole('textbox', { name: 'Email address' })).toBeDisabled();
    await expect(footer.getByRole('button', { name: 'Subscribe' })).toBeDisabled();
    await expect(footer.getByText(/Newsletter sign-up is not available yet/)).toBeVisible();
    await expect(footer.getByText(/you're on the list/i)).toHaveCount(0);
    const footerBounds = await footer.boundingBox();
    const wordmarkBounds = await footer.locator('img[src="/img/footer/wordmark.svg"]').boundingBox();
    assert.ok(wordmarkBounds.x >= footerBounds.x && wordmarkBounds.x + wordmarkBounds.width <= footerBounds.x + footerBounds.width, 'Footer wordmark must fit its container');
    await captureLoadedSection(page, footer, `${output}/after-newsletter-${width}.png`);
    for (const id of ['services', 'trust', 'doctors', 'home-care', 'how-it-works']) {
      if ([390, 768, 1440].includes(width)) await captureLoadedSection(page, page.locator(`#${id}`), `${output}/after-${id}-${width}.png`);
    }
    await page.getByRole('button', { name: 'Show consultation highlight' }).click();
    await captureLoadedSection(page, page.locator('main'), `${output}/after-landing-${width}.png`);
    let accessibility = null;
    if ([390, 1440].includes(width)) {
      await page.addScriptTag({ path: load.resolve('axe-core/axe.min.js') });
      accessibility = await page.evaluate(async () => {
        const result = await window.axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
        return {
          violations: result.violations.map(rule => ({ id: rule.id, impact: rule.impact, description: rule.description, nodes: rule.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })),
          incomplete: result.incomplete.map(rule => ({ id: rule.id, nodes: rule.nodes.map(node => node.target) })),
        };
      });
      fs.writeFileSync(`${output}/accessibility-${width}.json`, JSON.stringify(accessibility, null, 2));
    }
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.equal(documentWidth, width);
    assert.deepEqual(errors, []);
    results.push({ width, documentWidth, consoleErrors: errors, heroHeight: height, consult, homecare, navigation: 'passed', faq: 'passed', newsletter: 'disabled honestly', accessibility });
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await mockApis(page);
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await dismissInstall(page);
  await page.getByRole('link', { name: 'Talk to a Doctor', exact: true }).first().click();
  await expect(page).toHaveURL(/\/register/);
  await expect(page.getByRole('button', { name: 'Create account', exact: true })).toBeVisible();
  await page.goto(`${base}/appointments`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await dismissInstall(page);
  await page.getByRole('link', { name: 'Book Homecare', exact: true }).first().click();
  await expect(page).toHaveURL(/\/register/);
  await page.close();

  const authPage = await browser.newPage({ viewport: { width: 390, height: 1000 }, serviceWorkers: 'block' });
  await mockApis(authPage, 'signed-in');
  await authPage.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await authPage.getByPlaceholder('you@example.com').fill('qa@example.test');
  await authPage.getByPlaceholder('Enter your password').fill('Synthetic-QA-password-123!');
  await authPage.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(authPage).toHaveURL(/\/dashboard/, { timeout: 30000 });
  await expect(authPage.getByRole('link', { name: /refer & earn/i }).first()).toBeVisible({ timeout: 30000 });
  await authPage.getByRole('link', { name: /refer & earn/i }).first().click();
  await expect(authPage).toHaveURL(/\/refer/);
  await authPage.close();
  fs.writeFileSync(`${output}/browser-qa.json`, JSON.stringify({ viewports: results, journeys: ['doctor CTA to registration', 'homecare CTA to registration', 'signed-out appointment gate', 'mocked login to dashboard', 'patient referral navigation'], backend: 'mocked; no real API calls' }, null, 2));
} finally {
  await browser.close();
}
