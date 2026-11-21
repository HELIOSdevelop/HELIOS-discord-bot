# HELIOS Discord Bot

A production-ready, community-first Discord bot for a FiveM community server. The project focuses on Discord community management first, with lightweight FiveM companion features like live status, player count, server alerts, and connect info.

## Features

### Community
- Welcome messages on member join
- Self-assign role panel using a select menu
- Ticket panel with private support channels
- Suggestion flow with modal submission and approve, stage, deny actions
- Staff announcement command
- Rules, FAQ, and info commands backed by per-guild config
- Optional activity tracking structure that can be toggled on or off
- Optional AI assistant for FiveM questions and image review

### FiveM
- `/status` slash command for live FiveM server status
- Online and offline detection
- Server name, player count, max slots, and connect string
- Background poller to keep a status message fresh
- Optional status voice channel renaming for live player counts
- Offline and recovery alerts sent to your configured Discord channels
- Restart reminder command for staff

### Admin / Config
- Per-guild configuration stored through a swappable repository layer
- Staff role based permission checks
- Configurable welcome, log, status, suggestion, and ticket locations
- Configurable AI channel and AI toggles
- Simple JSON-backed persistence with service and repository abstractions

## Tech Stack

- Node.js 18+
- `discord.js` v14
- Slash commands
- Modular service-oriented architecture
- Environment variables for secrets
- JSON repository adapter that can be replaced later with SQLite, Postgres, Redis, or another backend

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in:

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_IDS=comma,separated,guild,ids
BOT_PRESENCE_TEXT=Managing the community
POLL_INTERVAL_MS=180000
DEFAULT_WELCOME_ENABLED=true
DEFAULT_LEVELING_ENABLED=false
DEFAULT_TICKET_TRANSCRIPT_NOTICE=true
LOG_LEVEL=info
DATA_DIR=./data
AUTO_DEPLOY_COMMANDS=true
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
AI_MAX_IMAGE_ATTACHMENTS=3
```

3. Invite your bot with these scopes and permissions:
- Scopes: `bot`, `applications.commands`
- Recommended permissions: Manage Roles, Manage Channels, Send Messages, Embed Links, Read Message History, View Channels

4. Register slash commands:

```bash
npm run deploy:commands
```

5. Start the bot:

```bash
npm start
```

## Pterodactyl Deployment

This project is ready for a generic Node.js Pterodactyl host. It does not rely on native modules, databases, or background daemons outside the main Node process, so it works well on a standard Node egg.

### Recommended Pterodactyl Settings

- Egg: Generic Node.js
- Node version: 20 or newer
- Startup command: `npm start`
- Install command: `npm install --omit=dev`

### Files to Upload

Upload the full contents of the project folder:

```text
HELIOS-discord-bot/
```

That includes:
- `package.json`
- `src/`
- `scripts/`
- `README.md`
- `.env` or panel environment variables

### Environment Variables

You can either:
- create a `.env` file in the server root, or
- define the same values in the Pterodactyl startup environment if your egg supports them

Minimum required values:

```env
DISCORD_TOKEN=your_token
DISCORD_CLIENT_ID=your_application_id
```

Recommended production values:

```env
DISCORD_GUILD_IDS=your_test_guild_id
BOT_PRESENCE_TEXT=Managing the community
POLL_INTERVAL_MS=180000
DEFAULT_WELCOME_ENABLED=true
DEFAULT_LEVELING_ENABLED=false
DEFAULT_TICKET_TRANSCRIPT_NOTICE=true
LOG_LEVEL=info
DATA_DIR=./data
AUTO_DEPLOY_COMMANDS=true
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
AI_MAX_IMAGE_ATTACHMENTS=3
```

### First Boot on Pterodactyl

1. Upload the project files.
2. Install dependencies with:

```bash
npm install --omit=dev
```

3. Register slash commands:

```bash
npm run deploy:commands
```

4. Start the bot with:

```bash
npm start
```

### Persistence Notes

- Guild config, ticket state, suggestions, activity, and runtime status are stored in `./data`.
- On Pterodactyl, make sure the container can write to the bot directory so JSON persistence works correctly.
- If your host wipes files on reinstall, back up the `data/` folder first.

### Panel-Friendly Workflow

- Use `DISCORD_GUILD_IDS` during setup so slash command updates register instantly in your test Discord server.
- Once everything is working, you can clear `DISCORD_GUILD_IDS` and redeploy commands globally if you want wider rollout.
- Restart the server from the panel after changing environment variables.

## First-Time Guild Configuration

After the bot joins your Discord server, configure it with slash commands:

```text
/config set-channel key:welcome_channel channel:#welcome
/config set-channel key:log_channel channel:#staff-logs
/config set-channel key:status_channel channel:#server-status
/config set-channel key:suggestion_channel channel:#suggestions
/config set-channel key:ai_channel channel:#ai-help
/config set-channel key:ticket_category channel:Support Tickets
/config set-role action:add role:@Staff
/config set-text key:fivem_address value:127.0.0.1:30120
/config set-text key:connect_label value:127.0.0.1:30120
```

Optional:

```text
/config set-channel key:status_voice_channel channel:Server Status
/config set-channel key:restart_reminder_channel channel:#announcements
/config toggle key:activity_tracking value:true
/config toggle key:ai_enabled value:true
/config toggle key:ai_image_review value:true
```

Use `/config view` at any time to inspect the current guild settings.

## AI Assistant

- Set `GEMINI_API_KEY` in `.env` or in your host environment.
- `/ask-fivem` lets members ask FiveM questions directly.
- If `ai_enabled` is on, the bot also replies in the configured AI channel or when mentioned.
- If `ai_image_review` is on, attached images are inspected and included in the answer.

## FiveM Status Notes

- The status service tries `info.json`, `dynamic.json`, and `players.json`.
- The configured FiveM address should usually look like `127.0.0.1:30120`.
- The bot treats the server as online if any of the public status endpoints respond.
- The background poller updates the configured status message and can also rename a voice channel like `Server: 42/64`.

## Any Questions? Place A Comment!