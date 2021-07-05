const dotenv = require('dotenv');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');

const { checkStock } = require('./check-stock');
const { sendDiscordMessage } = require('./discord');
const { sleep, logWithTimestamp, performAsyncWithRetries } = require('./utils');

dotenv.config();

// TODO: Just using stealth plugin and user-agent resets doesn't consistently get past Walmart
puppeteer.use(StealthPlugin());

const INTERVAL_MS = 10000;
const RETRY_COUNT = 5;
const MAX_FAILURES = 10;
const NINTENDO_URL = 'https://www.nintendo.com/products/detail/metroid-dread-special-edition';
const LISTING_URLS = [
  NINTENDO_URL,
  'https://www.amazon.com/dp/B097B15RT8/ref=sr_1_1',
  'https://www.gamestop.com/video-games/nintendo-switch/games/products/metroid-dread-special-edition---nintendo-switch/11149359.html',
  'https://www.walmart.com/ip/Metroid-Dread-Special-Edition-Nintendo-Switch-Physical/805331040',
  'https://www.target.com/p/metroid-dread-special-edition-nintendo-switch/-/A-83757259'
];

let failureCount = 0;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
  });

  const pages = await Promise.all(LISTING_URLS.map(async url => {
    const page = await browser.newPage();

    const agent = new UserAgent();
    await page.setUserAgent(agent.toString());
    await page.goto(url, { waitUntil: 'networkidle0' });

    logWithTimestamp(`Loaded ${url}`);
    return page;
  }));

  while (failureCount < MAX_FAILURES) {
    try {
      const checkStockPromises = pages.map(async page => {
        logWithTimestamp(`Checking for stock at ${page.url()}`);

        return await performAsyncWithRetries(
          async () => {
            // If we're loading the Nintendo product page, we need to open a modal
            if (page.url().startsWith(NINTENDO_URL)) {
              page.click('#wtb-button');
              await sleep(500);
            }

            return page.evaluate(checkStock);
          },
          (err, retries) => logWithTimestamp(`Failed to check stock for ${page.url()}; retryCount=${retries}`, 'warn', err),
          RETRY_COUNT
        );
      });
      const checkStockResults = await Promise.all(checkStockPromises);

      const discordMessagePromises = checkStockResults.map(async ({ host, url, inStock, logOutput }) => {
        const stockFoundMessage = inStock ? 'Stock found' : 'No stock found';
        logWithTimestamp(`${stockFoundMessage} at ${host}`);

        if (logOutput) logWithTimestamp(logOutput);
        if (!inStock) return;

        await performAsyncWithRetries(
          () => sendDiscordMessage(`Metroid Dread Special Edition has been found in stock at ${host}! ${url}`),
          (err, retries) => logWithTimestamp(`Failed to send Discord message for ${host}; retryCount=${retries}`, 'warn', err),
          RETRY_COUNT
        );
      });
      await Promise.all(discordMessagePromises);

      const pageReloadPromises = pages.map(async page => {
        const newAgent = new UserAgent();

        await page.setUserAgent(newAgent.toString());

        await performAsyncWithRetries(
          () => page.reload({ waitUntil: 'networkidle0' }),
          (err, retries) => logWithTimestamp(`Failed to reload ${page.url()}; retryCount=${retries}`, 'warn', err),
          RETRY_COUNT);
      });
      await Promise.all(pageReloadPromises);

      failureCount = 0;
    } catch (err) {
      failureCount += 1;

      try {
        const message = `A failure prevented the checker process from checking for stock. It might need attention. :eyes: ${err}`;

        logWithTimestamp(message, 'error');
        await sendDiscordMessage(message);
      } catch (innerErr) {
        // We could use performAsyncWithRetries, but if we reach this sort of failure, it's unlikely that quick retries would help
        logWithTimestamp('Failed to send script failure message to Discord', 'error', innerErr);
      }
    } finally {
      await sleep(INTERVAL_MS);
    }
  }
})();
