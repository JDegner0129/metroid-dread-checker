const dotenv = require('dotenv');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');

const { checkStock } = require('./check-stock');
const { sendDiscordMessage } = require('./discord');
const { sleep } = require('./utils');

dotenv.config();

// TODO: Just using stealth plugin and user-agent resets doesn't consistently get past Walmart
puppeteer.use(StealthPlugin());

const INTERVAL_MS = 10000;
const LISTING_URLS = [
  'https://www.amazon.com/dp/B097B15RT8/ref=sr_1_1',
  'https://www.gamestop.com/video-games/nintendo-switch/games/products/metroid-dread-special-edition---nintendo-switch/11149359.html',
  'https://www.walmart.com/ip/Metroid-Dread-Special-Edition-Nintendo-Switch-Physical/805331040',
  'https://www.target.com/p/metroid-dread-special-edition-nintendo-switch/-/A-83757259'
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
  });

  const pages = await Promise.all(LISTING_URLS.map(async url => {
    const page = await browser.newPage();

    const agent = new UserAgent();
    await page.setUserAgent(agent.toString());
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log(`Loaded ${url}`);
    return page;
  }));

  const dateFormatter = new Intl.DateTimeFormat('en-us', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Chicago'
  });

  while (true) {
    const checkStockPromises = pages.map(page => {
      console.log(`[${dateFormatter.format(new Date())}] Checking for stock at ${page.url()}`);

      return page.evaluate(checkStock);
    });
    const checkStockResults = await Promise.all(checkStockPromises);

    const discordMessagePromises = checkStockResults.map(async ({ host, url, inStock }) => {
      if (!inStock) return;

      await sendDiscordMessage(host, url);
    });
    await Promise.all(discordMessagePromises);

    const pageReloadPromises = pages.map(async p => {
      const newAgent = new UserAgent();

      await p.setUserAgent(newAgent.toString());
      await p.reload({ waitUntil: 'networkidle2' });
    });

    await Promise.all(pageReloadPromises);

    await sleep(INTERVAL_MS);
  }
})();
