const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, successEmbed, errorEmbed } = require('../../utils/builders');
const { requireStaff } = require('../../utils/permissions');
const { addMinutes, toRelativeUnix } = require('../../utils/time');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restart-reminder')
    .setDescription('Send a scheduled-style restart reminder embed immediately.')
    .addIntegerOption((option) =>
      option.setName('minutes').setDescription('Minutes until restart').setRequired(true).setMinValue(1).setMaxValue(180)
    )
    .addChannelOption((option) =>
      option.setName('channel').setDescription('Optional override channel')
    ),
  async execute(interaction, context) {
    const config = await context.services.configManager.get(interaction.guildId);
    if (!(await requireStaff(interaction, config))) {
      return;
    }

    const minutes = interaction.options.getInteger('minutes', true);
    const target = interaction.options.getChannel('channel') ||
      (config.restartReminderChannelId ? await interaction.guild.channels.fetch(config.restartReminderChannelId).catch(() => null) : null) ||
      interaction.channel;

    if (!target) {
      await interaction.reply({ ephemeral: true, embeds: [errorEmbed('No valid channel was available for the reminder.')] });
      return;
    }

    const restartAt = addMinutes(new Date(), minutes);
    await target.send({
      embeds: [
        baseEmbed({
          title: 'Scheduled Restart Reminder',
          description: `The FiveM server is scheduled to restart <t:${toRelativeUnix(restartAt)}:R>.`
        })
      ]
    });

    await interaction.reply({
      ephemeral: true,
      embeds: [successEmbed(`Restart reminder sent in <#${target.id}>.`, 'Reminder Sent')]
    });
  }
};
