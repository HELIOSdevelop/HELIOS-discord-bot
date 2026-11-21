const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const rootDir = path.resolve(__dirname, '..', '..');
const dataDir = path.resolve(rootDir, process.env.DATA_DIR || 'data');

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

module.exports = {
  rootDir,
  dataDir,
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.XAI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || process.env.OPENAI_MODEL || process.env.XAI_MODEL || 'gemini-2.0-flash',
  aiMaxImageAttachments: Number(process.env.AI_MAX_IMAGE_ATTACHMENTS || 3),
  aiMessageCooldownMs: Number(process.env.AI_MESSAGE_COOLDOWN_MS || 15000),
  aiMaxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS || 1400),
  guildIds: (process.env.DISCORD_GUILD_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 180000),
  presenceText: process.env.BOT_PRESENCE_TEXT || 'Managing the community',
  defaults: {
    welcomeEnabled: toBoolean(process.env.DEFAULT_WELCOME_ENABLED, true),
    levelingEnabled: toBoolean(process.env.DEFAULT_LEVELING_ENABLED, false),
    ticketTranscriptNotice: toBoolean(process.env.DEFAULT_TICKET_TRANSCRIPT_NOTICE, true)
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  autoDeployCommands: toBoolean(process.env.AUTO_DEPLOY_COMMANDS, true)
};
