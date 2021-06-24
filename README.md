# Metroid Dread Stock Checker

I got tired of refreshing a bunch of different vendors' listings for the Metroid Dread Special Edition. You can use this Docker image to do it for you. It's intended for use with a Discord channel webhook, but could easily be augmented to support other notifications.

## Setup

You'll need to add a `.env` file to your project for use with `dotenv` or otherwise pass a DISCORD_WEBHOOK_URL environment variable into the Node process:

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/my-discord-webhook
```

After that, you can run the code natively using `yarn start` (though you may need to work around native environment issues with Puppeteer) or in Docker using something like `docker run --init <your-container-tag>` after building the Docker image.

## Known Issues

- Walmart is a bit more intelligent around blocking web scrapers than the rest of the sites listed in `LISTING_URLS`, so there's a decent chance on any given run that your page loads will be blocked by a reCAPTCHA. I haven't gotten around to fixing that yet but might soon.
