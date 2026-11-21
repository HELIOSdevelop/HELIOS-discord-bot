const { ChannelType } = require('discord.js');
const { baseEmbed } = require('../utils/builders');

class FiveMPoller {
  constructor({ client, configManager, statusService, runtimeStateRepository, logger, intervalMs }) {
    this.client = client;
    this.configManager = configManager;
    this.statusService = statusService;
    this.runtimeStateRepository = runtimeStateRepository;
    this.logger = logger;
    this.intervalMs = intervalMs;
    this.timer = null;
  }

  start() {
    this.stop();
    this.timer = setInterval(() => {
      this.tick().catch((error) => {
        this.logger.error('FiveM poller tick failed', { message: error.message });
      });
    }, this.intervalMs);

    this.tick().catch((error) => {
      this.logger.error('Initial FiveM poller tick failed', { message: error.message });
    });
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick() {
    const configs = await this.configManager.getAll();

    for (const [guildId, config] of Object.entries(configs)) {
      if (!config.fivemServerAddress) {
        continue;
      }

      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) {
        continue;
      }

      const status = await this.statusService.getStatus(config.fivemServerAddress);
      await this.updateStatusChannel(guild, config, status);
      await this.updateStatusVoiceChannel(guild, config, status);
      await this.sendTransitions(guild, config, status);
    }
  }

  async updateStatusChannel(guild, config, status) {
    if (!config.statusChannelId) {
      return;
    }

    const channel = await guild.channels.fetch(config.statusChannelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return;
    }

    const embed = baseEmbed({
      title: 'FiveM Server Status',
      description: status.online ? 'The server is online.' : 'The server is currently offline.'
    }).addFields(
      { name: 'Server', value: status.serverName || 'Unknown', inline: false },
      { name: 'Players', value: `${status.players}/${status.maxPlayers || '?'}`, inline: true },
      { name: 'Connect', value: `connect ${config.fivemConnectLabel || status.connect}`, inline: false }
    );

    if (config.statusMessageId) {
      const message = await channel.messages.fetch(config.statusMessageId).catch(() => null);
      if (message) {
        await message.edit({ embeds: [embed] });
        return;
      }
    }

    const message = await channel.send({ embeds: [embed] });
    await this.configManager.update(guild.id, { statusMessageId: message.id });
  }

  async updateStatusVoiceChannel(guild, config, status) {
    if (!config.statusVoiceChannelId) {
      return;
    }

    const channel = await guild.channels.fetch(config.statusVoiceChannelId).catch(() => null);
    if (!channel) {
      return;
    }

    const nextName = status.online
      ? `Server: ${status.players}/${status.maxPlayers || '?'}`
      : 'Server: Offline';

    if (channel.name !== nextName) {
      await channel.setName(nextName).catch(() => null);
    }
  }

  async sendTransitions(guild, config, status) {
    const stateKey = `fivem:${guild.id}`;
    const current = await this.runtimeStateRepository.get(stateKey, { online: null });
    if (current.online === status.online) {
      return;
    }

    await this.runtimeStateRepository.set(stateKey, {
      online: status.online,
      changedAt: new Date().toISOString()
    });

    const targetChannelId = config.logChannelId || config.statusChannelId;
    if (!targetChannelId) {
      return;
    }

    const channel = await guild.channels.fetch(targetChannelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return;
    }

    await channel.send({
      embeds: [
        baseEmbed({
          color: status.online ? 0x2f9e44 : 0xcc3344,
          title: status.online ? 'FiveM Server Back Online' : 'FiveM Server Offline',
          description: status.online
            ? `${status.serverName} is reachable again with ${status.players}/${status.maxPlayers || '?'} players.`
            : `${status.serverName} is no longer responding to status checks.`
        })
      ]
    });
  }
}

module.exports = { FiveMPoller };
