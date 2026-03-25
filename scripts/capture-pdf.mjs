import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto('http://localhost:3001/backwall3', { waitUntil: 'networkidle0' });

const element = await page.$('.relative.flex-shrink-0.overflow-hidden');
const box = await element.boundingBox();

await page.pdf({
  path: 'backwall3.pdf',
  width: `${box.width}px`,
  height: `${box.height}px`,
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

console.log('PDF saved: backwall3.pdf');
await browser.close();
