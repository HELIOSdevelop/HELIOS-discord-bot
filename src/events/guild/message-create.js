const { chunkText } = require('../../utils/text');

module.exports = {
  name: 'messageCreate',
  async execute(message, context) {
    await context.services.activityService.trackMessage(message);

    if (!message.guild || message.author.bot) {
      return;
    }

    const config = await context.services.configManager.get(message.guild.id);
    const aiService = context.services.aiAssistantService;
    if (!aiService.shouldHandleMessage(message, config)) {
      return;
    }

    const cooldownRemaining = aiService.getRemainingCooldown(message);
    if (cooldownRemaining > 0) {
      return;
    }

    await message.channel.sendTyping().catch(() => null);

    const imageAttachments = config.aiImageReviewEnabled
      ? aiService.getImageAttachments(message.attachments)
      : [];
    const prompt = message.content.replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), '').trim()
      || (imageAttachments.length ? 'Check these attached image(s) and explain what is relevant for FiveM or community support.' : '');

    if (!prompt) {
      return;
    }

    try {
      aiService.startCooldown(message);

      const reply = await aiService.answerFiveMQuestion({
        prompt,
        attachments: imageAttachments,
        config,
        memberName: message.author.tag,
        guildName: message.guild.name
      });

      const parts = chunkText(reply);
      await message.reply(parts[0]);
      for (const part of parts.slice(1)) {
        await message.channel.send(part);
      }
    } catch (error) {
      context.logger.error('AI message handling failed', {
        message: error.message,
        guildId: message.guild.id
      });
      await message.reply(aiService.getUserFacingError(error)).catch(() => null);
    }
  }
};
