// Playwright smoke test: plays levels through the real UI using the stored solutions.
// Run: npm run e2e   (first time: npm install && npx playwright install chromium)
const { chromium } = require('playwright');
const levels = require('./levels.json');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROME && { executablePath: process.env.CHROME }),
    ...(process.env.PW_CHANNEL && { channel: process.env.PW_CHANNEL }),
    headless: process.env.HEADED !== '1',
    slowMo: process.env.HEADED === '1' ? 150 : 0,
  });
  const page = await browser.newPage({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('file://' + path.join(__dirname, 'dist/index.html'));
  await page.screenshot({ path: 'shot-start.png' });

  for (const n of [1, 6, 11]) {
    await page.evaluate((n) => loadLevel(n), n);
    const lv = levels[n - 1];
    for (let i = 0; i < lv.solution.length; i++) {
      const [a, b] = lv.solution[i];
      await page.locator(`.tube[data-i="${a}"]`).dispatchEvent('pointerdown');
      await page.locator(`.tube[data-i="${b}"]`).dispatchEvent('pointerdown');
      await page.waitForFunction(() => !busy);
      if (n === 11 && i === 2) await page.screenshot({ path: 'shot-locked.png' });
    }
    await page.waitForSelector('#winOv.show', { timeout: 3000 });
    console.log(`Level ${n}: won in ${lv.solution.length} moves ✔`);
    if (n === 6) await page.screenshot({ path: 'shot-win.png' });
    await page.click('#nextBtn');
  }
  // flip mid-animation capture
  await page.evaluate(() => loadLevel(7));
  const sol = levels[6].solution;
  for (let i = 0; i < 6; i++) {
    const [a, b] = sol[i];
    await page.locator(`.tube[data-i="${a}"]`).dispatchEvent('pointerdown');
    await page.locator(`.tube[data-i="${b}"]`).dispatchEvent('pointerdown');
    if (i === 5) { await page.waitForTimeout(700); await page.screenshot({ path: 'shot-flip.png' }); }
    await page.waitForFunction(() => !busy);
  }
  await page.screenshot({ path: 'shot-after-flip.png' });
  await browser.close();
  if (errors.length) { console.error('Console errors:', errors); process.exit(1); }
  console.log('No console errors ✔');
})();
