const path = require('path');
const { REST, Routes } = require('discord.js');
const { loadCommands } = require('../utils/command-loader');

async function deployCommands({ token, clientId, guildIds, logger }) {
  if (!token || !clientId) {
    throw new Error('DISCORD_TOKEN and DISCORD_CLIENT_ID are required for command deployment.');
  }

  const commands = [...loadCommands(path.join(__dirname, '..', 'commands')).values()].map((command) =>
    command.data.toJSON()
  );

  const rest = new REST({ version: '10' }).setToken(token);

  if (guildIds.length) {
    for (const guildId of guildIds) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      if (logger?.info) {
        logger.info(`Registered commands for guild ${guildId}`);
      }
    }
    return;
  }

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  if (logger?.info) {
    logger.info('Registered global commands');
  }
}

module.exports = { deployCommands };
