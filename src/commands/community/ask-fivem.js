const { SlashCommandBuilder } = require('discord.js');
const { chunkText } = require('../../utils/text');
const { errorEmbed } = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask-fivem')
    .setDescription('Ask the AI a FiveM-related question.')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('Your FiveM question')
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName('image')
        .setDescription('Optional image for the AI to inspect')
    ),
  async execute(interaction, context) {
    const config = await context.services.configManager.get(interaction.guildId);
    const aiService = context.services.aiAssistantService;

    if (!config.aiEnabled) {
      await interaction.reply({
        ephemeral: true,
        embeds: [errorEmbed('AI support is not enabled for this Discord server yet.')]
      });
      return;
    }

    if (!aiService.isConfigured()) {
      await interaction.reply({
        ephemeral: true,
        embeds: [errorEmbed('GEMINI_API_KEY is not configured on the host yet.')]
      });
      return;
    }

    await interaction.deferReply();

    const question = interaction.options.getString('question', true);
    const image = interaction.options.getAttachment('image');
    const attachments = image?.contentType?.startsWith('image/') ? [image] : [];

    try {
      const reply = await aiService.answerFiveMQuestion({
        prompt: question,
        attachments,
        config,
        memberName: interaction.user.tag,
        guildName: interaction.guild.name
      });

      const parts = chunkText(reply);
      await interaction.editReply(parts[0]);
      for (const part of parts.slice(1)) {
        await interaction.followUp(part);
      }
    } catch (error) {
      await interaction.editReply({
        embeds: [errorEmbed(aiService.getUserFacingError(error))]
      });
    }
  }
};
