import puppeteer from 'puppeteer';
import { setTimeout } from 'timers/promises';

(async () => {
  console.log("Launching Microsoft Edge...");
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-gpu-blocklist',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=gl',
      '--disable-web-security'
    ]
  });

  const page = await browser.newPage();
  console.log("Navigating to http://localhost:3000...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  console.log("Waiting for 3D Scene to initialize...");
  await setTimeout(8000); // Give plenty of time for 3D to render

  // Ensure Toolbar is Expanded
  await page.evaluate(() => {
    const expandBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Expand Options Menu');
    if (expandBtn) expandBtn.click();
  });
  await setTimeout(1000);

  // 1. Hero Screenshot (Default view)
  console.log("Taking Hero screenshot...");
  await page.screenshot({ path: 'docs/screenshots/hero.jpg', type: 'jpeg', quality: 90 });

  // 2. Chat Screenshot & Tutorial
  console.log("Typing /help to trigger tutorial...");
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Talk to Ava"]');
    if (input) {
      // Type /help
      input.value = '/help';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Press Enter
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
      input.dispatchEvent(keyEvent);
    }
  });
  await setTimeout(1500); // Wait for chat history to update

  // Open Chat History panel fully
  await page.evaluate(() => {
    const historyBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Chat History');
    if (historyBtn) historyBtn.click();
  });
  await setTimeout(2000); // Wait for history drawer transition

  console.log("Taking Chat & Tutorial screenshot...");
  await page.screenshot({ path: 'docs/screenshots/chat.jpg', type: 'jpeg', quality: 90 });

  // Close history
  await page.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Close History Panel');
    if (closeBtn) closeBtn.click();
  });
  await setTimeout(1000);

  // 3. Library Screenshot
  console.log("Opening Library Panel...");
  await page.evaluate(() => {
    const libBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Pose & Animation Library');
    if (libBtn) libBtn.click();
  });
  await setTimeout(2000);
  console.log("Taking Library screenshot...");
  await page.screenshot({ path: 'docs/screenshots/library.jpg', type: 'jpeg', quality: 90 });
  
  // Close Library
  await page.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Close Library Panel');
    if (closeBtn) closeBtn.click();
  });
  await setTimeout(1000);

  // 4. Settings Screenshot
  console.log("Opening Settings Panel...");
  await page.evaluate(() => {
    const settingsBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Scene & Lighting Settings');
    if (settingsBtn) settingsBtn.click();
  });
  await setTimeout(2000);
  console.log("Taking Settings screenshot...");
  await page.screenshot({ path: 'docs/screenshots/settings.jpg', type: 'jpeg', quality: 90 });

  console.log("Screenshots captured successfully!");
  await browser.close();
})();
