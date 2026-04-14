import puppeteer from 'puppeteer';
import fs        from 'fs';
import path      from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL  = process.argv[2] || 'http://localhost:3000';

const pages = [
  { name: 'index',  url: BASE_URL + '/index.html'  },
  { name: 'signup', url: BASE_URL + '/signup.html' },
];

const outDir = path.join(__dirname, 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const p of pages) {
    const page = await browser.newPage();

    // 데스크톱 (1280×900)
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(p.url, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(outDir, `${p.name}-desktop.png`), fullPage: true });
    console.log(`📸  ${p.name}-desktop.png`);

    // 모바일 (390×844, iPhone 14)
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(p.url, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(outDir, `${p.name}-mobile.png`), fullPage: true });
    console.log(`📸  ${p.name}-mobile.png`);
  }

  await browser.close();
  console.log(`\n✅  스크린샷 저장 완료 → screenshots/`);
})();
