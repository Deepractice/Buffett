import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Capture Browser Logs (Critical for debugging React errors)
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });

    // 2. Wait for the Login Form to appear
    console.log('Waiting for login form...');
    try {
      await page.waitForSelector('input[type="password"]', { timeout: 5000 });
      console.log('✓ Login form detected');
    } catch (e) {
      console.log('⚠️ Login form NOT found. Taking screenshot of error state...');
    }

    // 3. Take screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `preview-${timestamp}.png`;
    
    // Ensure screenshots directory exists
    const fs = await import('fs');
    const screenshotDir = path.resolve(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir);
    }

    const filepath = path.join(screenshotDir, filename);
    
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot captured: ${filename}`);
    console.log(`📂 Saved to: ${filepath}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();
