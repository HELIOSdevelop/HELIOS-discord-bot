const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('Show the community FAQ.'),
  async execute(interaction, context) {
    const config = await context.services.configManager.get(interaction.guildId);
    await interaction.reply({
      embeds: [baseEmbed({ title: 'FAQ', description: config.faqText })]
    });
  }
};
