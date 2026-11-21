const path = require('path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials
} = require('discord.js');
const env = require('./config/env');
const { Logger } = require('./utils/logger');
const { loadCommands } = require('./utils/command-loader');
const { registerEvents } = require('./utils/event-loader');
const { JsonFileAdapter } = require('./storage/json-file-adapter');
const { GuildConfigRepository } = require('./storage/guild-config-repository');
const { SuggestionRepository } = require('./storage/suggestion-repository');
const { TicketRepository } = require('./storage/ticket-repository');
const { ActivityRepository } = require('./storage/activity-repository');
const { RuntimeStateRepository } = require('./storage/runtime-state-repository');
const { ConfigManager } = require('./services/config-manager');
const { FiveMStatusService } = require('./services/fivem-status-service');
const { SuggestionService } = require('./services/suggestion-service');
const { TicketService } = require('./services/ticket-service');
const { ActivityService } = require('./services/activity-service');
const { AIAssistantService } = require('./services/ai-assistant-service');
const { FiveMPoller } = require('./jobs/fivem-poller');
const { deployCommands } = require('./services/command-deployment-service');

async function bootstrap() {
  const logger = new Logger(env.logLevel);

  if (!env.token || !env.clientId) {
    throw new Error('DISCORD_TOKEN and DISCORD_CLIENT_ID are required.');
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
  });

  const storageAdapter = new JsonFileAdapter(env.dataDir);
  const services = {};

  services.configManager = new ConfigManager(new GuildConfigRepository(storageAdapter), env.defaults);
  services.fivemStatusService = new FiveMStatusService();
  services.suggestionService = new SuggestionService(new SuggestionRepository(storageAdapter));
  services.ticketService = new TicketService(new TicketRepository(storageAdapter));
  services.activityService = new ActivityService(new ActivityRepository(storageAdapter), services.configManager);
  services.aiAssistantService = new AIAssistantService({
    apiKey: env.geminiApiKey,
    model: env.geminiModel,
    maxImageAttachments: env.aiMaxImageAttachments,
    messageCooldownMs: env.aiMessageCooldownMs,
    maxOutputTokens: env.aiMaxOutputTokens,
    logger
  });

  const runtimeStateRepository = new RuntimeStateRepository(storageAdapter);
  const jobs = {
    fivemPoller: new FiveMPoller({
      client,
      configManager: services.configManager,
      statusService: services.fivemStatusService,
      runtimeStateRepository,
      logger,
      intervalMs: env.pollIntervalMs
    })
  };

  const commands = new Collection(loadCommands(path.join(__dirname, 'commands')));

  const context = {
    env,
    logger,
    commands,
    services,
    jobs
  };

  registerEvents(client, path.join(__dirname, 'events'), context);

  process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection', { message: error.message });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { message: error.message });
  });

  if (env.autoDeployCommands) {
    await deployCommands({
      token: env.token,
      clientId: env.clientId,
      guildIds: env.guildIds,
      logger
    });
  }

  await client.login(env.token);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
