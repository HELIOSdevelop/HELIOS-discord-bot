const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Show the community information card.'),
  async execute(interaction, context) {
    const config = await context.services.configManager.get(interaction.guildId);
    await interaction.reply({
      embeds: [baseEmbed({ title: 'Community Info', description: config.infoText })]
    });
  }
};
