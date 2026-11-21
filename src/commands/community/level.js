const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, successEmbed } = require('../../utils/builders');
const { requireStaff } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leveling')
    .setDescription('Manage the optional activity tracking system.')
    .addSubcommand((subcommand) => subcommand.setName('status').setDescription('Show your current activity stats.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('enable')
        .setDescription('Enable activity tracking for this guild.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('disable')
        .setDescription('Disable activity tracking for this guild.')
    ),
  async execute(interaction, context) {
    const subcommand = interaction.options.getSubcommand();
    const config = await context.services.configManager.get(interaction.guildId);

    if (subcommand === 'status') {
      const stats = await context.services.activityService.getStats(interaction.guildId, interaction.user.id);
      await interaction.reply({
        embeds: [
          baseEmbed({
            title: 'Activity Stats',
            description: config.activityTrackingEnabled ? 'Tracking is currently enabled.' : 'Tracking is currently disabled.'
          }).addFields(
            { name: 'Messages', value: String(stats.messages), inline: true },
            { name: 'XP', value: String(stats.xp), inline: true }
          )
        ]
      });
      return;
    }

    if (!(await requireStaff(interaction, config))) {
      return;
    }

    const enabled = subcommand === 'enable';
    await context.services.configManager.update(interaction.guildId, {
      activityTrackingEnabled: enabled,
      levelingEnabled: enabled
    });

    await interaction.reply({
      embeds: [successEmbed(`Activity tracking has been ${enabled ? 'enabled' : 'disabled'}.`, 'Leveling Updated')]
    });
  }
};
