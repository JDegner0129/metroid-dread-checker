const fetch = require('isomorphic-fetch');

const sendDiscordMessage = async (host, url) => {
  const payload = {
    "content": `@everyone Metroid Dread Special Edition has been found in stock at ${host}! ${url}`,
    "allowed_mentions": {
      "parse": ["everyone"]
    }
  };

  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports = { sendDiscordMessage };
