const fetch = require('isomorphic-fetch');

const sendDiscordMessage = async (message) => {
  const payload = {
    'content': `@everyone ${message}`,
    "allowed_mentions": {
      "parse": ["everyone"]
    }
  };

  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

module.exports = { sendDiscordMessage };
