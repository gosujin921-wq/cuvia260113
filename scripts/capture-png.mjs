import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto('http://localhost:3001/backwall3', { waitUntil: 'networkidle0' });

const element = await page.$('.relative.flex-shrink-0.overflow-hidden');
await element.screenshot({
  path: 'backwall3.png',
  type: 'png',
  omitBackground: true,
});

console.log('PNG saved: backwall3.png');
await browser.close();
