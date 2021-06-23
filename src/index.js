const fetch = require('isomorphic-fetch');
const puppeteer = require('puppeteer-extra');
const UserAgent = require('user-agents');

require('dotenv').config();

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const INTERVAL_MS = 10000;
const LISTING_URLS = [
  'https://www.amazon.com/dp/B097B15RT8/ref=sr_1_1',
  'https://www.gamestop.com/video-games/nintendo-switch/games/products/metroid-dread-special-edition---nintendo-switch/11149359.html',
  'https://www.walmart.com/ip/Metroid-Dread-Special-Edition-Nintendo-Switch-Physical/805331040',
  'https://www.target.com/p/metroid-dread-special-edition-nintendo-switch/-/A-83757259'
];

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
  });
  const pages = [];
  for (const url of LISTING_URLS) {
    const page = await browser.newPage();

    const agent = new UserAgent();
    await page.setUserAgent(agent.toString());
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log(`Loaded ${url}`);

    pages.push(page);
  }

  while (true) {
    const evalPromises = pages.map(p => {
      console.log(`[${new Date().toLocaleTimeString()}] Checking for stock at ${p.url()}`);
      
      p.evaluate(
        pageScript,
        process.env.DISCORD_WEBHOOK_URL
      )
    });

    await Promise.all(evalPromises);

    await sleep(INTERVAL_MS);

    await Promise.all(pages.map(async p => {
      const newAgent = new UserAgent();

      await p.setUserAgent(newAgent.toString());
      await p.reload({ waitUntil: 'networkidle2' });
    }));
  }
})();

const pageScript = async (webhookUrl) => {
  const canAddToCart = () => {
    const selectorsByHost = {
      'www.bestbuy.com': '.add-to-cart-button',
      'www.gamestop.com': '#add-to-cart',
      'www.walmart.com': '.prod-ProductCTA--primary',
      'www.amazon.com': '#buybox',
      'metroid.nintendo.com': '.buy-section__about--special',
      'www.target.com': '[data-test=preorderUnsellable]'
    };

    const selector = selectorsByHost[window.location.host];
    const element = window.document.querySelector(selector);

    try {
      if (window.location.host === 'metroid.nintendo.com') {
        return element.getElementsByClassName('coming-soon').length === 0;
      }

      if (window.location.host === 'www.amazon.com') {
        return !element.firstElementChild.id.startsWith('outOfStockBuyBox');
      }

      if (window.location.host === 'www.walmart.com') {
        return element.textContent !== 'Get in-stock alert';
      }

      if (window.location.host === 'www.target.com') {
        return window.document.querySelector('[data-test=flexible-fulfillment]') && !element;
      }

      return !element.disabled;
    } catch {
      return false;
    }
  };

  const sendDiscordMessage = async () => {
    const payload = {
      "content": `@everyone Metroid Dread Special Edition has been found in stock at ${window.location.host}! ${window.location.href}`,
      "allowed_mentions": {
        "parse": ["everyone"]
      }
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.log(err);
    }
  };

  if (!canAddToCart()) return;

  await sendDiscordMessage();
};
