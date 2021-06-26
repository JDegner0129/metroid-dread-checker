# Metroid Dread Stock Checker

I got tired of refreshing a bunch of different vendors' listings for the Metroid Dread Special Edition. You can use this Docker image to do it for you. It's intended for use with a Discord channel webhook, but could easily be augmented to support other notifications.

## Setup

You'll need to add a `.env` file to your project for use with `dotenv`:

```
# .env file
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/my-discord-webhook
```

## Running

### OSX/Linux

You can run the included `run.sh` Bash script to start a Docker container and follow its logs:

```
> ./run.sh your-image-name-here
```

### Windows

You can run the included `run.ps1` PowerShell script to start a Docker container and follow its logs:

```
> ./run.ps1 -ImageName your-image-name-here
```

## Known Issues

- Walmart is a bit more intelligent around blocking web scrapers than the rest of the sites listed in `LISTING_URLS`, so there's a decent chance on any given run that your page loads will be blocked by a reCAPTCHA. I haven't gotten around to fixing that yet but might soon.
