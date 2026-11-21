const { SlashCommandBuilder } = require('discord.js');
const { successEmbed } = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is alive.'),
  async execute(interaction) {
    await interaction.reply({
      embeds: [successEmbed(`Pong. Websocket latency: ${interaction.client.ws.ping}ms`, 'Bot Status')]
    });
  }
};
