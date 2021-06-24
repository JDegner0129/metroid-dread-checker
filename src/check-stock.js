const checkStock = () => {
  const selectorsByHost = {
    'www.gamestop.com': '#add-to-cart',
    'www.walmart.com': '.prod-ProductCTA--primary',
    'www.amazon.com': '#buybox',
    'metroid.nintendo.com': '.buy-section__about--special',
    'www.target.com': '[data-test=preorderSellable]'
  };

  const result = {
    host: window.location.host,
    url: window.location.href,
    inStock: false,
  };

  // Nintendo's page works a bit differently in that we're checking stock status of multiple vendors in a modal
  if (window.location.host === 'www.nintendo.com') {
    const stockTexts = document.getElementsByClassName('ps-stock-status');

    if (!stockTexts.length) {
      result.logOutput = `No stock statuses rendered on www.nintendo.com`;
      return result;
    }

    for (const el of stockTexts) {
      if (!el.innerText) continue;

      const lowerText = el.innerText.toLowerCase().trim();
      if (lowerText !== 'out of stock' && lowerText !== 'see website') {
        result.logOutput = `Found potential stock in Nintendo modal: ${lowerText}`;
        result.inStock = true;
        break;
      }
    }

    return result;
  }

  const selector = selectorsByHost[window.location.host];
  const element = window.document.querySelector(selector);

  if (!element) {
    result.inStock = false;
  }
  else if (window.location.host === 'metroid.nintendo.com') {
    result.inStock = element.getElementsByClassName('coming-soon').length === 0;
  }
  else if (window.location.host === 'www.amazon.com') {
    result.inStock = element.firstElementChild.id.startsWith('qualifiedBuyBox');
  }
  else if (window.location.host === 'www.walmart.com') {
    result.inStock = element.textContent && element.textContent !== 'Get in-stock alert';
  }
  else {
    result.inStock = !element.disabled;
  }

  return result;
};

module.exports = { checkStock };
