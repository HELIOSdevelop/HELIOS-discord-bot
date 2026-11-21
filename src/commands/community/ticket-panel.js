const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, ticketPanelComponents, successEmbed } = require('../../utils/builders');
const { requireStaff } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Post a ticket panel in the current channel.'),
  async execute(interaction, context) {
    const config = await context.services.configManager.get(interaction.guildId);
    if (!(await requireStaff(interaction, config))) {
      return;
    }

    await interaction.channel.send({
      embeds: [
        baseEmbed({
          title: 'Support Tickets',
          description: 'Choose what you need help with below:\n🔧 Support\n🚨 Report player\n💰 Donation\n❓ General question'
        })
      ],
      components: ticketPanelComponents()
    });

    await interaction.reply({
      ephemeral: true,
      embeds: [successEmbed('Ticket panel posted.', 'Panel Created')]
    });
  }
};
