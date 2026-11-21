const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Show the community rules.'),
  async execute(interaction, context) {
    const config = await context.services.configManager.get(interaction.guildId);
    await interaction.reply({
      embeds: [baseEmbed({ title: 'Community Rules', description: config.rulesText })]
    });
  }
};
