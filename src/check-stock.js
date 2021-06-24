const checkStock = () => {
  const selectorsByHost = {
    'www.gamestop.com': '#add-to-cart',
    'www.walmart.com': '.prod-ProductCTA--primary',
    'www.amazon.com': '#buybox',
    'metroid.nintendo.com': '.buy-section__about--special',
    'www.target.com': '[data-test=preorderSellable]'
  };

  const selector = selectorsByHost[window.location.host];
  const element = window.document.querySelector(selector);

  const result = {
    host: window.location.host,
    url: window.location.href,
    inStock: false,
  };

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
