import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DISPLAY_WIDTH = 528;
const DISPLAY_HEIGHT = 1520;
const SCALE = 3;
const URL = 'http://localhost:3001/display';

const run = async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: DISPLAY_WIDTH,
    height: DISPLAY_HEIGHT,
    deviceScaleFactor: SCALE,
  });

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // PNG (pixel-perfect, 3x resolution)
  const pngPath = path.resolve(__dirname, '../public/display.png');
  await page.screenshot({
    path: pngPath,
    type: 'png',
    clip: { x: 0, y: 0, width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT },
  });
  console.log(`PNG saved: ${pngPath} (${DISPLAY_WIDTH * SCALE}x${DISPLAY_HEIGHT * SCALE}px)`);

  // PDF
  const pdfPath = path.resolve(__dirname, '../public/display.pdf');
  await page.pdf({
    path: pdfPath,
    width: `${DISPLAY_WIDTH}px`,
    height: `${DISPLAY_HEIGHT}px`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`PDF saved: ${pdfPath}`);

  await browser.close();
};

run().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
