const { routeInteraction } = require('../../components/interaction-router');
const { errorEmbed } = require('../../utils/builders');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, context) {
    try {
      await routeInteraction(interaction, context.services);

      if (!interaction.isChatInputCommand()) {
        return;
      }

      const command = context.commands.get(interaction.commandName);
      if (!command) {
        return;
      }

      if (interaction.commandName === 'suggest') {
        return;
      }

      await command.execute(interaction, context);
    } catch (error) {
      context.logger.error('Interaction handling failed', {
        command: interaction.commandName,
        customId: interaction.customId,
        message: error.message
      });

      const payload = {
        ephemeral: true,
        embeds: [errorEmbed('An unexpected error occurred while handling that interaction.')]
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
  }
};
