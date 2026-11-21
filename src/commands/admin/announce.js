const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, successEmbed } = require('../../utils/builders');
const { requireStaff } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send a staff announcement embed.')
    .addChannelOption((option) =>
      option.setName('channel').setDescription('Target announcement channel').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('title').setDescription('Announcement title').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('message').setDescription('Announcement body').setRequired(true)
    ),
  async execute(interaction, context) {
    const config = await context.services.configManager.get(interaction.guildId);
    if (!(await requireStaff(interaction, config))) {
      return;
    }

    const channel = interaction.options.getChannel('channel', true);
    const title = interaction.options.getString('title', true);
    const message = interaction.options.getString('message', true);

    await channel.send({
      embeds: [baseEmbed({ title, description: message })]
    });

    await interaction.reply({
      ephemeral: true,
      embeds: [successEmbed(`Announcement sent in <#${channel.id}>.`, 'Announcement Sent')]
    });
  }
};
