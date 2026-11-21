const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed } = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show the live FiveM server status for this Discord server.'),
  async execute(interaction, context) {
    const config = await context.services.configManager.get(interaction.guildId);
    if (!config.fivemServerAddress) {
      await interaction.reply({
        ephemeral: true,
        embeds: [errorEmbed('No FiveM server address has been configured yet.')]
      });
      return;
    }

    const status = await context.services.fivemStatusService.getStatus(config.fivemServerAddress);
    const embed = baseEmbed({
      title: 'FiveM Server Status',
      description: status.online ? 'The server is online and responding.' : 'The server is currently offline.'
    }).addFields(
      { name: 'Server Name', value: status.serverName || 'Unknown', inline: false },
      { name: 'Players', value: `${status.players}/${status.maxPlayers || '?'}`, inline: true },
      { name: 'Connect', value: `connect ${config.fivemConnectLabel || status.connect}`, inline: false }
    );

    await interaction.reply({ embeds: [embed] });
  }
};
