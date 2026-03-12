import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DISPLAY_WIDTH = 528;
const DISPLAY_HEIGHT = 1520;
const OUTPUT_PATH = path.resolve(__dirname, '../public/display.pdf');

const run = async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT });
  await page.goto('http://localhost:3001/display', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  await page.pdf({
    path: OUTPUT_PATH,
    width: `${DISPLAY_WIDTH}px`,
    height: `${DISPLAY_HEIGHT}px`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  console.log(`PDF saved to ${OUTPUT_PATH}`);
  await browser.close();
};

run().catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
