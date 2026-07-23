import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to 1080p
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log("Navigating to app...");
  await page.goto('http://localhost:3001/AI-GIRL-FRIEND/', { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait for 3D models to load
  console.log("Waiting for WebGL to render...");
  await new Promise(r => setTimeout(r, 6000));
  
  // Take main screenshot
  console.log("Capturing main_view.png");
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'main_view.png') });
  
  // Open the profile card
  console.log("Opening profile card...");
  await page.evaluate(() => {
    const profileBtn = document.querySelector('div.w-10.h-10.cursor-pointer');
    if (profileBtn) profileBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  
  console.log("Capturing profile_view.png");
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'profile_view.png') });
  
  // Expand toolbar
  console.log("Expanding toolbar...");
  await page.evaluate(() => {
    // find menu button by title
    const menuBtn = document.querySelector('button[title="Expand Options Menu"]');
    if (menuBtn) menuBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Capturing toolbar_expanded.png");
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'toolbar_expanded.png') });
  
  await browser.close();
  console.log("Screenshots captured successfully!");
}

run().catch(console.error);
